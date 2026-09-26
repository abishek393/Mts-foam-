import { Op, fn, col } from "sequelize";
import {
    Review,
    Product,
    Order,
    OrderItem,
    User,
    sequelize,
} from "../models/index.js";
import { PURCHASE_STATUSES, MIN_RATING, MAX_RATING } from "../models/Review.js";

const AUTHOR_ATTRIBUTES = ["id", "firstName", "lastName"];

// ─── Eligibility ─────────────────────────────────────────────────────────────

// The single source of truth for "has this person bought this product".
//
// Every write goes through here, so the day real payment exists this is the one
// function to change — add a paid check to the Order where clause and every
// endpoint tightens at once.
//
// Returns the qualifying order, or null.
const findPurchase = async (userId, productId) =>
    Order.findOne({
        where: { userId, status: { [Op.in]: PURCHASE_STATUSES } },
        include: [
            {
                model: OrderItem,
                as: "items",
                required: true,
                where: { productId },
                attributes: ["id"],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

// ─── Aggregate ───────────────────────────────────────────────────────────────

// Recomputed from the visible reviews after any change, rather than nudged up
// and down — a nudge drifts the moment anything is hidden or deleted.
const refreshProductRating = async (productId) => {
    const [row] = await Review.findAll({
        where: { productId, isVisible: true },
        attributes: [
            [fn("AVG", col("rating")), "average"],
            [fn("COUNT", col("id")), "count"],
        ],
        raw: true,
    });

    const count = Number(row?.count ?? 0);
    const average = count > 0 ? Number(row.average) : 0;

    await Product.update(
        { ratingAverage: average.toFixed(2), ratingCount: count },
        { where: { id: productId } }
    );

    return { ratingAverage: Number(average.toFixed(2)), ratingCount: count };
};

// ─── Public ──────────────────────────────────────────────────────────────────

// @desc    Visible reviews for one product, with a rating breakdown
// @route   GET /api/products/:slug/reviews
export const getProductReviews = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug },
            attributes: ["id", "slug", "name", "ratingAverage", "ratingCount"],
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const reviews = await Review.findAll({
            where: { productId: product.id, isVisible: true },
            include: [{ model: User, as: "author", attributes: AUTHOR_ATTRIBUTES }],
            order: [["createdAt", "DESC"]],
        });

        // How many gave each star, for the bar chart under the average.
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const review of reviews) breakdown[review.rating] += 1;

        res.status(200).json({
            product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                ratingAverage: Number(product.ratingAverage),
                ratingCount: product.ratingCount,
            },
            breakdown,
            count: reviews.length,
            reviews: reviews.map(publicView),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reviewers are shown as "Raghav D." — a full surname on a public page is more
// than anyone signed up for.
const publicView = (review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    author: review.author
        ? `${review.author.firstName} ${(review.author.lastName ?? "").charAt(0)}.`.trim()
        : "Verified buyer",
    authorId: review.userId,
});

// ─── Customer ────────────────────────────────────────────────────────────────

// @desc    What this customer may review, and what they already have
// @route   GET /api/reviews/mine
export const getMyReviews = async (req, res) => {
    try {
        const [orders, reviews] = await Promise.all([
            Order.findAll({
                where: { userId: req.user.id, status: { [Op.in]: PURCHASE_STATUSES } },
                include: [
                    {
                        model: OrderItem,
                        as: "items",
                        attributes: ["id", "productId", "productLabel"],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "slug", "name", "images", "group"],
                            },
                        ],
                    },
                ],
                order: [["createdAt", "DESC"]],
            }),
            Review.findAll({
                where: { userId: req.user.id },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: ["id", "slug", "name", "images"],
                    },
                ],
                order: [["createdAt", "DESC"]],
            }),
        ]);

        const reviewedIds = new Set(reviews.map((review) => review.productId));

        // One entry per distinct product bought, skipping anything already
        // reviewed and anything whose product has since been deleted.
        const reviewable = [];
        const seen = new Set();

        for (const order of orders) {
            for (const item of order.items ?? []) {
                if (!item.productId || !item.product) continue;
                if (seen.has(item.productId) || reviewedIds.has(item.productId)) continue;

                seen.add(item.productId);

                reviewable.push({
                    productId: item.productId,
                    slug: item.product.slug,
                    name: item.product.name,
                    images: item.product.images,
                    group: item.product.group,
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    purchasedAt: order.createdAt,
                });
            }
        }

        res.status(200).json({
            reviewable,
            reviews: reviews.map((review) => ({
                id: review.id,
                productId: review.productId,
                rating: review.rating,
                title: review.title,
                body: review.body,
                isVisible: review.isVisible,
                hiddenReason: review.hiddenReason,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
                product: review.product,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Whole stars only. parseInt would quietly turn 2.5 into 2 and store a rating
// nobody chose, so the value is converted whole and rejected if it is not an
// integer in range.
const parseRating = (value) => {
    if (typeof value !== "number" && typeof value !== "string") return null;

    const rating = Number(value);

    if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
        return null;
    }

    return rating;
};

// @desc    Write a review
// @route   POST /api/reviews    body: { productId, rating, title, body }
export const createReview = async (req, res) => {
    try {
        const productId = Number.parseInt(req.body.productId, 10);
        const rating = parseRating(req.body.rating);

        if (!Number.isInteger(productId)) {
            return res.status(400).json({ message: "Which product is this about?" });
        }

        if (rating === null) {
            return res.status(400).json({
                message: `Give a rating between ${MIN_RATING} and ${MAX_RATING} stars.`,
            });
        }

        const product = await Product.findByPk(productId, { attributes: ["id"] });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // The gate. Never trust an orderId sent by the browser — the qualifying
        // order is looked up server-side from the signed-in user.
        const purchase = await findPurchase(req.user.id, productId);

        if (!purchase) {
            return res.status(403).json({
                message:
                    "Only customers who have received this product can review it. Once your order is completed, it will appear here.",
            });
        }

        const existing = await Review.findOne({
            where: { userId: req.user.id, productId },
        });

        if (existing) {
            return res.status(400).json({
                message: "You have already reviewed this product. You can edit that review instead.",
            });
        }

        const review = await Review.create({
            productId,
            userId: req.user.id,
            orderId: purchase.id,
            rating,
            title: req.body.title?.trim() || null,
            body: req.body.body?.trim() || null,
        });

        const aggregate = await refreshProductRating(productId);

        res.status(201).json({ message: "Thank you for your review.", review, ...aggregate });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({
                message: "You have already reviewed this product.",
            });
        }
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Edit your own review
// @route   PATCH /api/reviews/:id
export const updateReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review || review.userId !== req.user.id) {
            // Same answer whether it is missing or someone else's, so this
            // cannot be used to find out which review ids exist.
            return res.status(404).json({ message: "Review not found" });
        }

        const changes = {};

        if (req.body.rating !== undefined) {
            const rating = parseRating(req.body.rating);

            if (rating === null) {
                return res.status(400).json({
                    message: `Give a rating between ${MIN_RATING} and ${MAX_RATING} stars.`,
                });
            }

            changes.rating = rating;
        }

        if (req.body.title !== undefined) changes.title = req.body.title?.trim() || null;
        if (req.body.body !== undefined) changes.body = req.body.body?.trim() || null;

        await review.update(changes);

        const aggregate = await refreshProductRating(review.productId);

        res.status(200).json({ message: "Review updated.", review, ...aggregate });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete your own review
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review || review.userId !== req.user.id) {
            return res.status(404).json({ message: "Review not found" });
        }

        const { productId } = review;
        await review.destroy();

        const aggregate = await refreshProductRating(productId);

        res.status(200).json({ message: "Review deleted.", ...aggregate });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

// @desc    Every review, including hidden ones
// @route   GET /api/reviews?visible=&rating=&productId=   (admin)
export const getAllReviews = async (req, res) => {
    try {
        const where = {};

        if (req.query.visible === "true") where.isVisible = true;
        if (req.query.visible === "false") where.isVisible = false;
        if (req.query.rating) where.rating = Number.parseInt(req.query.rating, 10);
        if (req.query.productId) where.productId = Number.parseInt(req.query.productId, 10);

        const reviews = await Review.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "author",
                    attributes: [...AUTHOR_ATTRIBUTES, "email"],
                },
                { model: Product, as: "product", attributes: ["id", "slug", "name"] },
                { model: Order, as: "order", attributes: ["id", "orderNumber", "status"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: reviews.length, reviews });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Hide or restore a review
// @route   PATCH /api/reviews/:id/visibility   (admin)   body: { isVisible, reason }
export const setReviewVisibility = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const isVisible = req.body.isVisible !== false && req.body.isVisible !== "false";

        await review.update({
            isVisible,
            hiddenReason: isVisible ? null : req.body.reason?.trim() || null,
        });

        const aggregate = await refreshProductRating(review.productId);

        res.status(200).json({
            message: isVisible ? "Review is visible again." : "Review hidden.",
            review,
            ...aggregate,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete any review
// @route   DELETE /api/reviews/:id/admin   (admin)
export const adminDeleteReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const { productId } = review;
        await review.destroy();

        const aggregate = await refreshProductRating(productId);

        res.status(200).json({ message: "Review deleted.", ...aggregate });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Recompute every product's rating aggregate from its reviews.
//          Used after a bulk change, and safe to run at any time.
export const recomputeAllRatings = async () => {
    const products = await Product.findAll({ attributes: ["id"] });

    for (const product of products) {
        await refreshProductRating(product.id);
    }

    return products.length;
};

export { findPurchase, refreshProductRating, sequelize };
