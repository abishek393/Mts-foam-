import { Op } from "sequelize";
import { Conversation, Message, User, Product } from "../models/index.js";
import { MAX_MESSAGE_LENGTH } from "../models/Message.js";

// All chat logic lives here so the REST endpoints and the socket handlers
// cannot drift apart — sending over a socket and sending over HTTP must do
// exactly the same thing, because the socket falls back to HTTP.

export const STAFF_ROLES = ["admin", "employee"];

export const isStaff = (user) => STAFF_ROLES.includes(user.role);

const SENDER_ATTRIBUTES = ["id", "firstName", "lastName", "role"];

// A customer's conversation, made on first use rather than at signup — most
// customers never message, and empty rows would clutter the staff list.
export const getOrCreateConversation = async (userId) => {
    const [conversation] = await Conversation.findOrCreate({
        where: { userId },
        defaults: { userId },
    });

    return conversation;
};

export const serialiseMessage = (message) => ({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: message.body,
    productId: message.productId,
    createdAt: message.createdAt,
    sender: message.sender
        ? {
              id: message.sender.id,
              firstName: message.sender.firstName,
              // Staff are shown by first name only to customers; the full name
              // is only ever assembled for the staff-facing panel.
              lastName: message.sender.lastName,
              role: message.sender.role,
          }
        : null,
    product: message.product
        ? { id: message.product.id, slug: message.product.slug, name: message.product.name }
        : null,
});

// Unread from the other side, worked out from timestamps rather than a counter
// column — a counter drifts the moment a socket event is missed.
export const unreadCounts = async (conversation) => {
    const [forCustomer, forStaff] = await Promise.all([
        Message.count({
            where: {
                conversationId: conversation.id,
                senderRole: "staff",
                ...(conversation.customerLastReadAt && {
                    createdAt: { [Op.gt]: conversation.customerLastReadAt },
                }),
            },
        }),
        Message.count({
            where: {
                conversationId: conversation.id,
                senderRole: "customer",
                ...(conversation.staffLastReadAt && {
                    createdAt: { [Op.gt]: conversation.staffLastReadAt },
                }),
            },
        }),
    ]);

    return { forCustomer, forStaff };
};

export const loadMessages = async (conversationId, { limit = 200 } = {}) => {
    const messages = await Message.findAll({
        where: { conversationId },
        include: [
            { model: User, as: "sender", attributes: SENDER_ATTRIBUTES },
            { model: Product, as: "product", attributes: ["id", "slug", "name"] },
        ],
        order: [["createdAt", "ASC"]],
        limit,
    });

    return messages.map(serialiseMessage);
};

// Validates and stores a message. Throws an Error with a readable message the
// caller can pass straight back to whoever sent it.
export const postMessage = async ({ conversation, sender, body, productId }) => {
    const text = String(body ?? "").trim();

    if (!text) {
        throw new Error("A message cannot be empty");
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`A message cannot be longer than ${MAX_MESSAGE_LENGTH} characters`);
    }

    const senderRole = isStaff(sender) ? "staff" : "customer";

    const message = await Message.create({
        conversationId: conversation.id,
        senderId: sender.id,
        senderRole,
        body: text,
        productId: productId ? Number(productId) || null : null,
    });

    // The sender has by definition read their own message, so their side's
    // marker moves with it — otherwise you would appear unread to yourself.
    await conversation.update({
        lastMessageAt: message.createdAt,
        lastMessagePreview: text.slice(0, 160),
        ...(senderRole === "staff"
            ? { staffLastReadAt: message.createdAt }
            : { customerLastReadAt: message.createdAt }),
    });

    const full = await Message.findByPk(message.id, {
        include: [
            { model: User, as: "sender", attributes: SENDER_ATTRIBUTES },
            { model: Product, as: "product", attributes: ["id", "slug", "name"] },
        ],
    });

    return serialiseMessage(full);
};

export const markRead = async (conversation, user) => {
    const now = new Date();

    await conversation.update(
        isStaff(user) ? { staffLastReadAt: now } : { customerLastReadAt: now }
    );

    return now;
};

// The staff inbox: every conversation that has ever had a message, newest
// first, with the customer and how many of their messages are unanswered.
export const listConversations = async ({ unreadOnly = false } = {}) => {
    const conversations = await Conversation.findAll({
        where: { lastMessageAt: { [Op.ne]: null } },
        include: [
            {
                model: User,
                as: "customer",
                attributes: ["id", "firstName", "lastName", "email", "phone"],
            },
            {
                model: User,
                as: "assignee",
                attributes: ["id", "firstName", "lastName"],
            },
        ],
        order: [["lastMessageAt", "DESC"]],
    });

    const rows = [];

    for (const conversation of conversations) {
        const unread = await unreadCounts(conversation);

        if (unreadOnly && unread.forStaff === 0) continue;

        rows.push({
            id: conversation.id,
            userId: conversation.userId,
            customer: conversation.customer,
            assignee: conversation.assignee,
            lastMessageAt: conversation.lastMessageAt,
            lastMessagePreview: conversation.lastMessagePreview,
            unreadForStaff: unread.forStaff,
        });
    }

    return rows;
};
