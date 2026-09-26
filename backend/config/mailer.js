import nodemailer from "nodemailer";

// Every outbound email goes through here, the same way every filesystem call
// goes through config/storage.js. Swapping provider means rewriting this module
// and nothing else.
//
// With SMTP configured, mail is sent for real. Without it, the message is
// printed to the server console instead — so registration is fully testable
// before anyone has signed up for a mail service, and a missing password in
// production fails loudly rather than silently dropping mail.

// Read when they are used, never captured at import time.
//
// ES module imports are all evaluated before the first statement of the file
// that imports them, so a module-level `const SMTP_HOST = process.env.SMTP_HOST`
// runs before any dotenv.config() in the entry point and captures undefined.
// The symptom is nasty: mail stays "not configured" however correct .env is,
// and every message quietly prints to the console instead of being sent.
const settings = () => ({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
});

// Gmail refuses to send as anyone but the authenticated account, so the
// account address is the fallback rather than an invented no-reply one.
export const mailFrom = () =>
    process.env.MAIL_FROM ||
    (process.env.SMTP_USER
        ? `4STAR Mattress <${process.env.SMTP_USER}>`
        : "4STAR Mattress <no-reply@4starmattress.com>");

export const isMailConfigured = () => {
    const { host, user, pass } = settings();
    return Boolean(host && user && pass);
};

let transport = null;
let transportKey = null;

const getTransport = () => {
    if (!isMailConfigured()) return null;

    const { host, port, user, pass } = settings();

    // Rebuilt if the credentials change, so editing .env and restarting cannot
    // leave a stale transport behind.
    const key = `${host}:${port}:${user}`;

    if (!transport || transportKey !== key) {
        transport = nodemailer.createTransport({
            host,
            port,
            // 465 is implicit TLS; 587 upgrades with STARTTLS.
            secure: port === 465,
            auth: { user, pass },
            // Bounded, because a signup form is waiting on this.
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
        });

        transportKey = key;
    }

    return transport;
};

// Resolves to { delivered } — true when a mail server accepted it, false when
// it was only logged. Callers use this to decide what to tell the user.
export const sendMail = async ({ to, subject, text, html }) => {
    const mailer = getTransport();

    if (!mailer) {
        // Deliberately loud and easy to spot in the terminal, because in
        // development this IS the delivery mechanism.
        console.log(
            [
                "",
                "──────────── EMAIL (not sent — no SMTP configured) ────────────",
                `To:      ${to}`,
                `Subject: ${subject}`,
                "",
                text,
                "───────────────────────────────────────────────────────────────",
                "",
            ].join("\n")
        );

        return { delivered: false };
    }

    // A dropped connection is not a rejection — Gmail resets one now and then,
    // especially on repeat connections from the same address. Retrying costs a
    // second; not retrying loses somebody's signup and makes them start over.
    const TRANSIENT = ["ECONNRESET", "ETIMEDOUT", "ESOCKET", "ECONNECTION", "EDNS"];
    const ATTEMPTS = 3;

    let last = null;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
            await mailer.sendMail({ from: mailFrom(), to, subject, text, html });
            return { delivered: true };
        } catch (error) {
            last = error;

            const transient =
                TRANSIENT.includes(error.code) ||
                // Nodemailer does not always set a code on a socket hang-up.
                /ECONNRESET|socket hang up|timed? out/i.test(error.message ?? "");

            if (!transient || attempt === ATTEMPTS) break;

            console.warn(
                `[mail] attempt ${attempt} failed (${error.message}); retrying…`
            );

            // A short, growing pause — an instant retry usually hits the same
            // condition that caused the reset.
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
    }

    // The real reason — bad app password, blocked sign-in, host unreachable —
    // belongs in the server log, not in a response to whoever is signing up.
    // They get a readable message from the caller instead.
    console.error("[mail] delivery failed:", last?.message);

    return { delivered: false, failed: true, reason: last?.message };
};

// ─── Templates ───────────────────────────────────────────────────────────────

// Plain text is what most people will see; the HTML is a courtesy. The code is
// repeated in the subject line so it is readable from a notification without
// opening the mail.
export const verificationEmail = (code, minutes) => ({
    subject: `${code} is your 4STAR verification code`,
    text: [
        "Welcome to 4STAR Mattress & PU Foam.",
        "",
        `Your verification code is: ${code}`,
        "",
        `It expires in ${minutes} minutes.`,
        "",
        "If you did not try to create an account, you can ignore this email —",
        "no account has been created and nothing will happen.",
    ].join("\n"),
    html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.6">
          <p style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#a08b5f;margin:0 0 16px">
            4STAR Mattress &amp; PU Foam
          </p>

          <p style="margin:0 0 20px">Your verification code is:</p>

          <p style="font-size:32px;letter-spacing:0.3em;font-weight:600;margin:0 0 20px;color:#1b2a6b">
            ${code}
          </p>

          <p style="margin:0 0 20px;color:#4a4540">It expires in ${minutes} minutes.</p>

          <p style="margin:0;font-size:14px;color:#6b6560">
            If you did not try to create an account, you can ignore this email —
            no account has been created and nothing will happen.
          </p>
        </div>
    `,
});

// ─── Dealer application (KYC) ────────────────────────────────────────────────

// Shared wrapper so the three decision emails look like one another.
const shell = (heading, bodyHtml) => `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.6">
      <p style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#a08b5f;margin:0 0 16px">
        4STAR Mattress &amp; PU Foam
      </p>
      <p style="font-size:20px;margin:0 0 20px;color:#1b2a6b">${heading}</p>
      ${bodyHtml}
    </div>
`;

// Put on hold: what is wrong, and the link to put it right.
export const applicationHeldEmail = ({ businessName, requirements, link, days }) => ({
    subject: "Your 4STAR dealership application needs another document",
    text: [
        `Dear ${businessName},`,
        "",
        "We have reviewed your dealership application and need something further",
        "before we can approve it:",
        "",
        requirements || "Please re-upload clearer copies of your documents.",
        "",
        "You can upload the replacement here:",
        link,
        "",
        `This link works for ${days} days. Your application is not refused — it`,
        "returns to our review queue as soon as you upload.",
        "",
        "4STAR Mattress & PU Foam",
    ].join("\n"),
    html: shell(
        "We need another document",
        `<p style="margin:0 0 16px">Dear ${businessName},</p>
         <p style="margin:0 0 16px">We have reviewed your dealership application and need something further before we can approve it:</p>
         <p style="margin:0 0 20px;padding:12px 16px;background:#f5f2ed;border-left:3px solid #a08b5f;white-space:pre-line">${
             requirements || "Please re-upload clearer copies of your documents."
         }</p>
         <p style="margin:0 0 20px">
           <a href="${link}" style="display:inline-block;background:#1b2a6b;color:#fff;padding:12px 22px;text-decoration:none">Upload the document</a>
         </p>
         <p style="margin:0;font-size:14px;color:#6b6560">This link works for ${days} days. Your application is not refused — it returns to our review queue as soon as you upload.</p>`
    ),
});

// Approved. The temporary password is here because there is no other way to
// deliver it — the account is created at this moment.
export const applicationApprovedEmail = ({ businessName, email, temporaryPassword, loginUrl }) => ({
    subject: "Your 4STAR dealership has been approved",
    text: [
        `Dear ${businessName},`,
        "",
        "Your dealership application has been approved. You are now listed in the",
        "4STAR dealer directory.",
        "",
        ...(temporaryPassword
            ? [
                  "Sign in with:",
                  `  Email:    ${email}`,
                  `  Password: ${temporaryPassword}`,
                  "",
                  "Please change this password after your first sign-in.",
              ]
            : ["Sign in with your existing 4STAR account."]),
        "",
        loginUrl,
        "",
        "4STAR Mattress & PU Foam",
    ].join("\n"),
    html: shell(
        "Your dealership is approved",
        `<p style="margin:0 0 16px">Dear ${businessName},</p>
         <p style="margin:0 0 16px">Your dealership application has been approved. You are now listed in the 4STAR dealer directory.</p>
         ${
             temporaryPassword
                 ? `<div style="margin:0 0 20px;padding:14px 16px;background:#f5f2ed">
                      <p style="margin:0 0 6px;font-size:14px;color:#6b6560">Sign in with</p>
                      <p style="margin:0;font-size:15px">${email}</p>
                      <p style="margin:4px 0 0;font-size:18px;letter-spacing:0.1em;color:#1b2a6b"><strong>${temporaryPassword}</strong></p>
                    </div>
                    <p style="margin:0 0 20px;font-size:14px;color:#6b6560">Please change this password after your first sign-in.</p>`
                 : `<p style="margin:0 0 20px">Sign in with your existing 4STAR account.</p>`
         }
         <p style="margin:0">
           <a href="${loginUrl}" style="display:inline-block;background:#1b2a6b;color:#fff;padding:12px 22px;text-decoration:none">Sign in</a>
         </p>`
    ),
});

// Declined. Says why, and does not pretend the door is still open.
export const applicationRejectedEmail = ({ businessName, reason }) => ({
    subject: "About your 4STAR dealership application",
    text: [
        `Dear ${businessName},`,
        "",
        "Thank you for your interest in becoming a 4STAR dealer. After reviewing",
        "your application we are not able to take it forward at this time.",
        "",
        ...(reason ? ["Reason given:", reason, ""] : []),
        "If you believe this was decided in error, reply to this email and we",
        "will look again.",
        "",
        "4STAR Mattress & PU Foam",
    ].join("\n"),
    html: shell(
        "About your application",
        `<p style="margin:0 0 16px">Dear ${businessName},</p>
         <p style="margin:0 0 16px">Thank you for your interest in becoming a 4STAR dealer. After reviewing your application we are not able to take it forward at this time.</p>
         ${
             reason
                 ? `<p style="margin:0 0 20px;padding:12px 16px;background:#f5f2ed;border-left:3px solid #cfc9c0;white-space:pre-line">${reason}</p>`
                 : ""
         }
         <p style="margin:0;font-size:14px;color:#6b6560">If you believe this was decided in error, reply to this email and we will look again.</p>`
    ),
});

// Confirms a resubmission landed, so the applicant is not left wondering.
export const applicationResubmittedEmail = ({ businessName }) => ({
    subject: "We have your updated documents",
    text: [
        `Dear ${businessName},`,
        "",
        "Thank you — your updated documents have been received and your",
        "application is back with our team for review.",
        "",
        "4STAR Mattress & PU Foam",
    ].join("\n"),
    html: shell(
        "Documents received",
        `<p style="margin:0 0 16px">Dear ${businessName},</p>
         <p style="margin:0">Thank you — your updated documents have been received and your application is back with our team for review.</p>`
    ),
});
