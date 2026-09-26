import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Conversation, User } from "../models/index.js";
import {
    getOrCreateConversation,
    postMessage,
    markRead,
    isStaff,
    unreadCounts,
} from "./chatService.js";

// Live chat between a customer and staff.
//
// The browser cannot authenticate this connection with the session cookie: the
// cookie is httpOnly and belongs to the Next origin, not this one. So the page
// asks Next for a short-lived ticket, Next mints it here using the session it
// can read server-side, and the ticket is what the socket presents. A ticket is
// good for sixty seconds and for nothing except opening a socket, so handing it
// to browser JavaScript gives away far less than the session token would.

export const SOCKET_TICKET_TTL_SECONDS = 60;

const TICKET_AUDIENCE = "socket";

export const mintSocketTicket = (user) =>
    jwt.sign(
        { id: user.id, role: user.role, aud: TICKET_AUDIENCE },
        process.env.JWT_SECRET,
        { expiresIn: SOCKET_TICKET_TTL_SECONDS }
    );

const verifySocketTicket = (ticket) =>
    jwt.verify(ticket, process.env.JWT_SECRET, { audience: TICKET_AUDIENCE });

// Rooms:
//   conversation:<id>  the customer and whichever staff have it open
//   staff              every signed-in staff member, for inbox badges
const conversationRoom = (id) => `conversation:${id}`;
const STAFF_ROOM = "staff";

let io = null;

export const getIo = () => io;

export const initRealtime = (httpServer, { corsOrigin }) => {
    io = new Server(httpServer, {
        cors: { origin: corsOrigin, credentials: true },
        // Long-polling first would work, but this API is only ever reached from
        // our own front end, which supports WebSocket.
        transports: ["websocket", "polling"],
    });

    io.use(async (socket, next) => {
        try {
            const ticket = socket.handshake.auth?.ticket;

            if (!ticket) return next(new Error("No ticket supplied"));

            const decoded = verifySocketTicket(ticket);
            const user = await User.findByPk(decoded.id);

            if (!user) return next(new Error("Account not found"));
            if (!user.isActive) return next(new Error("Account is deactivated"));

            socket.user = user;
            next();
        } catch {
            next(new Error("That connection could not be authenticated"));
        }
    });

    io.on("connection", (socket) => {
        const { user } = socket;

        // Handlers are registered synchronously, BEFORE any await. Socket.IO
        // delivers events as they arrive: anything that landed while an async
        // setup step was still running would find no listener, and the sender
        // would wait for an acknowledgement that never came. A customer whose
        // page connects and sends straight away would lose that first message.
        //
        // The room join below is therefore awaited after registration, and
        // every handler resolves the conversation itself rather than relying
        // on setup having finished.

        // A customer only ever belongs to their own conversation. Joining is
        // done here rather than on request, so no client can ask to listen to
        // somebody else's thread.
        const joined = isStaff(user)
            ? Promise.resolve(socket.join(STAFF_ROOM))
            : getOrCreateConversation(user.id).then((conversation) => {
                  socket.join(conversationRoom(conversation.id));
                  socket.conversationId = conversation.id;
                  return conversation;
              });

        // Swallowed here and surfaced per-event instead, so a failed join
        // cannot take the whole connection down.
        joined.catch(() => {});

        // Staff open a specific customer's thread.
        socket.on("conversation:open", async (payload, ack) => {
            if (!isStaff(user)) return ack?.({ ok: false, message: "Not allowed" });

            const conversation = await Conversation.findByPk(Number(payload?.conversationId));

            if (!conversation) return ack?.({ ok: false, message: "Conversation not found" });

            // Leave any previously opened thread so a staff member watching
            // customer B stops receiving customer A's messages.
            for (const room of socket.rooms) {
                if (room.startsWith("conversation:")) socket.leave(room);
            }

            socket.join(conversationRoom(conversation.id));
            ack?.({ ok: true, conversationId: conversation.id });
        });

        socket.on("message:send", async (payload, ack) => {
            try {
                const conversation = isStaff(user)
                    ? await Conversation.findByPk(Number(payload?.conversationId))
                    : await getOrCreateConversation(user.id);

                if (!conversation) {
                    return ack?.({ ok: false, message: "Conversation not found" });
                }

                // A customer may only ever write to their own thread, whatever
                // conversationId the payload claims.
                if (!isStaff(user) && conversation.userId !== user.id) {
                    return ack?.({ ok: false, message: "Not allowed" });
                }

                const message = await postMessage({
                    conversation,
                    sender: user,
                    body: payload?.body,
                    productId: payload?.productId,
                });

                io.to(conversationRoom(conversation.id)).emit("message:new", message);

                // Staff not currently in this thread still need their inbox to
                // move, so the summary goes to everyone on the staff side.
                const unread = await unreadCounts(conversation);

                io.to(STAFF_ROOM).emit("conversation:updated", {
                    id: conversation.id,
                    userId: conversation.userId,
                    lastMessageAt: conversation.lastMessageAt,
                    lastMessagePreview: conversation.lastMessagePreview,
                    unreadForStaff: unread.forStaff,
                });

                ack?.({ ok: true, message });
            } catch (error) {
                ack?.({ ok: false, message: error.message });
            }
        });

        socket.on("conversation:read", async (payload, ack) => {
            try {
                const conversation = isStaff(user)
                    ? await Conversation.findByPk(Number(payload?.conversationId))
                    : await getOrCreateConversation(user.id);

                if (!conversation) return ack?.({ ok: false });

                if (!isStaff(user) && conversation.userId !== user.id) {
                    return ack?.({ ok: false });
                }

                await markRead(conversation, user);

                if (isStaff(user)) {
                    io.to(STAFF_ROOM).emit("conversation:updated", {
                        id: conversation.id,
                        unreadForStaff: 0,
                    });
                }

                ack?.({ ok: true });
            } catch {
                ack?.({ ok: false });
            }
        });

        socket.on("typing", async (payload) => {
            // May run before the join above has resolved, so the customer's
            // conversation is looked up rather than read off the socket.
            const conversationId = isStaff(user)
                ? Number(payload?.conversationId)
                : (socket.conversationId ??
                   (await getOrCreateConversation(user.id).catch(() => null))?.id);

            if (!conversationId) return;

            // Broadcast, so the sender is not told about their own typing.
            socket.to(conversationRoom(conversationId)).emit("typing", {
                conversationId,
                from: isStaff(user) ? "staff" : "customer",
                name: user.firstName,
            });
        });
    });

    return io;
};

// Used by the REST fallback so a message sent over HTTP still appears live for
// anyone with a socket open.
export const broadcastMessage = async (conversation, message) => {
    if (!io) return;

    io.to(conversationRoom(conversation.id)).emit("message:new", message);

    const unread = await unreadCounts(conversation);

    io.to(STAFF_ROOM).emit("conversation:updated", {
        id: conversation.id,
        userId: conversation.userId,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: conversation.lastMessagePreview,
        unreadForStaff: unread.forStaff,
    });
};
