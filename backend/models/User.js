import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "First name is required" },
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Last name is required" },
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
                notEmpty: { msg: "Email is required" },
            },
        },
        password: {
            // Null for an account that only ever signs in with Google — there is
            // no password to store. A local account must still have one, which
            // is enforced by the passwordRequiredForLocalAccounts validator
            // below rather than by allowNull, since the column now has to hold
            // both kinds of account.
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: {
                    args: [6, 255],
                    msg: "Password must be at least 6 characters",
                },
            },
        },
        // How this account signs in. "google" accounts have a googleId and no
        // password; "local" accounts have a password and may also have a
        // googleId once they link the two.
        authProvider: {
            type: DataTypes.ENUM("local", "google"),
            allowNull: false,
            defaultValue: "local",
        },
        googleId: {
            // Google's stable subject identifier. Not the email — an email can
            // change hands, `sub` cannot.
            type: DataTypes.STRING(64),
            allowNull: true,
            unique: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            // "marketer" is a field sales rep: they place orders on the road
            // and file a daily report, in their own panel at /marketer.
            type: DataTypes.ENUM("admin", "customer", "employee", "dealer", "marketer"),
            allowNull: false,
            defaultValue: "customer",
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        referralCode: {
            // Generated as "4STAR-" + 6 hex characters = 12 chars, so this
            // must be wider than 10 or every customer registration fails.
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: true,
        },
        referredBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        discountPercent: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
        tableName: "users",
        validate: {
            // A local account with no password could never sign in, and would
            // make comparePassword meaningless.
            passwordRequiredForLocalAccounts() {
                if (this.authProvider === "local" && !this.password) {
                    throw new Error("Password is required");
                }
            },
            googleAccountsNeedAnId() {
                if (this.authProvider === "google" && !this.googleId) {
                    throw new Error("A Google account must have a Google ID");
                }
            },
        },
        hooks: {
            // Hash password before creating a user.
            //
            // `passwordAlreadyHashed` is passed when the account is being
            // created from a verified pending registration, whose password was
            // hashed when the signup started — hashing it again would produce a
            // hash of a hash, and the user could never sign in.
            beforeCreate: async (user, options) => {
                if (user.password && !options?.passwordAlreadyHashed) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                // Auto-generate referral code for customers
                if (user.role === "customer" && !user.referralCode) {
                    user.referralCode = "4STAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
                }
            },
            // Hash password before updating if it changed
            beforeUpdate: async (user) => {
                if (user.changed("password")) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

// Self-referencing association: User.referredBy -> User.id
User.belongsTo(User, { as: "referrer", foreignKey: "referredBy" });
User.hasMany(User, { as: "referrals", foreignKey: "referredBy" });

// Instance method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
    // A Google-only account has no hash to compare against. Returning false
    // rather than letting bcrypt throw keeps the login route's error identical
    // to a wrong password, so this endpoint cannot be used to discover which
    // emails are registered and how.
    if (!this.password) return false;

    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return user data without password
User.prototype.toSafeObject = function () {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
};

export default User;
