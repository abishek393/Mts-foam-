import express from "express";
import {
    getFavourites,
    addFavourite,
    removeFavourite,
} from "../controllers/favouriteController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Favourites belong to an account, so every route here is authenticated.
router.use(authenticate);

router.get("/", getFavourites);
router.post("/", addFavourite);
router.delete("/:productId", removeFavourite);

export default router;
