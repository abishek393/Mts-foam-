"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill, formatDate, formatDateTime, fullName } from "./ui";

// Field reports as the office reads them: skim the day, open one, leave a note,
// download it. PDFs are fetched rather than linked so the session cookie goes
// with the request and any failure can be reported instead of opening a blank tab.

function NoteForm({ report, onSaved }) {
    const [note, setNote] = useState(report.adminNote ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    async function save() {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/marketer/admin/reports/${report.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminNote: note }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message ?? "That note could not be saved.");
                return;
            }

            onSaved?.();
        } catch {
            setError("Cannot reach the server. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="grid gap-2">
            <label
                htmlFor={`note-${report.id}`}
                className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
            >
                Office note — the marketer sees this
            </label>

            <textarea
                id={`note-${report.id}`}
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink focus:border-navy"
            />

            {error ? <p className="text-[0.8125rem] text-brand-red">{error}</p> : null}

            <div>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="border border-navy bg-navy px-4 py-2 text-[0.8125rem] text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save note"}
                </button>
            </div>
        </div>
    );
}

function DownloadButton({ href, filename, children, primary = false }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    async function download() {
        setBusy(true);
        setError(null);

        try {
            const res = await fetch(href);

            if (!res.ok) {
                setError("Download failed.");
                return;
            }

            // Turned into a blob and clicked, because the PDF route needs the
            // session cookie and a plain link would also navigate away.
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch {
            setError("Download failed.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <span className="inline-flex flex-col items-end">
            <button
                type="button"
                onClick={download}
                disabled={busy}
                className={`whitespace-nowrap border px-3 py-1.5 text-[0.8125rem] transition-colors disabled:opacity-50 ${
                    primary
                        ? "border-navy bg-navy text-white hover:bg-navy-dark"
                        : "border-rule-strong text-ink hover:border-ink"
                }`}
            >
                {busy ? "Preparing…" : children}
            </button>

            {error ? <span className="mt-1 text-[0.75rem] text-brand-red">{error}</span> : null}
        </span>
    );
}

export default function ReportList({ reports, filters }) {
    const router = useRouter();
    const [openId, setOpenId] = useState(null);

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters ?? {})) {
        if (value) query.set(key, value);
    }
    const bundleQuery = query.toString();

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.875rem] text-ink-muted">
                    {reports.length} {reports.length === 1 ? "report" : "reports"}
                </p>

                <DownloadButton
                    primary
                    href={`/api/marketer/admin/reports/pdf${bundleQuery ? `?${bundleQuery}` : ""}`}
                    filename="field-reports.pdf"
                >
                    Download all as PDF
                </DownloadButton>
            </div>

            <div className="grid gap-2">
                {reports.map((report) => {
                    const open = openId === report.id;

                    return (
                        <article key={report.id} className="border border-rule bg-surface">
                            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                                <div className="min-w-0">
                                    <div className="mb-1 flex flex-wrap items-center gap-3">
                                        <span className="text-[1.0625rem] text-ink">
                                            {fullName(report.marketer)}
                                        </span>

                                        <span className="text-[0.875rem] text-ink-muted">
                                            {formatDate(report.reportDate)}
                                        </span>

                                        {report.adminNote ? (
                                            <StatusPill status="verified" label="Noted" />
                                        ) : null}
                                    </div>

                                    <p className="mb-1 text-[0.8125rem] text-ink-faint">
                                        {report.visitsCount} visits · {report.ordersTaken} orders
                                        {report.areasCovered ? ` · ${report.areasCovered}` : ""}
                                    </p>

                                    <p className="max-w-2xl text-[0.9375rem] leading-6 text-ink-soft">
                                        {open ? report.summary : (report.summary ?? "").slice(0, 140)}
                                        {!open && (report.summary ?? "").length > 140 ? "…" : ""}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(open ? null : report.id)}
                                        aria-expanded={open}
                                        className="whitespace-nowrap border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                    >
                                        {open ? "Close" : "Open"}
                                    </button>

                                    <DownloadButton
                                        href={`/api/marketer/admin/reports/${report.id}/pdf`}
                                        filename={`daily-report-${report.reportDate}.pdf`}
                                    >
                                        PDF
                                    </DownloadButton>
                                </div>
                            </div>

                            {open ? (
                                <div className="border-t border-rule bg-panel px-5 py-5">
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="grid gap-4">
                                            {report.challenges ? (
                                                <div>
                                                    <p className="eyebrow mb-1.5">
                                                        Problems encountered
                                                    </p>
                                                    <p className="text-[0.9375rem] leading-6 text-ink-soft">
                                                        {report.challenges}
                                                    </p>
                                                </div>
                                            ) : null}

                                            {report.followUp ? (
                                                <div>
                                                    <p className="eyebrow mb-1.5">To follow up</p>
                                                    <p className="text-[0.9375rem] leading-6 text-ink-soft">
                                                        {report.followUp}
                                                    </p>
                                                </div>
                                            ) : null}

                                            <p className="text-[0.8125rem] text-ink-faint">
                                                Filed {formatDateTime(report.createdAt)}
                                                {report.reviewer
                                                    ? ` · noted by ${fullName(report.reviewer)}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <NoteForm
                                            report={report}
                                            onSaved={() => {
                                                setOpenId(null);
                                                router.refresh();
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
