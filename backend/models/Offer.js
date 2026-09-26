import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Consumer offers and dealer schemes. Structured so an admin panel can edit
// every field later without a schema change.
const Offer = sequelize.define(
    "Offer",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Offer title is required" },
            },
        },
        audience: {
            type: DataTypes.ENUM("consumer", "dealer", "trade", "new_dealer"),
            allowNull: false,
            defaultValue: "consumer",
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Free-text validity as shown in the design, e.g. "[dd.mm – dd.mm]" or "Ongoing".
        validityLabel: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "Ongoing",
        },
        // Optional real dates, used for filtering once actual schemes are entered.
        validFrom: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        validTo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        // Display strings for eligible product lines, e.g. ["OrthoCare", "MemoRest"]
        eligibleProducts: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        bannerImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Downloadable scheme document.
        documentUrl: {
            type: DataTypes.STRING,
            allowNull: true,
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
        tableName: "offers",
    }
);

export default Offer;
