import { Conversation, User } from "../models/index.js";
import {
    getOrCreateConversation,
    loadMessages,
    postMessage,
    markRead,
    unreadCounts,
    listConversations,
    isStaff,
} from "../services/chatService.js";
import { broadcastMessage, mintSocketTicket } from "../services/realtime.js";

// HTTP alongside the socket. The page renders its history from here, and
// sending falls back to here if the socket is not connected — so the chat still
// works on a network that blocks WebSocket, just without the live push.

// @desc    A short-lived ticket for opening a socket
// @route   POST /api/chat/ticket
export const getSocketTicket = (req, res) => {
    res.status(200).json({ ticket: mintSocketTicket(req.user) });
};

// ─── Customer ────────────────────────────────────────────────────────────────

// @desc    The signed-in customer's conversation and its history
// @route   GET /api/chat/mine
export const getMyConversation = async (req, res) => {
    try {
        const conversation = await getOrCreateConversation(req.user.id);
        const [messages, unread] = await Promise.all([
            loadMessages(conversation.id),
            unreadCounts(conversation),
        ]);

        res.status(200).json({
            conversation: {
                id: conversation.id,
                lastMessageAt: conversation.lastMessageAt,
            },
            messages,
            unread: unread.forCustomer,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Send a message as the signed-in customer
// @route   POST /api/chat/mine    body: { body, productId }
export const sendMyMessage = async (req, res) => {
    try {
        const conversation = await getOrCreateConversation(req.user.id);

        const message = await postMessage({
            conversation,
            sender: req.user,
            body: req.body.body,
            productId: req.body.productId,
        });

        await broadcastMessage(conversation, message);

        res.status(201).json({ message });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark the customer's conversation read
// @route   POST /api/chat/mine/read
export const readMyConversation = async (req, res) => {
    try {
        const conversation = await getOrCreateConversation(req.user.id);
        await markRead(conversation, req.user);

        res.status(200).json({ message: "Marked as read." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Staff ───────────────────────────────────────────────────────────────────

// @desc    Every conversation, newest activity first
// @route   GET /api/chat/conversations?unread=true   (admin, employee)
export const getConversations = async (req, res) => {
    try {
        const conversations = await listConversations({
            unreadOnly: req.query.unread === "true",
        });

        res.status(200).json({ count: conversations.length, conversations });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    One conversation's history
// @route   GET /api/chat/conversations/:id   (admin, employee)
export const getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "firstName", "lastName", "email", "phone"],
                },
            ],
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await loadMessages(conversation.id);

        res.status(200).json({
            conversation: {
                id: conversation.id,
                userId: conversation.userId,
                customer: conversation.customer,
                lastMessageAt: conversation.lastMessageAt,
            },
            messages,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Reply to a customer
// @route   POST /api/chat/conversations/:id   (admin, employee)
export const replyToConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const message = await postMessage({
            conversation,
            sender: req.user,
            body: req.body.body,
        });

        await broadcastMessage(conversation, message);

        res.status(201).json({ message });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark a conversation read by staff
// @route   POST /api/chat/conversations/:id/read   (admin, employee)
export const readConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        await markRead(conversation, req.user);

        res.status(200).json({ message: "Marked as read." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    How many conversations are waiting on staff — for the panel badge
// @route   GET /api/chat/unread   (admin, employee)
export const getUnreadSummary = async (req, res) => {
    try {
        if (!isStaff(req.user)) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const conversations = await listConversations({ unreadOnly: true });

        res.status(200).json({
            conversations: conversations.length,
            messages: conversations.reduce((sum, row) => sum + row.unreadForStaff, 0),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
