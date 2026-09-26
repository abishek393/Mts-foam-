import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Fields a customer is allowed to set. Status, assignment and internal notes
// are staff-only and are never taken from the request body.
const CUSTOMER_FIELDS = [
    "productId",
    "contactName",
    "contactPhone",
    "contactEmail",
    "sizeLabel",
    "lengthIn",
    "widthIn",
    "thicknessIn",
    "quantity",
    "message",
    "source",
];

// @desc    Submit an inquiry — the site's conversion action
// @route   POST /api/inquiries   (authenticated)
export const createInquiry = async (req, res) => {
    try {
        const payload = {};
        for (const field of CUSTOMER_FIELDS) {
            if (req.body[field] !== undefined) payload[field] = req.body[field];
        }

        // Snapshot the product name so the record still reads correctly if the
        // product is later renamed or withdrawn.
        let productLabel = null;

        if (payload.productId) {
            const product = await Product.findByPk(payload.productId);

            if (!product) {
                return res.status(400).json({ message: "That product does not exist." });
            }

            productLabel = product.name;
        }

        const inquiry = await Inquiry.create({
            ...payload,
            userId: req.user.id,
            productLabel,
            // Fall back to the account's own details.
            contactName:
                payload.contactName || `${req.user.firstName} ${req.user.lastName}`,
            contactPhone: payload.contactPhone || req.user.phone,
            contactEmail: payload.contactEmail || req.user.email,
            status: "new",
        });

        res.status(201).json({
            message: "Inquiry sent. Our team will get back to you shortly.",
            inquiry,
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    The logged-in customer's own inquiries
// @route   GET /api/inquiries/mine   (authenticated)
export const getMyInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({
            where: { userId: req.user.id },
            attributes: { exclude: ["internalNote", "assignedTo"] },
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "slug", "name", "category", "images"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: inquiries.length, inquiries });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Staff ───────────────────────────────────────────────────────────────────

// @desc    All inquiries
// @route   GET /api/inquiries?status=&assignedTo=   (admin, employee)
export const getAllInquiries = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;

        const inquiries = await Inquiry.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "firstName", "lastName", "email", "phone"],
                },
                { model: Product, as: "product", attributes: ["id", "slug", "name"] },
                { model: User, as: "assignee", attributes: ["id", "firstName", "lastName"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: inquiries.length, inquiries });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update status, assignment or internal note
// @route   PATCH /api/inquiries/:id   (admin, employee)
export const updateInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByPk(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        const { status, assignedTo, internalNote } = req.body;

        await inquiry.update({
            ...(status !== undefined && { status }),
            ...(assignedTo !== undefined && { assignedTo }),
            ...(internalNote !== undefined && { internalNote }),
        });

        res.status(200).json({ message: "Inquiry updated successfully", inquiry });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};
