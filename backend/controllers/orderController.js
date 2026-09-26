import { sequelize } from "../config/database.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const ITEM_INCLUDE = {
    model: OrderItem,
    as: "items",
    include: [
        {
            model: Product,
            as: "product",
            attributes: ["id", "slug", "name", "category", "images"],
        },
    ],
};

const MAX_ITEMS = 50;

// @desc    Place an order request from the cart
// @route   POST /api/orders   (authenticated)
//
// No payment is taken and no prices are stored — the catalogue carries none.
// An order is a specified request that 4STAR quotes against.
export const createOrder = async (req, res) => {
    try {
        const {
            items,
            contactName,
            contactPhone,
            contactEmail,
            deliveryAddress,
            note,
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty." });
        }

        if (items.length > MAX_ITEMS) {
            return res
                .status(400)
                .json({ message: "An order can hold at most " + MAX_ITEMS + " lines." });
        }

        // Resolve every product up front, so one bad line fails the whole order
        // rather than silently dropping out of it.
        const productIds = [
            ...new Set(items.map((item) => item.productId).filter(Boolean)),
        ];

        const products = productIds.length
            ? await Product.findAll({ where: { id: productIds } })
            : [];

        const byId = new Map(products.map((product) => [product.id, product]));

        const lines = [];

        for (const item of items) {
            const quantity = Number.parseInt(item.quantity, 10);

            if (!Number.isFinite(quantity) || quantity < 1) {
                return res
                    .status(400)
                    .json({ message: "Every line needs a quantity of at least 1." });
            }

            let productLabel = item.productLabel;

            if (item.productId) {
                const product = byId.get(Number(item.productId));

                if (!product) {
                    return res
                        .status(400)
                        .json({ message: "One of the products is no longer available." });
                }

                // Snapshot the current name rather than trusting the client.
                productLabel = product.name;
            }

            if (!productLabel) {
                return res.status(400).json({ message: "Every line needs a product." });
            }

            lines.push({
                productId: item.productId ?? null,
                productLabel,
                sizeLabel: item.sizeLabel ?? null,
                lengthIn: item.lengthIn ?? null,
                widthIn: item.widthIn ?? null,
                thicknessIn: item.thicknessIn ?? null,
                quantity,
                note: item.note ?? null,
            });
        }

        // One transaction, so an order never exists without its lines.
        const created = await sequelize.transaction(async (t) => {
            const order = await Order.create(
                {
                    userId: req.user.id,
                    contactName:
                        contactName || req.user.firstName + " " + req.user.lastName,
                    contactPhone: contactPhone || req.user.phone,
                    contactEmail: contactEmail || req.user.email,
                    deliveryAddress: deliveryAddress ?? null,
                    note: note ?? null,
                    status: "pending",
                },
                { transaction: t }
            );

            await OrderItem.bulkCreate(
                lines.map((line) => ({ ...line, orderId: order.id })),
                { transaction: t, validate: true }
            );

            return order;
        });

        const order = await Order.findByPk(created.id, { include: [ITEM_INCLUDE] });

        res.status(201).json({
            message:
                "Order " +
                order.orderNumber +
                " placed. Our team will confirm and quote it shortly.",
            order,
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    The logged-in customer's own orders
// @route   GET /api/orders/mine   (authenticated)
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            attributes: { exclude: ["internalNote", "assignedTo"] },
            include: [ITEM_INCLUDE],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    One of the customer's own orders
// @route   GET /api/orders/mine/:id   (authenticated)
export const getMyOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            // Scoped to the caller, so another customer's id returns 404.
            where: { id: req.params.id, userId: req.user.id },
            attributes: { exclude: ["internalNote", "assignedTo"] },
            include: [ITEM_INCLUDE],
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Staff ───────────────────────────────────────────────────────────────────

// @desc    All orders
// @route   GET /api/orders?status=&assignedTo=   (admin, employee)
export const getAllOrders = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;

        const orders = await Order.findAll({
            where,
            include: [
                ITEM_INCLUDE,
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "firstName", "lastName", "email", "phone"],
                },
                {
                    model: User,
                    as: "assignee",
                    attributes: ["id", "firstName", "lastName"],
                },
                // So the payment panel can name whoever confirmed it.
                {
                    model: User,
                    as: "paymentVerifier",
                    attributes: ["id", "firstName", "lastName"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update status, assignment or internal note
// @route   PATCH /api/orders/:id   (admin, employee)
export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const { status, assignedTo, internalNote } = req.body;

        await order.update({
            ...(status !== undefined && { status }),
            ...(assignedTo !== undefined && { assignedTo }),
            ...(internalNote !== undefined && { internalNote }),
        });

        res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};
