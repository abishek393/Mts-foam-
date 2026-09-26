import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// One line of an order. Product name and specification are snapshotted so the
// order still reads correctly if the product is later renamed or withdrawn.
const OrderItem = sequelize.define(
    "OrderItem",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        productLabel: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Product name is required" },
            },
        },
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
        note: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "order_items",
    }
);

export default OrderItem;
