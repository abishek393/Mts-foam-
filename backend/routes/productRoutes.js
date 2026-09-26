import express from "express";
import {
    getProducts,
    getProductBySlug,
    compareProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadProductImages, handleUploadError } from "../middleware/upload.js";
import { getProductReviews } from "../controllers/reviewController.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.post("/compare", compareProducts);

// Admin — declared before /:slug so "compare" isn't read as a slug
router.post(
    "/",
    authenticate,
    authorize("admin"),
    uploadProductImages.array("images", 6),
    createProduct
);

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    uploadProductImages.array("images", 6),
    updateProduct
);

router.delete("/:id", authenticate, authorize("admin"), deleteProduct);

// Public — a product's reviews. Two segments, so the single-segment slug route
// below cannot shadow it.
router.get("/:slug/reviews", getProductReviews);

// Public — last, so it doesn't shadow the routes above
router.get("/:slug", getProductBySlug);

router.use(handleUploadError);

export default router;
