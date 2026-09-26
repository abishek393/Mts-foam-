import express from "express";
import {
    getMyReviews,
    createReview,
    updateReview,
    deleteReview,
    getAllReviews,
    setReviewVisibility,
    adminDeleteReview,
} from "../controllers/reviewController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Reading a product's reviews is public and lives on the product route
// (/api/products/:slug/reviews). Everything here concerns a specific person's
// reviews, so it is all authenticated.

// Declared before "/:id" so "mine" is never read as an id.
router.get("/mine", authenticate, getMyReviews);

router.post("/", authenticate, createReview);
router.patch("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

// Staff moderation. Hiding is preferred to deleting — it is reversible, and
// the author can still see what happened to their review.
router.get("/", authenticate, authorize("admin", "employee"), getAllReviews);
router.patch(
    "/:id/visibility",
    authenticate,
    authorize("admin", "employee"),
    setReviewVisibility
);
router.delete("/:id/admin", authenticate, authorize("admin"), adminDeleteReview);

export default router;
