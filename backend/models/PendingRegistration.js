import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// A registration that has been started but not yet proved. The account does not
// exist until the emailed code comes back, so a half-finished signup never
// leaves an unverified User behind — and never occupies the email address that
// someone else might legitimately register.
//
// Rows are short-lived: superseded on a fresh attempt, deleted on success, and
// swept once they expire.

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS = 5;

const PendingRegistration = sequelize.define(
    "PendingRegistration",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
            },
        },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: true },

        // Already bcrypt-hashed. The plaintext password is never stored, not
        // even for the ten minutes this row lives.
        passwordHash: { type: DataTypes.STRING, allowNull: false },

        // Referral details are captured now so the code the user typed cannot
        // stop being valid between starting and finishing the signup.
        referredBy: { type: DataTypes.INTEGER, allowNull: true },
        discountPercent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

        // The code is a credential, so only its hash is kept.
        codeHash: { type: DataTypes.STRING, allowNull: false },

        expiresAt: { type: DataTypes.DATE, allowNull: false },

        // Wrong guesses. Past MAX_ATTEMPTS the row is spent and a new code must
        // be requested, which is what stops a six-digit code being brute forced.
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

        // Sends, for the resend cooldown and cap — so this endpoint cannot be
        // used to post mail at someone repeatedly.
        sendCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        lastSentAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
        timestamps: true,
        tableName: "pending_registrations",
    }
);

// Six digits, uniformly distributed. Math.random() is not acceptable for
// something that stands in for proof of identity.
export const generateCode = () =>
    String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

export const hashSecret = async (value) => bcrypt.hash(value, 10);

PendingRegistration.prototype.matchesCode = async function (candidate) {
    return bcrypt.compare(String(candidate), this.codeHash);
};

PendingRegistration.prototype.isExpired = function () {
    return this.expiresAt.getTime() < Date.now();
};

// Seconds still to wait before another code may be sent, or 0.
PendingRegistration.prototype.cooldownRemaining = function () {
    if (!this.lastSentAt) return 0;

    const elapsed = (Date.now() - this.lastSentAt.getTime()) / 1000;
    return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
};

export default PendingRegistration;
