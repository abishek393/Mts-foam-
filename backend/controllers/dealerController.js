import { Op } from "sequelize";
import Dealer from "../models/Dealer.js";

// @desc    Public dealer directory
// @route   GET /api/dealers?city=&type=&search=
export const getDealers = async (req, res) => {
    try {
        const { city, type, search } = req.query;

        const where = { isActive: true };

        if (city) where.city = city;
        if (type) where.type = type;

        if (search) {
            where[Op.or] = [
                { businessName: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
                { ward: { [Op.like]: `%${search}%` } },
            ];
        }

        const dealers = await Dealer.findAll({
            where,
            attributes: ["id", "businessName", "city", "ward", "type", "phone"],
            order: [["city", "ASC"], ["businessName", "ASC"]],
        });

        // Cities are used to populate the directory's filter dropdown.
        const cities = [...new Set(dealers.map((d) => d.city))].sort();

        res.status(200).json({ count: dealers.length, cities, dealers });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

// @desc    Create a dealer directory entry
// @route   POST /api/dealers   (admin)
export const createDealer = async (req, res) => {
    try {
        const dealer = await Dealer.create(req.body);
        res.status(201).json({ message: "Dealer created successfully", dealer });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

// @desc    Update a dealer
// @route   PUT /api/dealers/:id   (admin)
export const updateDealer = async (req, res) => {
    try {
        const dealer = await Dealer.findByPk(req.params.id);

        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        await dealer.update(req.body);

        res.status(200).json({ message: "Dealer updated successfully", dealer });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

// @desc    Delete a dealer
// @route   DELETE /api/dealers/:id   (admin)
export const deleteDealer = async (req, res) => {
    try {
        const dealer = await Dealer.findByPk(req.params.id);

        if (!dealer) {
            return res.status(404).json({ message: "Dealer not found" });
        }

        await dealer.destroy();

        res.status(200).json({ message: "Dealer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const handleWriteError = (res, error) => {
    if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((e) => e.message);
        return res.status(400).json({ message: "Validation error", errors: messages });
    }

    return res.status(500).json({ message: "Server error", error: error.message });
};
