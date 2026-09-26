import crypto from "crypto";
import { sequelize } from "../config/database.js";
import Dealer from "../models/Dealer.js";
import User from "../models/User.js";
import { toRelativePath, toAbsolutePath, deleteFile } from "../config/storage.js";
import DealerApplication, {
    RESUBMIT_TTL_DAYS,
    MAX_RESUBMISSIONS,
    generateResubmitToken,
    hashResubmitToken,
} from "../models/DealerApplication.js";
import {
    sendMail,
    applicationHeldEmail,
    applicationApprovedEmail,
    applicationRejectedEmail,
    applicationResubmittedEmail,
} from "../config/mailer.js";

// Where the applicant is sent to replace a document, and where a new dealer
// signs in. Both need the public site's address, not the API's.
const SITE_URL = () => process.env.CLIENT_ORIGIN || "http://localhost:3000";

// A decision email must never take the decision down with it: the application
// has already been updated by the time this runs, so a failure is logged and
// reported alongside the result rather than thrown.
const notify = async (to, template) => {
    const { subject, text, html } = template;
    const result = await sendMail({ to, subject, text, html });

    if (result.failed) {
        console.error("[dealer-application] could not email", to, "-", result.reason);
    }

    return result;
};

// @desc    Submit a dealership application (public, multipart)
// @route   POST /api/dealer-applications
export const createApplication = async (req, res) => {
    const registrationFile = req.files?.registrationDoc?.[0];
    const vatFile = req.files?.vatDoc?.[0];

    try {
        const {
            fullName,
            businessName,
            location,
            contactNumber,
            email,
            businessType,
            requirements,
        } = req.body;

        if (!registrationFile) {
            return res
                .status(400)
                .json({ message: "Business registration document is required." });
        }

        const application = await DealerApplication.create({
            fullName,
            businessName,
            location,
            contactNumber,
            email,
            businessType,
            requirements,
            registrationDocPath: toRelativePath(registrationFile.path),
            vatDocPath: vatFile ? toRelativePath(vatFile.path) : null,
            status: "pending",
        });

        res.status(201).json({
            message:
                "Application submitted. Our team will verify your documents and get in touch.",
            application: publicView(application),
        });
    } catch (error) {
        // Don't leave orphaned uploads behind when the row fails to save.
        if (registrationFile) deleteFile(toRelativePath(registrationFile.path));
        if (vatFile) deleteFile(toRelativePath(vatFile.path));

        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

// @desc    List applications
// @route   GET /api/dealer-applications?status=   (admin)
export const getApplications = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;

        const applications = await DealerApplication.findAll({
            where,
            include: [
                { model: User, as: "reviewer", attributes: ["id", "firstName", "lastName"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Stream an uploaded document
// @route   GET /api/dealer-applications/:id/document/:type   (admin)
// Documents are deliberately outside the static mount — business registration
// and VAT papers must not be reachable by anyone holding a URL.
export const getApplicationDocument = async (req, res) => {
    try {
        const { id, type } = req.params;

        if (!["registration", "vat"].includes(type)) {
            return res.status(400).json({ message: "Unknown document type." });
        }

        const application = await DealerApplication.findByPk(id);

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const relativePath =
            type === "registration"
                ? application.registrationDocPath
                : application.vatDocPath;

        if (!relativePath) {
            return res.status(404).json({ message: "No document of that type was uploaded." });
        }

        return res.sendFile(toAbsolutePath(relativePath));
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Verify an application — creates the dealer login and directory entry
// @route   PATCH /api/dealer-applications/:id/verify   (admin)
export const verifyApplication = async (req, res) => {
    try {
        const application = await DealerApplication.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (application.status === "verified") {
            return res.status(400).json({ message: "This application is already verified." });
        }

        const { city, ward, type, reviewNote } = req.body;

        // A temporary password shown to the admin once — there is no mail
        // service yet, so it has to be passed on manually.
        const temporaryPassword = crypto.randomBytes(6).toString("hex");
        let passwordIssued = false;

        const result = await sequelize.transaction(async (t) => {
            let user = await User.findOne({
                where: { email: application.email },
                transaction: t,
            });

            if (user) {
                // An existing account applying for dealership is promoted rather
                // than duplicated. Their password is left alone.
                if (user.role !== "dealer") {
                    await user.update({ role: "dealer" }, { transaction: t });
                }
            } else {
                const [firstName, ...rest] = application.fullName.trim().split(/\s+/);

                user = await User.create(
                    {
                        firstName,
                        lastName: rest.join(" ") || firstName,
                        email: application.email,
                        password: temporaryPassword,
                        phone: application.contactNumber,
                        role: "dealer",
                        isActive: true,
                    },
                    { transaction: t }
                );

                passwordIssued = true;
            }

            const dealer = await Dealer.create(
                {
                    businessName: application.businessName,
                    city: city || application.location,
                    ward: ward || null,
                    type: type || (application.businessType === "distributor"
                        ? "distributor"
                        : "authorised"),
                    phone: application.contactNumber,
                    email: application.email,
                    userId: user.id,
                    isActive: true,
                },
                { transaction: t }
            );

            await application.update(
                {
                    status: "verified",
                    reviewedBy: req.user.id,
                    reviewedAt: new Date(),
                    reviewNote: reviewNote || null,
                    createdUserId: user.id,
                },
                { transaction: t }
            );

            return { user, dealer };
        });

        // The password is emailed because this is the moment the account exists;
        // there is no other channel to hand it over. It is still returned to the
        // admin so they can pass it on if the email bounces.
        const delivery = await notify(
            application.email,
            applicationApprovedEmail({
                businessName: application.businessName,
                email: application.email,
                temporaryPassword: passwordIssued ? temporaryPassword : null,
                loginUrl: `${SITE_URL()}/login`,
            })
        );

        res.status(200).json({
            message: delivery.delivered
                ? "Application verified. Dealer account created and the applicant has been emailed."
                : "Application verified. The confirmation email could NOT be sent — pass the details on yourself.",
            emailed: Boolean(delivery.delivered),
            application,
            dealer: result.dealer,
            user: result.user.toSafeObject(),
            // Only present when a brand new login was created.
            temporaryPassword: passwordIssued ? temporaryPassword : undefined,
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Reject an application
// @route   PATCH /api/dealer-applications/:id/reject   (admin)
export const rejectApplication = async (req, res) => {
    try {
        const application = await DealerApplication.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        await application.update({
            status: "rejected",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            reviewNote: req.body.reviewNote || null,
            // A rejected application must not keep a working upload link.
            resubmitTokenHash: null,
            resubmitExpiresAt: null,
        });

        const delivery = await notify(
            application.email,
            applicationRejectedEmail({
                businessName: application.businessName,
                reason: req.body.reviewNote || null,
            })
        );

        res.status(200).json({
            message: delivery.delivered
                ? "Application rejected and the applicant has been emailed."
                : "Application rejected. The email could NOT be sent.",
            emailed: Boolean(delivery.delivered),
            application,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// What an applicant is allowed to see back — never the stored document paths.
const publicView = (application) => ({
    id: application.id,
    businessName: application.businessName,
    status: application.status,
    createdAt: application.createdAt,
});


// @desc    Put an application on hold and ask for a replacement document
// @route   PATCH /api/dealer-applications/:id/hold   (admin)
//          body: { holdRequirements, reviewNote }
//
// Not a refusal. The applicant gets a one-off link to upload again, and the
// application returns to pending the moment they do.
export const holdApplication = async (req, res) => {
    try {
        const application = await DealerApplication.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (application.status === "verified") {
            return res.status(400).json({
                message: "This application is already verified — it cannot be put on hold.",
            });
        }

        const requirements = req.body.holdRequirements?.trim();

        if (!requirements) {
            return res.status(400).json({
                message: "Say what the applicant needs to provide.",
            });
        }

        // A fresh token every time, so an earlier link stops working.
        const token = generateResubmitToken();
        const expiresAt = new Date(Date.now() + RESUBMIT_TTL_DAYS * 24 * 60 * 60 * 1000);

        await application.update({
            status: "on_hold",
            holdRequirements: requirements,
            reviewNote: req.body.reviewNote?.trim() || null,
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            resubmitTokenHash: await hashResubmitToken(token),
            resubmitExpiresAt: expiresAt,
        });

        const link = `${SITE_URL()}/dealers/resubmit/${application.id}/${token}`;

        const delivery = await notify(
            application.email,
            applicationHeldEmail({
                businessName: application.businessName,
                requirements,
                link,
                days: RESUBMIT_TTL_DAYS,
            })
        );

        res.status(200).json({
            message: delivery.delivered
                ? "Application put on hold and the applicant has been emailed."
                : "Application put on hold. The email could NOT be sent — send them the link yourself.",
            emailed: Boolean(delivery.delivered),
            application,
            // Returned so an admin can pass it on if the email fails. It is the
            // only time the raw token exists — only its hash is stored.
            resubmitLink: link,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Finds an application by id and validates the raw token against its hash.
const findByToken = async (id, token) => {
    if (!/^\d+$/.test(String(id)) || !token) return null;

    const application = await DealerApplication.findByPk(id);

    if (!application) return null;
    if (application.status !== "on_hold") return null;
    if (application.resubmitExpired()) return null;
    if (!(await application.matchesResubmitToken(token))) return null;

    return application;
};

// @desc    What the applicant has been asked for (public, token-gated)
// @route   GET /api/dealer-applications/:id/resubmit/:token
export const getResubmission = async (req, res) => {
    try {
        const application = await findByToken(req.params.id, req.params.token);

        if (!application) {
            return res.status(404).json({
                message: "That link is not valid any more. Contact us and we will send a new one.",
            });
        }

        // Only what the applicant already knows — never the stored file paths
        // or anything about who reviewed it.
        res.status(200).json({
            application: {
                id: application.id,
                businessName: application.businessName,
                fullName: application.fullName,
                email: application.email,
                holdRequirements: application.holdRequirements,
                hasRegistration: Boolean(application.registrationDocPath),
                hasVat: Boolean(application.vatDocPath),
                expiresAt: application.resubmitExpiresAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Replace the documents (public, token-gated, multipart)
// @route   POST /api/dealer-applications/:id/resubmit/:token
export const resubmitDocuments = async (req, res) => {
    const registrationFile = req.files?.registrationDoc?.[0];
    const vatFile = req.files?.vatDoc?.[0];

    const discard = () => {
        if (registrationFile) deleteFile(toRelativePath(registrationFile.path));
        if (vatFile) deleteFile(toRelativePath(vatFile.path));
    };

    try {
        const application = await findByToken(req.params.id, req.params.token);

        if (!application) {
            discard();
            return res.status(404).json({
                message: "That link is not valid any more. Contact us and we will send a new one.",
            });
        }

        if (application.resubmitCount >= MAX_RESUBMISSIONS) {
            discard();
            return res.status(429).json({
                message: "This link has been used too many times. Contact us for a new one.",
            });
        }

        if (!registrationFile && !vatFile) {
            return res.status(400).json({ message: "Attach at least one document." });
        }

        // The replaced file is removed only after the new one is safely stored.
        const previousRegistration = application.registrationDocPath;
        const previousVat = application.vatDocPath;

        await application.update({
            ...(registrationFile && {
                registrationDocPath: toRelativePath(registrationFile.path),
            }),
            ...(vatFile && { vatDocPath: toRelativePath(vatFile.path) }),
            // Back into the queue, and the link is spent.
            status: "pending",
            holdRequirements: null,
            resubmitTokenHash: null,
            resubmitExpiresAt: null,
            resubmitCount: application.resubmitCount + 1,
        });

        if (registrationFile && previousRegistration) deleteFile(previousRegistration);
        if (vatFile && previousVat) deleteFile(previousVat);

        await notify(
            application.email,
            applicationResubmittedEmail({ businessName: application.businessName })
        );

        res.status(200).json({
            message:
                "Thank you — your documents have been received and your application is back with our team.",
        });
    } catch (error) {
        discard();
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
