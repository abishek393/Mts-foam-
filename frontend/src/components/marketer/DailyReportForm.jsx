"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/admin/form-bits";

// The end-of-day report. Filing again for the same date updates it, so a rep
// can correct a number without creating a second record for the day.

export default function DailyReportForm({ today, existing, onSaved }) {
    const router = useRouter();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(null);

    async function submit(event) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        setSubmitting(true);
        setError(null);
        setSaved(null);

        try {
            const res = await fetch("/api/marketer/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportDate: form.get("reportDate"),
                    areasCovered: form.get("areasCovered"),
                    visitsCount: form.get("visitsCount"),
                    ordersTaken: form.get("ordersTaken"),
                    summary: form.get("summary"),
                    challenges: form.get("challenges"),
                    followUp: form.get("followUp"),
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(
                    data.errors?.length
                        ? data.errors.join(" ")
                        : (data.message ?? "That report could not be saved.")
                );
                setSubmitting(false);
                return;
            }

            setSaved(data.updated ? "Report updated." : "Report filed.");
            onSaved?.();
            router.refresh();
        } catch {
            setError("Cannot reach the server. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-6">
            <section className="border border-rule bg-surface p-5 sm:p-6">
                <h2 className="eyebrow mb-5">The day</h2>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                        label="Date"
                        name="reportDate"
                        type="date"
                        required
                        max={today}
                        defaultValue={existing?.reportDate ?? today}
                        hint="Filing again for a date you've already reported updates it."
                        className="sm:col-span-3"
                    />

                    <Field
                        label="Areas covered"
                        name="areasCovered"
                        defaultValue={existing?.areasCovered ?? ""}
                        placeholder="Itahari, Dharan"
                        className="sm:col-span-3"
                    />

                    <Field
                        label="Shops visited"
                        name="visitsCount"
                        type="number"
                        min="0"
                        defaultValue={existing?.visitsCount ?? 0}
                    />

                    <Field
                        label="Orders taken"
                        name="ordersTaken"
                        type="number"
                        min="0"
                        defaultValue={existing?.ordersTaken ?? 0}
                    />
                </div>
            </section>

            <section className="border border-rule bg-surface p-5 sm:p-6">
                <h2 className="eyebrow mb-5">What happened</h2>

                <div className="grid gap-4">
                    <Field
                        label="Summary of the day"
                        name="summary"
                        rows={4}
                        required
                        defaultValue={existing?.summary ?? ""}
                        placeholder="Where you went, who you met, how it went."
                    />

                    <Field
                        label="Problems encountered"
                        name="challenges"
                        rows={3}
                        defaultValue={existing?.challenges ?? ""}
                    />

                    <Field
                        label="To follow up"
                        name="followUp"
                        rows={3}
                        defaultValue={existing?.followUp ?? ""}
                        placeholder="Anything the office should chase."
                    />
                </div>
            </section>

            {error ? (
                <p
                    role="alert"
                    className="border border-brand-red bg-brand-red/5 px-4 py-3 text-[0.875rem] text-brand-red"
                >
                    {error}
                </p>
            ) : null}

            {saved ? (
                <p
                    role="status"
                    className="border border-navy bg-navy/5 px-4 py-3 text-[0.875rem] text-navy"
                >
                    {saved}
                </p>
            ) : null}

            <div className="border-t border-rule pt-6">
                <button
                    type="submit"
                    disabled={submitting}
                    className="border border-navy bg-navy px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
                >
                    {submitting ? "Saving…" : existing ? "Update report" : "File report"}
                </button>
            </div>
        </form>
    );
}
