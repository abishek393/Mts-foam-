/*
 * Sends one test email, so SMTP can be proved working without registering an
 * account to do it.
 *
 *   node scripts/testEmail.js                  # sends to SMTP_USER
 *   node scripts/testEmail.js you@example.com  # sends somewhere else
 *
 * With SMTP_HOST empty this prints the message to the console instead, which is
 * how the site behaves in development.
 *
 * GMAIL: SMTP_PASS must be a 16-character App Password, not the account
 * password. Generate one at https://myaccount.google.com/apppasswords — it
 * requires 2-Step Verification to be switched on first. Google rejects the
 * normal password with "Username and Password not accepted".
 */

import dotenv from "dotenv";
dotenv.config();

import {
    sendMail,
    isMailConfigured,
    mailFrom,
    verificationEmail,
} from "../config/mailer.js";

const to = process.argv[2] || process.env.SMTP_USER;

const run = async () => {
    console.log("Host :", process.env.SMTP_HOST || "(none — will print to console)");
    console.log("Port :", process.env.SMTP_PORT || "587");
    console.log("User :", process.env.SMTP_USER || "(none)");
    console.log("Pass :", process.env.SMTP_PASS ? "set" : "(none)");
    console.log("From :", mailFrom());
    console.log("To   :", to || "(nobody — pass an address or set SMTP_USER)");
    console.log("");

    if (!to) {
        console.error("No recipient. Pass one: node scripts/testEmail.js you@example.com");
        process.exit(1);
    }

    if (!isMailConfigured()) {
        console.log(
            "SMTP is not fully configured, so nothing will actually be sent.\n" +
                "Fill in SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env to send for real.\n"
        );
    }

    // The real verification template, so this proves the thing customers get.
    const { subject, text, html } = verificationEmail("123456", 10);

    const result = await sendMail({ to, subject, text, html });

    if (result.failed) {
        console.error("\n❌ Sending failed:", result.reason);
        console.error(
            "\nIf this says 'Username and Password not accepted', SMTP_PASS is not a\n" +
                "valid App Password. Turn on 2-Step Verification, then generate one at\n" +
                "https://myaccount.google.com/apppasswords and paste the 16 characters in."
        );
        process.exit(1);
    }

    console.log(
        result.delivered
            ? `\n✅ Sent to ${to}. Check the inbox — and the spam folder the first time.`
            : "\n(Printed above rather than sent, because SMTP is not configured.)"
    );
};

run().catch((error) => {
    console.error("Failed:", error.message);
    process.exit(1);
});
