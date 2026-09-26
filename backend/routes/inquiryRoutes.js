import express from "express";
import {
    createInquiry,
    getMyInquiries,
    getAllInquiries,
    updateInquiry,
} from "../controllers/inquiryController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Every inquiry belongs to a logged-in user — there is no guest path.
router.post("/", authenticate, createInquiry);
router.get("/mine", authenticate, getMyInquiries);

// Staff
router.get("/", authenticate, authorize("admin", "employee"), getAllInquiries);
router.patch("/:id", authenticate, authorize("admin", "employee"), updateInquiry);

export default router;
