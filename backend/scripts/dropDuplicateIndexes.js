/*
 * Removes the duplicate indexes that `sequelize.sync({ alter: true })` piles up.
 *
 * Every boot, `alter: true` re-adds a UNIQUE index for each column declared
 * `unique: true` instead of recognising the one already there. They accumulate
 * — `users.email`, `users.referralCode`, `products.slug`, `orders.orderNumber` —
 * until MySQL's hard ceiling of 64 keys per table is hit, at which point every
 * further ALTER fails with ER_TOO_MANY_KEYS and sync stops working entirely.
 *
 * This keeps one index per distinct column set and drops the rest, so no
 * constraint is lost — the duplicates are byte-for-byte identical.
 *
 *   node scripts/dropDuplicateIndexes.js          # report only
 *   node scripts/dropDuplicateIndexes.js --apply  # actually drop them
 *
 * Run it whenever the counts creep back up. The lasting fix is to stop using
 * `alter: true` on every boot and adopt migrations.
 */

import { sequelize } from "../config/database.js";

const TABLES = [
    "users",
    "products",
    "dealers",
    "offers",
    "inquiries",
    "orders",
    "order_items",
    "dealer_applications",
    "favourites",
];

const apply = process.argv.includes("--apply");

const run = async () => {
    await sequelize.authenticate();

    let total = 0;

    for (const table of TABLES) {
        let rows;

        try {
            [rows] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
        } catch (error) {
            console.log(`${table.padEnd(20)} skipped — ${error.message}`);
            continue;
        }

        // Group index names by the columns they cover, in order.
        const columnsByIndex = {};

        for (const row of rows) {
            (columnsByIndex[row.Key_name] ??= []).push(row.Column_name);
        }

        const keep = new Set(["PRIMARY"]);
        const seen = new Set();
        const drop = [];

        // Sorted so the canonical name ("email") is kept and the numbered
        // duplicates ("email_2", "email_3", …) are the ones dropped.
        for (const name of Object.keys(columnsByIndex).sort()) {
            if (name === "PRIMARY") continue;

            const signature = columnsByIndex[name].join(",");

            if (seen.has(signature)) drop.push(name);
            else {
                seen.add(signature);
                keep.add(name);
            }
        }

        const before = Object.keys(columnsByIndex).length;

        if (drop.length === 0) {
            console.log(`${table.padEnd(20)} ${String(before).padStart(3)} indexes — nothing to do`);
            continue;
        }

        if (apply) {
            for (const name of drop) {
                await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${name}\``);
            }
        }

        total += drop.length;

        console.log(
            `${table.padEnd(20)} ${String(before).padStart(3)} indexes — ` +
                `${apply ? "dropped" : "would drop"} ${drop.length}, keeping ${keep.size}`
        );
    }

    console.log(
        total === 0
            ? "\nNo duplicates found."
            : apply
              ? `\nDropped ${total} duplicate indexes.`
              : `\n${total} duplicates found. Re-run with --apply to drop them.`
    );

    await sequelize.close();
};

run().catch((error) => {
    console.error("Failed:", error.message);
    process.exit(1);
});
