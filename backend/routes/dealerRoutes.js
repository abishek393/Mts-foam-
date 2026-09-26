import express from "express";
import {
    getDealers,
    createDealer,
    updateDealer,
    deleteDealer,
} from "../controllers/dealerController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public directory
router.get("/", getDealers);

// Admin
router.post("/", authenticate, authorize("admin"), createDealer);
router.put("/:id", authenticate, authorize("admin"), updateDealer);
router.delete("/:id", authenticate, authorize("admin"), deleteDealer);

export default router;
