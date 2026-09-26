import express from "express";
import {
    createOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrder,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadPaymentProof, handleUploadError } from "../middleware/upload.js";
import {
    uploadProof,
    getProof,
    reviewPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Placing an order requires an account, like every inquiry on the site.
router.post("/", authenticate, createOrder);

// Declared before "/:id" style staff routes so "mine" is never read as an id.
router.get("/mine", authenticate, getMyOrders);
router.get("/mine/:id", authenticate, getMyOrderById);

// Payment proof. The customer uploads a screenshot against their own order,
// and the file is streamed back only to them or to staff — never from the
// static mount, because it is a bank statement.
router.post(
    "/:id/payment-proof",
    authenticate,
    uploadPaymentProof.single("proof"),
    uploadProof
);
router.get("/:id/payment-proof", authenticate, getProof);

// Staff
router.patch(
    "/:id/payment",
    authenticate,
    authorize("admin", "employee"),
    reviewPayment
);

router.get("/", authenticate, authorize("admin", "employee"), getAllOrders);
router.patch("/:id", authenticate, authorize("admin", "employee"), updateOrder);

router.use(handleUploadError);

export default router;
