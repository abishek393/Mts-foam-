import PDFDocument from "pdfkit";

// PDF rendering for the documents an admin downloads: a marketer's daily
// report, and an order taken in the field.
//
// Everything streams straight to the response — a report is small, but building
// one in memory to hand back a Buffer would be needless, and streaming means
// the browser starts receiving immediately.

const NAVY = "#1b2a6b";
const INK = "#1a1a1a";
const MUTED = "#6b6560";
const RULE = "#cfc9c0";
const ACCENT = "#a08b5f";

const MARGIN = 50;

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "—";

const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";

const fullName = (user) =>
    user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "—";

// Letterhead, so a downloaded page still says who it is from once printed.
const header = (doc, title, subtitle) => {
    doc.fillColor(NAVY).fontSize(20).font("Helvetica-Bold").text("4STAR", MARGIN, MARGIN);

    doc.fillColor(ACCENT)
        .fontSize(8)
        .font("Helvetica")
        .text("MATTRESS & PU FOAM", MARGIN, doc.y + 2, { characterSpacing: 2 });

    doc.moveDown(1.5);

    doc.fillColor(INK).fontSize(16).font("Helvetica-Bold").text(title);

    if (subtitle) {
        doc.fillColor(MUTED).fontSize(10).font("Helvetica").text(subtitle);
    }

    doc.moveDown(0.8);

    doc.strokeColor(RULE)
        .lineWidth(1)
        .moveTo(MARGIN, doc.y)
        .lineTo(doc.page.width - MARGIN, doc.y)
        .stroke();

    doc.moveDown(1);
};

const footer = (doc) => {
    const y = doc.page.height - 40;

    doc.fillColor(MUTED)
        .fontSize(8)
        .font("Helvetica")
        .text(
            `Generated ${formatDateTime(new Date())} · 4STAR Mattress & PU Foam`,
            MARGIN,
            y,
            { align: "center", width: doc.page.width - MARGIN * 2 }
        );
};

// A label/value row. Long values wrap and the next row starts below them.
const field = (doc, label, value) => {
    doc.fillColor(MUTED).fontSize(8).font("Helvetica").text(label.toUpperCase(), {
        characterSpacing: 1,
    });

    doc.fillColor(INK)
        .fontSize(11)
        .font("Helvetica")
        .text(value || "—", { width: doc.page.width - MARGIN * 2 });

    doc.moveDown(0.7);
};

const section = (doc, title) => {
    doc.moveDown(0.3);
    doc.fillColor(NAVY).fontSize(11).font("Helvetica-Bold").text(title);
    doc.moveDown(0.4);
};

// ─── Daily report ────────────────────────────────────────────────────────────

export const dailyReportPdf = (report, res) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });

    const filename = `daily-report-${report.reportDate}-${fullName(report.marketer)
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    header(doc, "Daily field report", formatDate(report.reportDate));

    field(doc, "Marketer", fullName(report.marketer));
    field(doc, "Areas covered", report.areasCovered);

    // The two numbers side by side — they are the headline of the report.
    const y = doc.y;
    const half = (doc.page.width - MARGIN * 2) / 2;

    doc.fillColor(MUTED).fontSize(8).text("VISITS", MARGIN, y, { characterSpacing: 1 });
    doc.fillColor(INK).fontSize(22).font("Helvetica-Bold").text(String(report.visitsCount), MARGIN, doc.y);

    doc.fillColor(MUTED).fontSize(8).font("Helvetica").text("ORDERS TAKEN", MARGIN + half, y, {
        characterSpacing: 1,
    });
    doc.fillColor(INK)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(String(report.ordersTaken), MARGIN + half, y + 12);

    doc.moveDown(1.5);
    doc.x = MARGIN;

    section(doc, "Summary of the day");
    doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.summary || "—", {
        width: doc.page.width - MARGIN * 2,
        align: "left",
    });

    if (report.challenges) {
        section(doc, "Problems encountered");
        doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.challenges);
    }

    if (report.followUp) {
        section(doc, "To follow up");
        doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.followUp);
    }

    if (report.adminNote) {
        section(doc, "Office note");
        doc.fillColor(MUTED).fontSize(10).font("Helvetica-Oblique").text(report.adminNote);
    }

    doc.moveDown(1.5);
    doc.fillColor(MUTED)
        .fontSize(9)
        .font("Helvetica")
        .text(`Filed ${formatDateTime(report.createdAt)}`);

    footer(doc);
    doc.end();
};

// ─── Order ───────────────────────────────────────────────────────────────────

export const orderPdf = (order, res) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="order-${order.orderNumber}.pdf"`
    );

    doc.pipe(res);

    header(doc, `Order ${order.orderNumber}`, formatDate(order.createdAt));

    field(doc, "Status", order.status);

    if (order.channel === "marketer") {
        field(doc, "Taken by", `${fullName(order.placedBy)} (field order)`);
    }

    section(doc, "Customer");
    if (order.customerBusiness) field(doc, "Business", order.customerBusiness);
    field(doc, "Contact", order.contactName);
    field(doc, "Phone", order.contactPhone);
    field(doc, "Email", order.contactEmail);
    field(doc, "Delivery address", order.deliveryAddress);

    section(doc, `Items — ${order.items?.length ?? 0}`);

    // A plain table. No prices anywhere: an order on this site is a request
    // that 4STAR quotes against, so a total would be inventing a number.
    const width = doc.page.width - MARGIN * 2;
    const cols = [width * 0.44, width * 0.32, width * 0.12, width * 0.12];

    const row = (cells, bold = false) => {
        const top = doc.y;
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

        let x = MARGIN;
        cells.forEach((cell, index) => {
            doc.fillColor(bold ? MUTED : INK).text(String(cell ?? "—"), x, top, {
                width: cols[index] - 6,
            });
            x += cols[index];
        });

        doc.y = top + 16;
    };

    row(["PRODUCT", "SIZE", "QTY", ""], true);

    doc.strokeColor(RULE)
        .moveTo(MARGIN, doc.y - 4)
        .lineTo(doc.page.width - MARGIN, doc.y - 4)
        .stroke();

    for (const item of order.items ?? []) {
        const size =
            item.sizeLabel ||
            (item.lengthIn && item.widthIn
                ? `${Number(item.widthIn)} x ${Number(item.lengthIn)} in`
                : "—");

        row([item.productLabel, size, item.quantity, ""]);

        if (item.note) {
            doc.fillColor(MUTED).fontSize(8).text(item.note, MARGIN + 10, doc.y);
            doc.y += 4;
        }
    }

    doc.strokeColor(RULE)
        .moveTo(MARGIN, doc.y + 2)
        .lineTo(doc.page.width - MARGIN, doc.y + 2)
        .stroke();

    doc.moveDown(1);

    if (order.note) {
        section(doc, "Customer note");
        doc.fillColor(INK).fontSize(10).font("Helvetica").text(order.note);
    }

    doc.moveDown(1);
    doc.fillColor(MUTED)
        .fontSize(9)
        .font("Helvetica")
        .text("No payment has been taken. 4STAR will quote against this request.");

    footer(doc);
    doc.end();
};

// ─── Many reports at once ────────────────────────────────────────────────────

// One page per report, for "download this marketer's month".
export const reportBundlePdf = (reports, res, { title }) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${title.replace(/\s+/g, "-").toLowerCase()}.pdf"`
    );

    doc.pipe(res);

    reports.forEach((report, index) => {
        if (index > 0) doc.addPage();

        header(doc, "Daily field report", formatDate(report.reportDate));

        field(doc, "Marketer", fullName(report.marketer));
        field(doc, "Areas covered", report.areasCovered);
        field(doc, "Visits", String(report.visitsCount));
        field(doc, "Orders taken", String(report.ordersTaken));

        section(doc, "Summary");
        doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.summary || "—");

        if (report.challenges) {
            section(doc, "Problems encountered");
            doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.challenges);
        }

        if (report.followUp) {
            section(doc, "To follow up");
            doc.fillColor(INK).fontSize(11).font("Helvetica").text(report.followUp);
        }

        footer(doc);
    });

    if (reports.length === 0) {
        header(doc, title, "No reports in this period");
        footer(doc);
    }

    doc.end();
};
