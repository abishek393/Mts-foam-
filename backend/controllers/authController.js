import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import PendingRegistration, {
    CODE_TTL_MINUTES,
    MAX_ATTEMPTS,
    MAX_SENDS,
    RESEND_COOLDOWN_SECONDS,
    generateCode,
    hashSecret,
} from "../models/PendingRegistration.js";
import { sendMail, verificationEmail, isMailConfigured } from "../config/mailer.js";

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// --- Registration, in two steps ---------------------------------------------
//
// Nothing is created until the emailed code comes back. The details wait in
// pending_registrations, so an abandoned signup leaves no unverified account
// and does not hold the email address hostage.

const normaliseEmail = (value) => String(value ?? "").trim().toLowerCase();

// Sends a code and records what was sent. Shared by start and resend.
const issueCode = async (pending) => {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await pending.update({
        codeHash: await hashSecret(code),
        expiresAt,
        attempts: 0,
        sendCount: pending.sendCount + 1,
        lastSentAt: new Date(),
    });

    const { subject, text, html } = verificationEmail(code, CODE_TTL_MINUTES);

    return sendMail({ to: pending.email, subject, text, html });
};

// @desc    Begin registration - validate, store, and email a code
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { firstName, lastName, password, phone, referralCode } = req.body;
        const email = normaliseEmail(req.body.email);

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "First name, last name, email and password are all required.",
            });
        }

        if (String(password).length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Handle referral code
        let referredBy = null;
        let discountPercent = 0;

        if (referralCode) {
            const referrer = await User.findOne({ where: { referralCode } });
            if (!referrer) {
                return res.status(400).json({ message: "Invalid referral code." });
            }
            referredBy = referrer.id;
            discountPercent = 10;
        }

        // Starting again replaces any previous attempt for this address, so a
        // stale row can never lock someone out of their own signup. Expired
        // rows for everyone else go too, which keeps the table swept without
        // needing a scheduled job.
        await PendingRegistration.destroy({
            where: {
                [Op.or]: [{ email }, { expiresAt: { [Op.lt]: new Date() } }],
            },
        });

        const pending = await PendingRegistration.create({
            email,
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            phone: phone ? String(phone).trim() : null,
            passwordHash: await hashSecret(String(password)),
            referredBy,
            discountPercent,
            // Both are overwritten immediately by issueCode; the columns are
            // NOT NULL, so they need a value to be created at all.
            codeHash: "pending",
            expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
        });

        const delivery = await issueCode(pending);

        // With mail configured but failing, the code exists and nobody can ever
        // read it. Clear the attempt so they can start again cleanly rather
        // than being stuck waiting for an email that will not arrive.
        if (delivery.failed) {
            await pending.destroy();

            return res.status(502).json({
                message:
                    "We could not send the verification email. Please check the address and try again.",
            });
        }

        res.status(200).json({
            message: `We have emailed a 6-digit code to ${email}. Enter it to finish creating your account.`,
            pending: true,
            email,
            expiresInMinutes: CODE_TTL_MINUTES,
            // Lets the UI say the code is in the server console, rather than
            // leaving someone waiting for an email that will never arrive.
            mailDelivered: isMailConfigured(),
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Finish registration - check the code and create the account
// @route   POST /api/auth/register/verify   body: { email, code }
export const verifyRegistration = async (req, res) => {
    try {
        const email = normaliseEmail(req.body.email);
        const code = String(req.body.code ?? "").trim();

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are both required." });
        }

        const pending = await PendingRegistration.findOne({ where: { email } });

        if (!pending) {
            return res
                .status(400)
                .json({ message: "That request has expired. Please start again." });
        }

        if (pending.isExpired()) {
            await pending.destroy();
            return res
                .status(400)
                .json({ message: "That code has expired. Please start again." });
        }

        if (pending.attempts >= MAX_ATTEMPTS) {
            await pending.destroy();
            return res
                .status(429)
                .json({ message: "Too many incorrect codes. Please start again." });
        }

        if (!(await pending.matchesCode(code))) {
            await pending.increment("attempts");
            const left = MAX_ATTEMPTS - (pending.attempts + 1);

            return res.status(400).json({
                message:
                    left > 0
                        ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.`
                        : "That code is not right. Please start again.",
            });
        }

        // Someone may have registered this address while the code was in flight.
        const taken = await User.findOne({ where: { email } });
        if (taken) {
            await pending.destroy();
            return res.status(400).json({ message: "User with this email already exists." });
        }

        const user = await User.create(
            {
                firstName: pending.firstName,
                lastName: pending.lastName,
                email: pending.email,
                password: pending.passwordHash,
                phone: pending.phone,
                role: "customer",
                authProvider: "local",
                referredBy: pending.referredBy,
                discountPercent: pending.discountPercent,
            },
            // Hashed when the signup started - see User's beforeCreate hook.
            { passwordAlreadyHashed: true }
        );

        await pending.destroy();

        const token = generateToken(user);

        res.status(201).json({
            message: "Registration successful!",
            token,
            user: user.toSafeObject(),
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Send a fresh code for a signup already in progress
// @route   POST /api/auth/register/resend   body: { email }
export const resendRegistrationCode = async (req, res) => {
    try {
        const email = normaliseEmail(req.body.email);
        const pending = await PendingRegistration.findOne({ where: { email } });

        if (!pending) {
            return res
                .status(400)
                .json({ message: "That request has expired. Please start again." });
        }

        if (pending.sendCount >= MAX_SENDS) {
            return res
                .status(429)
                .json({ message: "Too many codes requested. Please start again later." });
        }

        const wait = pending.cooldownRemaining();

        if (wait > 0) {
            return res.status(429).json({
                message: `Please wait ${wait} more ${wait === 1 ? "second" : "seconds"} before asking for another code.`,
                retryAfter: wait,
            });
        }

        const delivery = await issueCode(pending);

        if (delivery.failed) {
            return res.status(502).json({
                message: "We could not send the verification email. Please try again shortly.",
            });
        }

        res.status(200).json({
            message: `A new code is on its way to ${email}.`,
            expiresInMinutes: CODE_TTL_MINUTES,
            cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Login user (all roles)
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated. Contact admin." });
        }

        // An account created through Google has no password. Say so plainly —
        // "invalid email or password" would send them round in circles trying
        // to reset a password that does not exist.
        if (!user.password) {
            return res.status(401).json({
                message: "This account signs in with Google. Use the Google button instead.",
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful!",
            token,
            user: user.toSafeObject(),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// ─── Google sign-in ──────────────────────────────────────────────────────────

// One client, reused. Constructed lazily so the server still boots when Google
// is not configured — the endpoint just reports that it is unavailable.
let googleClient = null;

const getGoogleClient = () => {
    if (!process.env.GOOGLE_CLIENT_ID) return null;
    googleClient ??= new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    return googleClient;
};

// Splits Google's display name into the first/last the schema requires.
const splitName = (payload) => {
    const first = payload.given_name?.trim();
    const last = payload.family_name?.trim();

    if (first) return { firstName: first, lastName: last || first };

    const parts = (payload.name ?? payload.email.split("@")[0]).trim().split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") || parts[0] };
};

// @desc    Sign in (or register) with a Google ID token
// @route   POST /api/auth/google    body: { credential }
//
// The browser never sends us an email — it sends a signed ID token, and the
// email is read out of it only after Google's signature and our client ID have
// both been checked. Anything less would let a caller sign in as anyone.
export const googleLogin = async (req, res) => {
    const client = getGoogleClient();

    if (!client) {
        return res.status(503).json({
            message: "Google sign-in is not configured on this server.",
        });
    }

    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "No Google credential was supplied." });
        }

        let payload;

        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                // Rejects a token minted for a different application, which is
                // what stops a token borrowed from another site working here.
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            payload = ticket.getPayload();
        } catch {
            return res.status(401).json({ message: "That Google sign-in could not be verified." });
        }

        // An unverified address proves nothing about who is signing in, and
        // linking on it would hand over any account with a matching email.
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({
                message: "Your Google account's email address is not verified.",
            });
        }

        const email = payload.email.toLowerCase();

        // Match on the Google subject first — it survives an email change.
        let user = await User.findOne({ where: { googleId: payload.sub } });

        if (!user) {
            user = await User.findOne({ where: { email } });
        }

        if (user) {
            if (!user.isActive) {
                return res.status(403).json({ message: "Account is deactivated. Contact admin." });
            }

            // First Google sign-in on an account that already existed. Safe to
            // link: Google has verified the person controls this address. The
            // existing role and password are left alone, so a staff member
            // keeps their access and can still sign in either way.
            if (!user.googleId) {
                await user.update({ googleId: payload.sub });
            }
        } else {
            const { firstName, lastName } = splitName(payload);

            // Always a customer. Staff and dealer accounts are admin-created, so
            // signing in with Google must never be a route to a higher role.
            user = await User.create({
                firstName,
                lastName,
                email,
                phone: null,
                role: "customer",
                authProvider: "google",
                googleId: payload.sub,
                profileImage: payload.picture ?? null,
                isActive: true,
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: "Signed in with Google.",
            token,
            user: user.toSafeObject(),
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Whether Google sign-in can be offered, so the button is not shown
//          on a server that cannot honour it.
// @route   GET /api/auth/google/status
export const googleStatus = (req, res) => {
    res.status(200).json({ enabled: Boolean(process.env.GOOGLE_CLIENT_ID) });
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
            include: [
                {
                    model: User,
                    as: "referrer",
                    attributes: ["id", "firstName", "lastName", "referralCode"],
                },
            ],
        });

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
