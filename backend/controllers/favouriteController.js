import Favourite from "../models/Favourite.js";
import Product from "../models/Product.js";

const PRODUCT_ATTRIBUTES = [
    "id",
    "slug",
    "name",
    "group",
    "category",
    "shortDescription",
    "keySpec",
    "images",
];

// @desc    The logged-in customer's saved products
// @route   GET /api/favourites   (authenticated)
export const getFavourites = async (req, res) => {
    try {
        const favourites = await Favourite.findAll({
            where: { userId: req.user.id },
            include: [{ model: Product, as: "product", attributes: PRODUCT_ATTRIBUTES }],
            order: [["createdAt", "DESC"]],
        });

        // Skip rows whose product has since been deleted.
        const products = favourites.map((row) => row.product).filter(Boolean);

        res.status(200).json({
            count: products.length,
            slugs: products.map((product) => product.slug),
            products,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Save a product
// @route   POST /api/favourites   body: { productId }   (authenticated)
export const addFavourite = async (req, res) => {
    try {
        const { productId } = req.body;

        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // The unique index makes this idempotent — saving twice is not an error.
        const [favourite, created] = await Favourite.findOrCreate({
            where: { userId: req.user.id, productId: product.id },
        });

        res.status(created ? 201 : 200).json({
            message: created ? "Saved to favourites." : "Already in your favourites.",
            favourite,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Remove a saved product
// @route   DELETE /api/favourites/:productId   (authenticated)
export const removeFavourite = async (req, res) => {
    try {
        const removed = await Favourite.destroy({
            where: { userId: req.user.id, productId: req.params.productId },
        });

        if (!removed) {
            return res.status(404).json({ message: "That product is not in your favourites." });
        }

        res.status(200).json({ message: "Removed from favourites." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
