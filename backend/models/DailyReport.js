import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// A marketer's end-of-day field report. One per marketer per day — the day's
// work is a single record, so filing twice means editing, not duplicating.
const DailyReport = sequelize.define(
    "DailyReport",
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
        // DATEONLY: which day's work this is, not when it was typed up. A report
        // filed at 9pm and one filed next morning for yesterday are the same day.
        reportDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        areasCovered: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        visitsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: { args: [0], msg: "Visits cannot be negative" } },
        },
        ordersTaken: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: { args: [0], msg: "Orders cannot be negative" } },
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { notEmpty: { msg: "Write a short summary of the day" } },
        },
        challenges: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        followUp: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Staff-only note added after reading it. The marketer never sees this.
        adminNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "daily_reports",
        indexes: [
            {
                name: "daily_reports_user_date",
                unique: true,
                fields: ["userId", "reportDate"],
            },
        ],
    }
);

export default DailyReport;
