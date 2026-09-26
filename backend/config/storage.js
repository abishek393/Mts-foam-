import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Every filesystem concern lives here. Swapping to Cloudinary or S3 later means
// rewriting this module and nothing else — controllers only ever see the
// relative path stored in the database.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

// Product imagery is public marketing material, served statically.
export const PRODUCT_DIR = path.join(UPLOAD_ROOT, "products");

// Dealer documents are business registration and VAT papers. These are NOT
// served statically — they go out only through an admin-guarded route.
export const DEALER_DOC_DIR = path.join(UPLOAD_ROOT, "dealer-docs");

// Payment screenshots show a customer's bank or wallet statement. Treated like
// dealer documents: never served statically, only through a guarded route to
// the customer who uploaded it or to staff.
export const PAYMENT_PROOF_DIR = path.join(UPLOAD_ROOT, "payment-proofs");

// Site imagery an admin uploads — currently the payment QR. Public by nature:
// the QR is meant to be scanned by anyone checking out.
export const SITE_ASSET_DIR = path.join(UPLOAD_ROOT, "site");

for (const dir of [PRODUCT_DIR, DEALER_DOC_DIR, PAYMENT_PROOF_DIR, SITE_ASSET_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
}

// The path stored in the DB, relative to UPLOAD_ROOT and always forward-slashed
// so it reads the same on Windows and Linux.
export const toRelativePath = (absolutePath) =>
    path.relative(UPLOAD_ROOT, absolutePath).split(path.sep).join("/");

// Resolve a stored relative path back to disk, refusing anything that escapes
// the upload root — a stored value must never be able to reach ../../.env
export const toAbsolutePath = (relativePath) => {
    const resolved = path.resolve(UPLOAD_ROOT, relativePath);

    if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
        throw new Error("Resolved path escapes the upload directory");
    }

    return resolved;
};

export const deleteFile = (relativePath) => {
    if (!relativePath) return;

    try {
        fs.unlinkSync(toAbsolutePath(relativePath));
    } catch {
        // Already gone, or never written — nothing to clean up.
    }
};
