import express from "express";
import {
    getStats,
    listProducts,
    getProduct,
    listOffers,
    getOffer,
    listDealers,
    listAssignees,
} from "../controllers/adminController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Read-only listings for the admin panel. Every write still goes to the
// resource's own route — this group exists because the public controllers
// filter out inactive rows, which an admin needs to see.
router.use(authenticate, authorize("admin"));

router.get("/stats", getStats);
router.get("/assignees", listAssignees);

router.get("/products", listProducts);
router.get("/products/:id", getProduct);

router.get("/offers", listOffers);
router.get("/offers/:id", getOffer);

router.get("/dealers", listDealers);

export default router;
