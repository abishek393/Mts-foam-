import Offer from "../models/Offer.js";

// @desc    Public list of active offers and schemes
// @route   GET /api/offers?audience=
export const getOffers = async (req, res) => {
    try {
        const { audience } = req.query;

        const where = { isActive: true };
        if (audience) where.audience = audience;

        const offers = await Offer.findAll({
            where,
            attributes: { exclude: ["createdAt", "updatedAt"] },
            order: [["sortOrder", "ASC"], ["title", "ASC"]],
        });

        res.status(200).json({ count: offers.length, offers });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get one offer
// @route   GET /api/offers/:id
export const getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findOne({
            where: { id: req.params.id, isActive: true },
        });

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.status(200).json({ offer });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

// @desc    Create an offer
// @route   POST /api/offers   (admin)
export const createOffer = async (req, res) => {
    try {
        const offer = await Offer.create(req.body);
        res.status(201).json({ message: "Offer created successfully", offer });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id   (admin)
export const updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findByPk(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        await offer.update(req.body);

        res.status(200).json({ message: "Offer updated successfully", offer });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id   (admin)
export const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByPk(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        await offer.destroy();

        res.status(200).json({ message: "Offer deleted successfully" });
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
