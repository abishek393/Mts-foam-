import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Small key/value store for things an admin sets once and rarely changes —
// currently the payment QR. A table rather than a config file because it has to
// be editable from the admin panel at runtime, and survive a redeploy.
const Setting = sequelize.define(
    "Setting",
    {
        key: {
            type: DataTypes.STRING(64),
            primaryKey: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "settings",
    }
);

// Known keys, named here so a typo in a controller cannot quietly write a
// setting nothing ever reads back.
export const SETTING_KEYS = {
    PAYMENT_QR_PATH: "payment_qr_path",
    PAYMENT_INSTRUCTIONS: "payment_instructions",
};

export const getSetting = async (key, fallback = null) => {
    const row = await Setting.findByPk(key);
    return row?.value ?? fallback;
};

export const setSetting = async (key, value) => {
    const [row] = await Setting.upsert({ key, value });
    return row;
};

export default Setting;
