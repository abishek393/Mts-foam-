import multer from "multer";
import crypto from "crypto";
import path from "path";
import { PRODUCT_DIR, DEALER_DOC_DIR, PAYMENT_PROOF_DIR, SITE_ASSET_DIR } from "../config/storage.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];

// Randomised names: uploads can't collide, and a dealer document's URL can't be
// guessed by walking sequential filenames.
const storageFor = (destination) =>
    multer.diskStorage({
        destination: (req, file, cb) => cb(null, destination),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
        },
    });

const filterFor = (allowed) => (req, file, cb) => {
    if (allowed.includes(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error(`Unsupported file type '${file.mimetype}'.`));
};

// Product imagery — admin only, images, 5 MB each.
export const uploadProductImages = multer({
    storage: storageFor(PRODUCT_DIR),
    fileFilter: filterFor(IMAGE_TYPES),
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

// A payment screenshot from a phone. Images or a PDF receipt, 8 MB — phone
// screenshots are large, and a customer cannot be asked to compress one.
export const uploadPaymentProof = multer({
    storage: storageFor(PAYMENT_PROOF_DIR),
    fileFilter: filterFor(DOC_TYPES),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

// The payment QR an admin uploads. Image only — a PDF cannot be scanned from
// a checkout page.
export const uploadSiteAsset = multer({
    storage: storageFor(SITE_ASSET_DIR),
    fileFilter: filterFor(IMAGE_TYPES),
    limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

// Dealer documents — public submission, images or PDF, 10 MB each.
export const uploadDealerDocs = multer({
    storage: storageFor(DEALER_DOC_DIR),
    fileFilter: filterFor(DOC_TYPES),
    limits: { fileSize: 10 * 1024 * 1024, files: 2 },
});

// Multer throws outside the normal validation path, so give it a real response
// instead of a 500. Mount after the routes that use an uploader.
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? "File is too large."
                : err.code === "LIMIT_FILE_COUNT"
                    ? "Too many files uploaded."
                    : "File upload failed.";

        return res.status(400).json({ message, code: err.code });
    }

    if (err?.message?.startsWith("Unsupported file type")) {
        return res.status(400).json({ message: err.message });
    }

    return next(err);
};
