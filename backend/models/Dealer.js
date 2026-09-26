import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// A verified dealer shown in the public "Find a dealer" directory.
// Created by an admin, or automatically when a DealerApplication is verified.
const Dealer = sequelize.define(
    "Dealer",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        businessName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Business name is required" },
            },
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "City is required" },
            },
        },
        ward: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM("authorised", "distributor"),
            allowNull: false,
            defaultValue: "authorised",
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: { msg: "Must be a valid email address" },
            },
        },
        // Set once the dealer has a login of their own.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        timestamps: true,
        tableName: "dealers",
    }
);

// Display label for the directory table, e.g. "Ward 00, Kathmandu"
Dealer.prototype.locationLabel = function () {
    return this.ward ? `${this.ward}, ${this.city}` : this.city;
};

export default Dealer;
