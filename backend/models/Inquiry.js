import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// The site's single conversion action. Always tied to a logged-in user —
// there is no guest inquiry path, and no pricing or checkout anywhere.
const Inquiry = sequelize.define(
    "Inquiry",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Null for a general enquiry that isn't about a specific line.
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        // Snapshot of what was asked about, so the record still reads correctly
        // if the product is later renamed or deactivated.
        productLabel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Contact details default to the user's, but can be overridden per inquiry.
        contactName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contactPhone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contactEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
            },
        },
        // Either a preset size label ("60 × 72 in") or custom dimensions from
        // the size calculator — both are kept.
        sizeLabel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lengthIn: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
        widthIn: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
        thicknessIn: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: { args: [1], msg: "Quantity must be at least 1" },
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Which part of the site the inquiry came from.
        source: {
            type: DataTypes.ENUM(
                "product",
                "compare",
                "finder",
                "calculator",
                "contact",
                "offer",
                "dealer"
            ),
            allowNull: false,
            defaultValue: "contact",
        },
        status: {
            type: DataTypes.ENUM("new", "contacted", "quoted", "closed"),
            allowNull: false,
            defaultValue: "new",
        },
        // Staff member handling it.
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        internalNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "inquiries",
    }
);

export default Inquiry;
