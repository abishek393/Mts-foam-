import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import crypto from "crypto";

// An order request placed from the cart. No payment is taken and no prices are
// stored — the site carries none. An order is a specified, multi-line request
// that 4STAR quotes against, which is why it has no total value field.
const Order = sequelize.define(
    "Order",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // Human-quotable reference, e.g. "4S-LX8F2K".
        orderNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        // Whose order it is. For an order taken in the field this is the
        // marketer, because the shop they visited may have no account at all —
        // the customer's own details live in the contact fields below.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Set when a marketer took the order rather than a customer placing it
        // themselves. Kept separate from userId so "who is responsible for this
        // order" and "who typed it in" never get confused.
        placedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        channel: {
            type: DataTypes.ENUM("online", "marketer"),
            allowNull: false,
            defaultValue: "online",
        },
        // Free text, because a field order is often for a shop that is not in
        // the dealer directory yet.
        customerBusiness: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contactName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Contact name is required" },
            },
        },
        contactPhone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "A contact number is required" },
            },
        },
        contactEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
                notEmpty: { msg: "Email is required" },
            },
        },
        deliveryAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // ── Payment proof ───────────────────────────────────────────────
        // The site still stores no prices. The customer pays the amount 4STAR
        // quoted them by scanning the QR, then uploads the screenshot; an admin
        // confirms it against the bank. That is why there is no amount column
        // here — the figure lives on the quote, not in the database.
        paymentStatus: {
            type: DataTypes.ENUM(
                "unpaid",
                "awaiting_verification",
                "verified",
                "rejected"
            ),
            allowNull: false,
            defaultValue: "unpaid",
        },
        // Relative path under uploads/payment-proofs — never served statically.
        paymentProofPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentProofUploadedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // Whatever reference the customer quotes from their statement.
        paymentReference: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        // Why an admin rejected it, shown back to the customer so they know
        // what to send instead.
        paymentNote: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        paymentVerifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        paymentVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                "pending",
                "confirmed",
                "quoted",
                "processing",
                "completed",
                "cancelled"
            ),
            allowNull: false,
            defaultValue: "pending",
        },
        // Staff member handling it.
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        internalNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "orders",
        hooks: {
            beforeValidate: (order) => {
                if (!order.orderNumber) {
                    order.orderNumber =
                        "4S-" + crypto.randomBytes(4).toString("hex").toUpperCase();
                }
            },
        },
    }
);

export default Order;
