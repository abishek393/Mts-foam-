import { Op, fn, col } from "sequelize";
import {
    User,
    Product,
    Dealer,
    DealerApplication,
    Offer,
    Inquiry,
    Order,
    OrderItem,
} from "../models/index.js";

// Admin-only read endpoints.
//
// The public controllers deliberately hard-filter `isActive: true` so a
// withdrawn product or an expired scheme never leaks into the catalogue. An
// admin has to see exactly those rows in order to bring them back, so the
// unfiltered listings live here behind the admin guard rather than as a query
// flag loosening the public routes.

// Turns [{ status, count }] rows into { status: count }, with every possible
// value present so the dashboard never renders a missing key as blank.
const tally = (rows, values) => {
    const counts = Object.fromEntries(values.map((value) => [value, 0]));

    for (const row of rows) {
        counts[row.status] = Number(row.count);
    }

    return counts;
};

const groupCount = (model, column = "status") =>
    model.findAll({
        attributes: [[col(column), "status"], [fn("COUNT", col("id")), "count"]],
        group: [col(column)],
        raw: true,
    });

// @desc    Dashboard counters and the most recent activity
// @route   GET /api/admin/stats   (admin)
export const getStats = async (req, res) => {
    try {
        const [
            inquiryRows,
            orderRows,
            applicationRows,
            userRows,
            productCount,
            activeProducts,
            featuredProducts,
            dealerCount,
            activeDealers,
            offerCount,
            activeOffers,
            recentInquiries,
            recentOrders,
        ] = await Promise.all([
            groupCount(Inquiry),
            groupCount(Order),
            groupCount(DealerApplication),
            groupCount(User, "role"),
            Product.count(),
            Product.count({ where: { isActive: true } }),
            Product.count({ where: { isFeatured: true, isActive: true } }),
            Dealer.count(),
            Dealer.count({ where: { isActive: true } }),
            Offer.count(),
            Offer.count({ where: { isActive: true } }),
            Inquiry.findAll({
                limit: 6,
                order: [["createdAt", "DESC"]],
                include: [
                    {
                        model: User,
                        as: "customer",
                        attributes: ["id", "firstName", "lastName", "email"],
                    },
                ],
            }),
            Order.findAll({
                limit: 6,
                order: [["createdAt", "DESC"]],
                include: [
                    {
                        model: User,
                        as: "customer",
                        attributes: ["id", "firstName", "lastName", "email"],
                    },
                    { model: OrderItem, as: "items", attributes: ["id"] },
                ],
            }),
        ]);

        res.status(200).json({
            stats: {
                inquiries: tally(inquiryRows, ["new", "contacted", "quoted", "closed"]),
                orders: tally(orderRows, [
                    "pending",
                    "confirmed",
                    "quoted",
                    "processing",
                    "completed",
                    "cancelled",
                ]),
                applications: tally(applicationRows, ["pending", "verified", "rejected"]),
                users: tally(userRows, ["admin", "employee", "dealer", "customer"]),
                products: {
                    total: productCount,
                    active: activeProducts,
                    inactive: productCount - activeProducts,
                    featured: featuredProducts,
                },
                dealers: {
                    total: dealerCount,
                    active: activeDealers,
                    inactive: dealerCount - activeDealers,
                },
                offers: {
                    total: offerCount,
                    active: activeOffers,
                    inactive: offerCount - activeOffers,
                },
            },
            recentInquiries,
            recentOrders,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Every product, active or not
// @route   GET /api/admin/products?group=&category=&search=&status=   (admin)
export const listProducts = async (req, res) => {
    try {
        const { group, category, search, status } = req.query;

        const where = {};

        if (group) where.group = group;
        if (category) where.category = category;
        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { slug: { [Op.like]: `%${search}%` } },
                { category: { [Op.like]: `%${search}%` } },
            ];
        }

        const products = await Product.findAll({
            where,
            order: [["sortOrder", "ASC"], ["name", "ASC"]],
        });

        res.status(200).json({ count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    One product by id — the edit form loads by id rather than slug, so
//          that editing the slug does not break the page it was opened from.
// @route   GET /api/admin/products/:id   (admin)
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Every offer, active or not
// @route   GET /api/admin/offers?audience=&status=   (admin)
export const listOffers = async (req, res) => {
    try {
        const { audience, status } = req.query;

        const where = {};

        if (audience) where.audience = audience;
        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        const offers = await Offer.findAll({
            where,
            order: [["sortOrder", "ASC"], ["title", "ASC"]],
        });

        res.status(200).json({ count: offers.length, offers });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    One offer by id
// @route   GET /api/admin/offers/:id   (admin)
export const getOffer = async (req, res) => {
    try {
        const offer = await Offer.findByPk(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.status(200).json({ offer });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Every dealer with the full row — the public directory returns only
//          six columns and hides deactivated entries.
// @route   GET /api/admin/dealers?city=&type=&search=&status=   (admin)
export const listDealers = async (req, res) => {
    try {
        const { city, type, search, status } = req.query;

        const where = {};

        if (city) where.city = city;
        if (type) where.type = type;
        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        if (search) {
            where[Op.or] = [
                { businessName: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
                { ward: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const dealers = await Dealer.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "firstName", "lastName", "email", "isActive"],
                },
            ],
            order: [["city", "ASC"], ["businessName", "ASC"]],
        });

        const cities = [...new Set(dealers.map((dealer) => dealer.city))].sort();

        res.status(200).json({ count: dealers.length, cities, dealers });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Staff who can be assigned an inquiry or an order.
// @route   GET /api/admin/assignees   (admin)
export const listAssignees = async (req, res) => {
    try {
        const staff = await User.findAll({
            where: { role: { [Op.in]: ["admin", "employee"] }, isActive: true },
            attributes: ["id", "firstName", "lastName", "role"],
            order: [["firstName", "ASC"]],
        });

        res.status(200).json({ count: staff.length, staff });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
