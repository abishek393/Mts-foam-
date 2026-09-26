import { Op } from "sequelize";
import {
    sequelize,
    User,
    Order,
    OrderItem,
    Product,
    DailyReport,
} from "../models/index.js";
import { dailyReportPdf, orderPdf, reportBundlePdf } from "../services/pdf.js";

const MARKETER_ATTRIBUTES = ["id", "firstName", "lastName", "email", "phone"];

const ITEM_INCLUDE = {
    model: OrderItem,
    as: "items",
    include: [{ model: Product, as: "product", attributes: ["id", "slug", "name"] }],
};

// Today in the server's timezone, as YYYY-MM-DD to match DATEONLY.
const today = () => new Date().toISOString().slice(0, 10);

// ─── Orders taken in the field ───────────────────────────────────────────────

// @desc    Place an order on a customer's behalf
// @route   POST /api/marketer/orders
//
// The order is recorded against the marketer, because the shop they visited
// often has no account at all. Who it is FOR lives in the contact fields.
export const createFieldOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            customerBusiness,
            contactName,
            contactPhone,
            contactEmail,
            deliveryAddress,
            note,
            items,
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Add at least one product to the order." });
        }

        if (!contactName || !contactPhone) {
            await transaction.rollback();
            return res.status(400).json({
                message: "A contact name and phone number are required.",
            });
        }

        const order = await Order.create(
            {
                userId: req.user.id,
                placedById: req.user.id,
                channel: "marketer",
                customerBusiness: customerBusiness?.trim() || null,
                contactName: contactName.trim(),
                contactPhone: contactPhone.trim(),
                // The API requires an email; a shop visited in person may not
                // have given one, so the marketer's stands in for the record.
                contactEmail: contactEmail?.trim() || req.user.email,
                deliveryAddress: deliveryAddress?.trim() || null,
                note: note?.trim() || null,
                status: "pending",
            },
            { transaction }
        );

        for (const item of items) {
            const productId = Number.parseInt(item.productId, 10);
            const quantity = Number.parseInt(item.quantity, 10);

            if (!Number.isInteger(quantity) || quantity < 1) {
                await transaction.rollback();
                return res.status(400).json({ message: "Every line needs a quantity of at least 1." });
            }

            // The label is snapshotted so the order still reads correctly if the
            // product is later renamed or withdrawn.
            const product = Number.isInteger(productId)
                ? await Product.findByPk(productId, { transaction })
                : null;

            if (!product && !item.productLabel) {
                await transaction.rollback();
                return res.status(400).json({ message: "Every line needs a product." });
            }

            await OrderItem.create(
                {
                    orderId: order.id,
                    productId: product?.id ?? null,
                    productLabel: product?.name ?? String(item.productLabel).trim(),
                    sizeLabel: item.sizeLabel?.trim() || null,
                    lengthIn: item.lengthIn || null,
                    widthIn: item.widthIn || null,
                    thicknessIn: item.thicknessIn || null,
                    quantity,
                    note: item.note?.trim() || null,
                },
                { transaction }
            );
        }

        await transaction.commit();

        const full = await Order.findByPk(order.id, { include: [ITEM_INCLUDE] });

        res.status(201).json({ message: "Order recorded.", order: full });
    } catch (error) {
        await transaction.rollback();

        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    The orders this marketer has taken
// @route   GET /api/marketer/orders
export const getMyFieldOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { placedById: req.user.id },
            include: [ITEM_INCLUDE],
            order: [["createdAt", "DESC"]],
            limit: 100,
        });

        res.status(200).json({ count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Daily reports ───────────────────────────────────────────────────────────

const reportBody = (req) => ({
    areasCovered: req.body.areasCovered?.trim() || null,
    visitsCount: Number.parseInt(req.body.visitsCount, 10) || 0,
    ordersTaken: Number.parseInt(req.body.ordersTaken, 10) || 0,
    summary: req.body.summary?.trim() ?? "",
    challenges: req.body.challenges?.trim() || null,
    followUp: req.body.followUp?.trim() || null,
});

// @desc    File or update today's report
// @route   POST /api/marketer/reports    body: { reportDate?, ... }
//
// Filing twice for the same day updates that day rather than creating a second
// record — a day's work is one report.
export const submitReport = async (req, res) => {
    try {
        const reportDate = req.body.reportDate || today();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
            return res.status(400).json({ message: "Give the date as YYYY-MM-DD." });
        }

        // A report for next week is a typo, not a plan.
        if (reportDate > today()) {
            return res.status(400).json({ message: "You cannot file a report for a future date." });
        }

        const body = reportBody(req);

        if (!body.summary) {
            return res.status(400).json({ message: "Write a short summary of the day" });
        }

        const existing = await DailyReport.findOne({
            where: { userId: req.user.id, reportDate },
        });

        if (existing) {
            await existing.update(body);
            return res
                .status(200)
                .json({ message: "Report updated.", report: existing, updated: true });
        }

        const report = await DailyReport.create({
            userId: req.user.id,
            reportDate,
            ...body,
        });

        res.status(201).json({ message: "Report filed.", report });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    This marketer's own reports
// @route   GET /api/marketer/reports
export const getMyReports = async (req, res) => {
    try {
        const reports = await DailyReport.findAll({
            where: { userId: req.user.id },
            order: [["reportDate", "DESC"]],
            limit: 90,
        });

        res.status(200).json({
            count: reports.length,
            reports,
            today: today(),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

const reportFilters = (query) => {
    const where = {};

    if (query.marketerId) where.userId = Number.parseInt(query.marketerId, 10);

    if (query.from || query.to) {
        where.reportDate = {};
        if (query.from) where.reportDate[Op.gte] = query.from;
        if (query.to) where.reportDate[Op.lte] = query.to;
    }

    return where;
};

// @desc    Every marketer's reports
// @route   GET /api/marketer/admin/reports?marketerId=&from=&to=   (admin)
export const getAllReports = async (req, res) => {
    try {
        const reports = await DailyReport.findAll({
            where: reportFilters(req.query),
            include: [
                { model: User, as: "marketer", attributes: MARKETER_ATTRIBUTES },
                { model: User, as: "reviewer", attributes: ["id", "firstName", "lastName"] },
            ],
            order: [["reportDate", "DESC"]],
        });

        const marketers = await User.findAll({
            where: { role: "marketer" },
            attributes: MARKETER_ATTRIBUTES,
            order: [["firstName", "ASC"]],
        });

        res.status(200).json({ count: reports.length, reports, marketers });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Add an office note to a report
// @route   PATCH /api/marketer/admin/reports/:id   (admin)
export const annotateReport = async (req, res) => {
    try {
        const report = await DailyReport.findByPk(req.params.id);

        if (!report) return res.status(404).json({ message: "Report not found" });

        await report.update({
            adminNote: req.body.adminNote?.trim() || null,
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
        });

        res.status(200).json({ message: "Note saved.", report });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── PDF downloads ───────────────────────────────────────────────────────────

// @desc    One report as a PDF
// @route   GET /api/marketer/admin/reports/:id/pdf   (admin)
export const downloadReport = async (req, res) => {
    try {
        const report = await DailyReport.findByPk(req.params.id, {
            include: [{ model: User, as: "marketer", attributes: MARKETER_ATTRIBUTES }],
        });

        if (!report) return res.status(404).json({ message: "Report not found" });

        dailyReportPdf(report, res);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    A set of reports as one PDF, a page each
// @route   GET /api/marketer/admin/reports/pdf?marketerId=&from=&to=   (admin)
export const downloadReports = async (req, res) => {
    try {
        const reports = await DailyReport.findAll({
            where: reportFilters(req.query),
            include: [{ model: User, as: "marketer", attributes: MARKETER_ATTRIBUTES }],
            order: [["reportDate", "ASC"]],
        });

        const range =
            req.query.from || req.query.to
                ? `${req.query.from || "start"} to ${req.query.to || "today"}`
                : "all dates";

        reportBundlePdf(reports, res, { title: `field reports ${range}` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    An order as a PDF
// @route   GET /api/marketer/admin/orders/:id/pdf   (admin, employee)
export const downloadOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                ITEM_INCLUDE,
                { model: User, as: "placedBy", attributes: MARKETER_ATTRIBUTES },
                { model: User, as: "customer", attributes: MARKETER_ATTRIBUTES },
            ],
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        orderPdf(order, res);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
