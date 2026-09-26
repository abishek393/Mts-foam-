import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// One running conversation per customer, whatever they are asking about —
// staff answer in one place rather than chasing a thread per inquiry.
const Conversation = sequelize.define(
    "Conversation",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // One per customer, enforced by the database rather than by checking
        // first — two tabs opening a chat at once would otherwise race.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        // Denormalised so the staff conversation list can sort and preview
        // without joining every message table row.
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        lastMessagePreview: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        // Unread is derived by comparing these to message timestamps, so it
        // stays correct even if a socket event is missed.
        customerLastReadAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        staffLastReadAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // Optional — set when a staff member picks the conversation up.
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "conversations",
    }
);

export default Conversation;
