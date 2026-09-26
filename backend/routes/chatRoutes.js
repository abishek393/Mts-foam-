import express from "express";
import {
    getSocketTicket,
    getMyConversation,
    sendMyMessage,
    readMyConversation,
    getConversations,
    getConversation,
    replyToConversation,
    readConversation,
    getUnreadSummary,
} from "../controllers/chatController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Chat is between a signed-in customer and staff, so nothing here is public.
router.use(authenticate);

// Any signed-in user may open a socket; what they can then do is decided by
// their role inside the socket handlers.
router.post("/ticket", getSocketTicket);

// The customer's own thread.
router.get("/mine", getMyConversation);
router.post("/mine", sendMyMessage);
router.post("/mine/read", readMyConversation);

// Staff. Declared after "/mine" so that path is never read as a conversation id.
router.get("/unread", authorize("admin", "employee"), getUnreadSummary);
router.get("/conversations", authorize("admin", "employee"), getConversations);
router.get("/conversations/:id", authorize("admin", "employee"), getConversation);
router.post("/conversations/:id", authorize("admin", "employee"), replyToConversation);
router.post(
    "/conversations/:id/read",
    authorize("admin", "employee"),
    readConversation
);

export default router;
