import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Categories are split by group — mattress lines and PU foam lines.
export const MATTRESS_CATEGORIES = [
    "Orthopedic",
    "Memory Foam",
    "Premium",
    "Spring",
    "Regular",
    "Sample",
    "Custom",
];

export const FOAM_CATEGORIES = [
    "Flexible",
    "High Density",
    "Rebonded",
    "Sheets",
    "Custom Cut",
    "Industrial",
];

export const PRODUCT_CATEGORIES = [...MATTRESS_CATEGORIES, ...FOAM_CATEGORIES];

const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: "Slug is required" },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    msg: "Slug must be lowercase words separated by hyphens",
                },
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Product name is required" },
            },
        },
        group: {
            type: DataTypes.ENUM("mattress", "foam"),
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM(...PRODUCT_CATEGORIES),
            allowNull: false,
        },
        shortDescription: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Mattress-specific
        firmness: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        coreSpec: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Foam-specific
        density: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Shared specification fields — arrays of display strings, e.g. ["6 in", "8 in"]
        thicknesses: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        sizes: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        applications: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        features: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        images: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        // Years of guarantee, e.g. 5. Null where none is offered — which is not
        // the same as zero years, so the column is nullable rather than
        // defaulting.
        warrantyYears: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: { args: [0], msg: "Guarantee cannot be negative" },
                max: { args: [50], msg: "Guarantee looks too long — check the years" },
            },
        },
        // One-line spec shown on catalogue cards
        keySpec: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        leadTime: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "[Placeholder]",
        },
        // Denormalised review aggregate, recomputed whenever a review is
        // written, edited, hidden or deleted. Stored rather than derived so the
        // catalogue can render stars for thirteen products in one query instead
        // of thirteen.
        ratingAverage: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ratingCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
        tableName: "products",
        validate: {
            // Keep category consistent with its group so filters never disagree.
            categoryMatchesGroup() {
                const allowed =
                    this.group === "mattress" ? MATTRESS_CATEGORIES : FOAM_CATEGORIES;

                if (this.group && this.category && !allowed.includes(this.category)) {
                    throw new Error(
                        `Category '${this.category}' is not valid for group '${this.group}'`
                    );
                }
            },
        },
    }
);

export default Product;
