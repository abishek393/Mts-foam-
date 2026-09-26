import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// A saved product. One row per user per product — the unique index is what
// makes "add to favourites" idempotent.
const Favourite = sequelize.define(
    "Favourite",
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
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        tableName: "favourites",
        indexes: [
            {
                unique: true,
                fields: ["userId", "productId"],
                name: "favourites_user_product_unique",
            },
        ],
    }
);

export default Favourite;
