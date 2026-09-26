"use client";

import { useState } from "react";
import FormField from "./FormField";
import Button from "./Button";
import { API_BASE } from "@/lib/session-config";

// The applicant replacing a document after being put on hold. They have no
// account — the emailed token in the URL is what authorises this, so the upload
// goes straight to the API with the token in the path.

export default function ResubmitForm({ id, token, application }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    async function submit(event) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const payload = new FormData();

        // An untouched file input still submits an empty File, which would be
        // sent as a zero-byte document.
        for (const name of ["registrationDoc", "vatDoc"]) {
            const file = form.get(name);
            if (file instanceof File && file.size > 0) payload.append(name, file);
        }

        if ([...payload.keys()].length === 0) {
            setError("Choose at least one document to upload.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE}/api/dealer-applications/${id}/resubmit/${token}`,
                { method: "POST", body: payload }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message ?? "That upload could not be saved.");
                setSubmitting(false);
                return;
            }

            setDone(true);
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="border border-navy bg-panel px-6 py-10 text-center">
                <p className="eyebrow mb-4">Received</p>

                <h2 className="display mb-4 text-[1.75rem]">Thank you</h2>

                <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-soft">
                    Your documents are with our team and your application is back in the
                    review queue. We&apos;ll email you as soon as there is a decision.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="grid gap-6">
            <div className="border-l-2 border-accent bg-panel px-5 py-4">
                <p className="mb-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                    What we need
                </p>

                <p className="whitespace-pre-line text-[0.9375rem] leading-7 text-ink">
                    {application.holdRequirements}
                </p>
            </div>

            <FormField
                label="Business registration"
                name="registrationDoc"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hint={
                    application.hasRegistration
                        ? "We already have one — upload only if you are replacing it."
                        : "PDF or a clear photo."
                }
            />

            <FormField
                label="VAT / PAN document"
                name="vatDoc"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hint={
                    application.hasVat
                        ? "We already have one — upload only if you are replacing it."
                        : "PDF or a clear photo."
                }
            />

            {error ? (
                <p
                    role="alert"
                    className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                >
                    {error}
                </p>
            ) : null}

            <div>
                <Button type="submit" disabled={submitting} size="lg">
                    {submitting ? "Uploading…" : "Send the documents"}
                </Button>
            </div>

            <p className="text-[0.8125rem] leading-6 text-ink-faint">
                Uploading replaces what we hold and puts your application straight back
                into the review queue. This link works once.
            </p>
        </form>
    );
}
