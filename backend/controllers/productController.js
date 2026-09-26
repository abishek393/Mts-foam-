import { Op } from "sequelize";
import Product, {
    MATTRESS_CATEGORIES,
    FOAM_CATEGORIES,
    PRODUCT_CATEGORIES,
} from "../models/Product.js";
import { toRelativePath, deleteFile } from "../config/storage.js";

const PUBLIC_ATTRIBUTES = { exclude: ["createdAt", "updatedAt"] };

// @desc    List products with optional filters
// @route   GET /api/products?group=&category=&search=&featured=
export const getProducts = async (req, res) => {
    try {
        const { group, category, search, featured } = req.query;

        const where = { isActive: true };

        if (group) where.group = group;
        if (category) where.category = category;
        if (featured === "true") where.isFeatured = true;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { shortDescription: { [Op.like]: `%${search}%` } },
                { category: { [Op.like]: `%${search}%` } },
            ];
        }

        const products = await Product.findAll({
            where,
            attributes: PUBLIC_ATTRIBUTES,
            order: [["sortOrder", "ASC"], ["name", "ASC"]],
        });

        res.status(200).json({ count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get one product by slug
// @route   GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug, isActive: true },
            attributes: PUBLIC_ATTRIBUTES,
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Fetch up to three products for side-by-side comparison
// @route   POST /api/products/compare   body: { slugs: [...] }
export const compareProducts = async (req, res) => {
    try {
        const { slugs } = req.body;

        if (!Array.isArray(slugs) || slugs.length === 0) {
            return res.status(400).json({ message: "Provide an array of product slugs." });
        }

        if (slugs.length > 3) {
            return res.status(400).json({ message: "You can compare up to three products." });
        }

        const products = await Product.findAll({
            where: { slug: { [Op.in]: slugs }, isActive: true },
            attributes: PUBLIC_ATTRIBUTES,
        });

        // Return them in the order the caller asked for, not database order.
        const ordered = slugs
            .map((slug) => products.find((p) => p.slug === slug))
            .filter(Boolean);

        res.status(200).json({ count: ordered.length, products: ordered });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

// Multer writes the file to disk before the handler runs, so a rejected write
// leaves the upload orphaned in uploads/products unless it is cleared away.
const discardUploads = (req) => {
    for (const file of req.files ?? []) {
        deleteFile(toRelativePath(file.path));
    }
};

// @desc    Create a product
// @route   POST /api/products      (admin)
export const createProduct = async (req, res) => {
    try {
        const payload = normaliseProductPayload(req);

        const existing = await Product.findOne({ where: { slug: payload.slug } });
        if (existing) {
            discardUploads(req);
            return res.status(400).json({ message: "A product with this slug already exists." });
        }

        const product = await Product.create(payload);

        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        discardUploads(req);
        return handleWriteError(res, error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id   (admin)
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            discardUploads(req);
            return res.status(404).json({ message: "Product not found" });
        }

        const payload = normaliseProductPayload(req, product);
        await product.update(payload);

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        discardUploads(req);
        return handleWriteError(res, error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id   (admin)
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.destroy();

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Multipart form fields arrive as strings, so JSON columns need parsing back.
const JSON_FIELDS = ["thicknesses", "sizes", "applications", "features"];
const BOOLEAN_FIELDS = ["isFeatured", "isActive"];
const INTEGER_FIELDS = ["sortOrder"];

// Integers the admin is allowed to clear. An empty box means "none offered",
// which has to become null — treating it as "unchanged" like sortOrder would
// make a guarantee impossible to remove once set.
const NULLABLE_INTEGER_FIELDS = ["warrantyYears"];

const normaliseProductPayload = (req, existing = null) => {
    const payload = { ...req.body };

    for (const field of JSON_FIELDS) {
        if (typeof payload[field] === "string") {
            try {
                payload[field] = JSON.parse(payload[field]);
            } catch {
                // Fall back to a comma-separated list, which is friendlier in a form.
                payload[field] = payload[field]
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }
    }

    // "false" is a non-empty string and would otherwise save as true.
    for (const field of BOOLEAN_FIELDS) {
        if (typeof payload[field] === "string") {
            payload[field] = payload[field] === "true" || payload[field] === "1";
        }
    }

    for (const field of INTEGER_FIELDS) {
        if (typeof payload[field] === "string") {
            const parsed = Number.parseInt(payload[field], 10);
            if (Number.isNaN(parsed)) delete payload[field];
            else payload[field] = parsed;
        }
    }

    for (const field of NULLABLE_INTEGER_FIELDS) {
        if (typeof payload[field] !== "string") continue;

        const raw = payload[field].trim();

        if (raw === "") {
            payload[field] = null;
            continue;
        }

        const parsed = Number.parseInt(raw, 10);

        // Junk is treated as "leave it alone" rather than silently clearing a
        // guarantee the admin never meant to touch.
        if (Number.isNaN(parsed)) delete payload[field];
        else payload[field] = parsed;
    }

    // The admin picks features, not a category. `category` is still the column
    // the catalogue filters, the product cards and four API includes all read,
    // so it is kept in step by taking the first feature rather than being asked
    // for twice. Sending an explicit category still wins, so the API stays
    // usable on its own terms.
    if (Array.isArray(payload.features) && payload.features.length > 0) {
        const allowed =
            payload.group === "foam"
                ? FOAM_CATEGORIES
                : payload.group === "mattress"
                  ? MATTRESS_CATEGORIES
                  : PRODUCT_CATEGORIES;

        if (!payload.category || !allowed.includes(payload.category)) {
            const derived = payload.features.find((feature) =>
                allowed.includes(feature)
            );

            if (derived) payload.category = derived;
        }
    }

    // `images` is the list of existing images to keep — the admin form sends it
    // back minus anything removed. Newly uploaded files are appended to it, so
    // one submit can both drop an old image and add a new one.
    let kept = null;

    if (typeof payload.images === "string") {
        try {
            const parsed = JSON.parse(payload.images);
            if (Array.isArray(parsed)) kept = parsed;
        } catch {
            kept = null;
        }
    } else if (Array.isArray(payload.images)) {
        kept = payload.images;
    }

    const base = kept ?? existing?.images ?? [];

    if (req.files?.length) {
        const uploaded = req.files.map((file) => `/uploads/${toRelativePath(file.path)}`);
        payload.images = [...base, ...uploaded];
    } else if (kept !== null) {
        payload.images = base;
    } else {
        // Nothing said about images — leave whatever is stored untouched.
        delete payload.images;
    }

    return payload;
};

const handleWriteError = (res, error) => {
    if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((e) => e.message);
        return res.status(400).json({ message: "Validation error", errors: messages });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ message: "A product with this slug already exists." });
    }

    return res.status(500).json({ message: "Server error", error: error.message });
};
