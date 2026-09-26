import express from "express";
import {
    getOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
} from "../controllers/offerController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/", getOffers);
router.get("/:id", getOfferById);

// Admin
router.post("/", authenticate, authorize("admin"), createOffer);
router.put("/:id", authenticate, authorize("admin"), updateOffer);
router.delete("/:id", authenticate, authorize("admin"), deleteOffer);

export default router;
