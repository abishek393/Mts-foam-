import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// A product review, written only by someone who actually received the product.
//
// WHAT COUNTS AS A PURCHASE
// The site takes no payment yet — an order is a request that 4STAR quotes and
// then fulfils — so the proof of purchase available today is an order marked
// completed by staff. When real payment is added, change PURCHASE_STATUSES (or
// the eligibility query that uses it) and nothing else moves: every check in
// the codebase goes through reviewController's findPurchase.
export const PURCHASE_STATUSES = ["completed"];

export const MIN_RATING = 1;
export const MAX_RATING = 5;

const Review = sequelize.define(
    "Review",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // The order that entitles this review. Kept so the claim stays auditable
        // even if the customer's later orders change status.
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: { args: [MIN_RATING], msg: `Rating must be at least ${MIN_RATING}` },
                max: { args: [MAX_RATING], msg: `Rating cannot be more than ${MAX_RATING}` },
            },
        },
        title: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Reviews publish immediately; an admin can hide one without destroying
        // it, so a hidden review can be restored and the author still sees it.
        isVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        hiddenReason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "reviews",
        indexes: [
            // One review per customer per product. Editing an existing review is
            // how you change your mind — posting a second one is not.
            {
                name: "reviews_user_product",
                unique: true,
                fields: ["userId", "productId"],
            },
        ],
    }
);

export default Review;
