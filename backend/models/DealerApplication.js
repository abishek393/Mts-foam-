import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// A public dealership application. Anyone can submit one with their business
// registration and VAT documents; an admin verifies it, which then creates a
// dealer User and a Dealer directory entry.
const DealerApplication = sequelize.define(
    "DealerApplication",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Full name is required" },
            },
        },
        businessName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Business name is required" },
            },
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Location is required" },
            },
        },
        contactNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Contact number is required" },
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
                notEmpty: { msg: "Email is required" },
            },
        },
        businessType: {
            type: DataTypes.ENUM("retailer", "wholesaler", "distributor", "other"),
            allowNull: false,
            defaultValue: "retailer",
        },
        requirements: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Relative paths under backend/uploads/dealer-docs — never served statically.
        registrationDocPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        vatDocPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // on_hold: the documents are not good enough yet, but the application
        // is not refused. The applicant is emailed a link to replace them, and
        // it returns to pending once they do.
        status: {
            type: DataTypes.ENUM("pending", "on_hold", "verified", "rejected"),
            allowNull: false,
            defaultValue: "pending",
        },
        // What the applicant has to fix. Shown to them on the resubmission page
        // and quoted in the email, so "on hold" is never a dead end.
        holdRequirements: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // The resubmission link is a credential — an applicant has no account —
        // so only its hash is stored, exactly like a password.
        resubmitTokenHash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resubmitExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // Capped, so a leaked link cannot be used to upload indefinitely.
        resubmitCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reviewNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // The dealer User created on approval.
        createdUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "dealer_applications",
    }
);

export const RESUBMIT_TTL_DAYS = 14;
export const MAX_RESUBMISSIONS = 5;

// 32 random bytes, so the link cannot be guessed from an application id.
export const generateResubmitToken = () => crypto.randomBytes(32).toString("hex");

export const hashResubmitToken = (token) => bcrypt.hash(token, 10);

DealerApplication.prototype.matchesResubmitToken = function (candidate) {
    if (!this.resubmitTokenHash) return Promise.resolve(false);
    return bcrypt.compare(String(candidate), this.resubmitTokenHash);
};

DealerApplication.prototype.resubmitExpired = function () {
    return !this.resubmitExpiresAt || this.resubmitExpiresAt.getTime() < Date.now();
};

export default DealerApplication;
