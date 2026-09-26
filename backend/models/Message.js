import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const MAX_MESSAGE_LENGTH = 2000;

const Message = sequelize.define(
    "Message",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        conversationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Which side of the conversation this came from. Stored rather than
        // derived from the sender's current role, so a customer later promoted
        // to staff does not retroactively change who said what.
        senderRole: {
            type: DataTypes.ENUM("customer", "staff"),
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: "A message cannot be empty" },
                len: {
                    args: [1, MAX_MESSAGE_LENGTH],
                    msg: `A message cannot be longer than ${MAX_MESSAGE_LENGTH} characters`,
                },
            },
        },
        // Optional context — "I'm asking about this product".
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "messages",
        indexes: [
            // Every read is "this conversation, in order", so the index matches.
            { name: "messages_conversation_time", fields: ["conversationId", "createdAt"] },
        ],
    }
);

export default Message;
