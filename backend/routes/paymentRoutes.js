import express from "express";
import {
    getPaymentDetails,
    updatePaymentQr,
} from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadSiteAsset, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Public — the checkout page needs the QR in order to render it.
router.get("/details", getPaymentDetails);

// Admin — replace the QR and the instructions printed beneath it.
router.put(
    "/qr",
    authenticate,
    authorize("admin"),
    uploadSiteAsset.single("qr"),
    updatePaymentQr
);

router.use(handleUploadError);

export default router;
