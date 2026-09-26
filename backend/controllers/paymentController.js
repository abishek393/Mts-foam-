import { Order, User } from "../models/index.js";
import Setting, { SETTING_KEYS, getSetting, setSetting } from "../models/Setting.js";
import { toRelativePath, toAbsolutePath, deleteFile } from "../config/storage.js";

// Payment by QR, confirmed by hand.
//
// The site stores no prices, so nothing here knows what anybody owes. The
// customer pays the figure 4STAR quoted them, uploads the screenshot, and an
// admin checks it against the bank before marking it verified. That is the
// whole mechanism — there is no gateway and no amount column.

// ─── The QR itself ───────────────────────────────────────────────────────────

// @desc    The payment QR and instructions, for the checkout page
// @route   GET /api/payment/details      (public)
export const getPaymentDetails = async (req, res) => {
    try {
        const [qrPath, instructions] = await Promise.all([
            getSetting(SETTING_KEYS.PAYMENT_QR_PATH),
            getSetting(SETTING_KEYS.PAYMENT_INSTRUCTIONS),
        ]);

        res.status(200).json({
            // Served from the static /uploads mount — a QR is meant to be
            // scanned by anyone, so it is deliberately public.
            qrUrl: qrPath ? `/uploads/${qrPath}` : null,
            instructions: instructions ?? null,
            configured: Boolean(qrPath),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Replace the payment QR
// @route   PUT /api/payment/qr      (admin, multipart: qr)
export const updatePaymentQr = async (req, res) => {
    try {
        const instructions = req.body.instructions?.trim();

        if (instructions !== undefined) {
            await setSetting(SETTING_KEYS.PAYMENT_INSTRUCTIONS, instructions || null);
        }

        if (req.file) {
            const previous = await getSetting(SETTING_KEYS.PAYMENT_QR_PATH);

            await setSetting(
                SETTING_KEYS.PAYMENT_QR_PATH,
                toRelativePath(req.file.path)
            );

            // Removed only once the replacement is safely recorded.
            if (previous) deleteFile(previous);
        }

        const qrPath = await getSetting(SETTING_KEYS.PAYMENT_QR_PATH);

        res.status(200).json({
            message: "Payment details updated.",
            qrUrl: qrPath ? `/uploads/${qrPath}` : null,
            instructions: await getSetting(SETTING_KEYS.PAYMENT_INSTRUCTIONS),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── The customer's screenshot ───────────────────────────────────────────────

// @desc    Attach a payment screenshot to your own order
// @route   POST /api/orders/:id/payment-proof   (auth, multipart: proof)
export const uploadProof = async (req, res) => {
    const discard = () => {
        if (req.file) deleteFile(toRelativePath(req.file.path));
    };

    try {
        const order = await Order.findByPk(req.params.id);

        // Same answer whether the order is missing or someone else's, so this
        // cannot be used to discover which order ids exist.
        if (!order || order.userId !== req.user.id) {
            discard();
            return res.status(404).json({ message: "Order not found" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Attach a screenshot of the payment." });
        }

        if (order.paymentStatus === "verified") {
            discard();
            return res.status(400).json({
                message: "This payment has already been verified.",
            });
        }

        const previous = order.paymentProofPath;

        await order.update({
            paymentProofPath: toRelativePath(req.file.path),
            paymentProofUploadedAt: new Date(),
            paymentReference: req.body.reference?.trim() || null,
            // Replacing a rejected screenshot puts it back in the queue, and
            // clears the old rejection note so stale advice is not shown.
            paymentStatus: "awaiting_verification",
            paymentNote: null,
            paymentVerifiedBy: null,
            paymentVerifiedAt: null,
        });

        if (previous) deleteFile(previous);

        res.status(200).json({
            message: "Thank you — we will confirm your payment shortly.",
            paymentStatus: order.paymentStatus,
        });
    } catch (error) {
        discard();
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Stream a payment screenshot
// @route   GET /api/orders/:id/payment-proof   (auth)
//
// Deliberately outside the static mount: a bank statement must not be reachable
// by anyone holding a URL. Only the customer who uploaded it, or staff.
export const getProof = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order?.paymentProofPath) {
            return res.status(404).json({ message: "No payment screenshot on this order." });
        }

        const isStaff = ["admin", "employee"].includes(req.user.role);

        if (!isStaff && order.userId !== req.user.id) {
            return res.status(404).json({ message: "No payment screenshot on this order." });
        }

        return res.sendFile(toAbsolutePath(order.paymentProofPath));
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Confirm or refuse a payment screenshot
// @route   PATCH /api/orders/:id/payment   (admin, employee)
//          body: { paymentStatus, paymentNote }
export const reviewPayment = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const { paymentStatus } = req.body;

        if (!["verified", "rejected", "unpaid"].includes(paymentStatus)) {
            return res.status(400).json({
                message: "Payment status must be verified, rejected or unpaid.",
            });
        }

        if (paymentStatus === "rejected" && !req.body.paymentNote?.trim()) {
            return res.status(400).json({
                message: "Say why it was refused — the customer is shown this.",
            });
        }

        await order.update({
            paymentStatus,
            paymentNote: req.body.paymentNote?.trim() || null,
            paymentVerifiedBy: req.user.id,
            paymentVerifiedAt: new Date(),
        });

        const fresh = await Order.findByPk(order.id, {
            include: [
                {
                    model: User,
                    as: "paymentVerifier",
                    attributes: ["id", "firstName", "lastName"],
                },
            ],
        });

        res.status(200).json({
            message:
                paymentStatus === "verified"
                    ? "Payment verified."
                    : paymentStatus === "rejected"
                      ? "Payment refused — the customer can upload another screenshot."
                      : "Payment reset to unpaid.",
            order: fresh,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export { Setting };
