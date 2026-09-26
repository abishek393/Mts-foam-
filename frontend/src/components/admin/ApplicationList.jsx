"use client";

import { useActionState, useState } from "react";
import {
    verifyApplication,
    rejectApplication,
    holdApplication,
} from "@/app/admin/actions";
import { DEALER_TYPES } from "@/lib/site";
import { Field, FormMessage, SubmitButton } from "./form-bits";
import { StatusPill, formatDateTime, fullName } from "./ui";

const BUSINESS_TYPES = {
    retailer: "Retailer",
    wholesaler: "Wholesaler",
    distributor: "Distributor",
    other: "Other",
};

const TYPE_OPTIONS = Object.entries(DEALER_TYPES).map(([value, label]) => ({
    value,
    label,
}));

// Verifying creates the dealer's login and their directory entry in one
// transaction, so the directory fields are collected here rather than being
// filled in afterwards.
function VerifyForm({ application }) {
    const [state, formAction] = useActionState(verifyApplication, null);

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={application.id} />

            <div className="grid gap-4 sm:grid-cols-3">
                <Field
                    label="City"
                    name="city"
                    defaultValue={application.location ?? ""}
                    hint="Taken from the application."
                />

                <Field label="Ward" name="ward" placeholder="Ward 10" />

                <Field
                    label="Directory type"
                    name="type"
                    defaultValue={
                        application.businessType === "distributor"
                            ? "distributor"
                            : "authorised"
                    }
                    options={TYPE_OPTIONS}
                />
            </div>

            <Field label="Review note" name="reviewNote" rows={2} />

            <FormMessage state={state} />

            <div>
                <SubmitButton size="sm" pendingLabel="Verifying…">
                    Verify and create the dealer account
                </SubmitButton>
            </div>

            <p className="text-[0.8125rem] leading-6 text-ink-faint">
                This creates a dealer login and a directory entry, and emails the
                applicant to say so. A new login&apos;s one-time password is included in
                that email, and shown here as well in case it bounces.
            </p>
        </form>
    );
}

// Neither approved nor refused: the applicant is emailed a one-off link to
// replace a document, and the application comes back to pending when they do.
function HoldForm({ application }) {
    const [state, formAction] = useActionState(holdApplication, null);

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={application.id} />

            <Field
                label="What do they need to provide?"
                name="holdRequirements"
                rows={3}
                required
                hint="Quoted word for word in the email they receive."
                placeholder="The VAT certificate is missing. Please upload a clear copy."
            />

            <Field
                label="Internal note"
                name="reviewNote"
                rows={2}
                hint="Kept on the record. Not sent to the applicant."
            />

            <FormMessage state={state} />

            <div>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Putting on hold…">
                    Put on hold and email them
                </SubmitButton>
            </div>
        </form>
    );
}

function RejectForm({ application }) {
    const [state, formAction] = useActionState(rejectApplication, null);

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={application.id} />

            <Field
                label="Reason"
                name="reviewNote"
                rows={2}
                hint="Sent to the applicant in the rejection email, so write it for them."
            />

            <FormMessage state={state} />

            <div>
                <SubmitButton variant="danger" size="sm" pendingLabel="Rejecting…">
                    Reject application
                </SubmitButton>
            </div>
        </form>
    );
}

function DocumentLink({ id, type, label, present }) {
    if (!present) {
        return <span className="text-[0.8125rem] text-ink-faint">{label}: none</span>;
    }

    return (
        <a
            href={`/api/admin/document/${id}/${type}`}
            target="_blank"
            rel="noreferrer"
            className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-navy transition-colors hover:border-navy hover:bg-panel"
        >
            {label}
        </a>
    );
}

export default function ApplicationList({ applications }) {
    const [openId, setOpenId] = useState(null);

    return (
        <div className="grid gap-3">
            {applications.map((application) => {
                const isOpen = openId === application.id;
                // An application on hold is still open — it can be chased,
                // approved once the document arrives, or refused.
                const open = ["pending", "on_hold"].includes(application.status);

                return (
                    <article
                        key={application.id}
                        className="border border-rule bg-surface"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                            <div className="min-w-0">
                                <div className="mb-1.5 flex flex-wrap items-center gap-3">
                                    <h2 className="display text-[1.25rem]">
                                        {application.businessName}
                                    </h2>

                                    <StatusPill status={application.status} />
                                </div>

                                <p className="text-[0.875rem] text-ink-soft">
                                    {application.fullName} · {application.location} ·{" "}
                                    {BUSINESS_TYPES[application.businessType] ??
                                        application.businessType}
                                </p>

                                <p className="text-[0.8125rem] text-ink-faint">
                                    {application.email} · {application.contactNumber} ·
                                    applied {formatDateTime(application.createdAt)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenId(isOpen ? null : application.id)}
                                aria-expanded={isOpen}
                                className="shrink-0 border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                            >
                                {isOpen ? "Close" : open ? "Review" : "Details"}
                            </button>
                        </div>

                        {isOpen ? (
                            <div className="border-t border-rule bg-panel px-5 py-5">
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <div>
                                        <p className="eyebrow mb-3">The application</p>

                                        <p className="mb-4 text-[0.9375rem] leading-7 text-ink-soft">
                                            {application.requirements ||
                                                "No requirements were written."}
                                        </p>

                                        <p className="eyebrow mb-3">Documents</p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <DocumentLink
                                                id={application.id}
                                                type="registration"
                                                label="Business registration"
                                                present={Boolean(application.registrationDocPath)}
                                            />

                                            <DocumentLink
                                                id={application.id}
                                                type="vat"
                                                label="VAT document"
                                                present={Boolean(application.vatDocPath)}
                                            />
                                        </div>

                                        {application.holdRequirements ? (
                                            <p className="mt-6 border-l-2 border-accent pl-3 text-[0.875rem] leading-6 text-ink-soft">
                                                Waiting on the applicant:{" "}
                                                {application.holdRequirements}
                                            </p>
                                        ) : null}

                                        {!["pending", "on_hold"].includes(application.status) ? (
                                            <dl className="mt-6 space-y-1 text-[0.875rem]">
                                                <div className="flex gap-2">
                                                    <dt className="text-ink-muted">Reviewed by:</dt>
                                                    <dd className="text-ink-soft">
                                                        {fullName(application.reviewer)}
                                                    </dd>
                                                </div>

                                                <div className="flex gap-2">
                                                    <dt className="text-ink-muted">Reviewed:</dt>
                                                    <dd className="text-ink-soft">
                                                        {formatDateTime(application.reviewedAt)}
                                                    </dd>
                                                </div>

                                                {application.reviewNote ? (
                                                    <div className="flex gap-2">
                                                        <dt className="text-ink-muted">Note:</dt>
                                                        <dd className="text-ink-soft">
                                                            {application.reviewNote}
                                                        </dd>
                                                    </div>
                                                ) : null}
                                            </dl>
                                        ) : null}
                                    </div>

                                    <div>
                                        {open ? (
                                            <>
                                                <p className="eyebrow mb-3">Verify</p>
                                                <VerifyForm application={application} />

                                                <div className="mt-8 border-t border-rule pt-6">
                                                    <p className="eyebrow mb-3">
                                                        Or ask for another document
                                                    </p>
                                                    <HoldForm application={application} />
                                                </div>

                                                <div className="mt-8 border-t border-rule pt-6">
                                                    <p className="eyebrow mb-3">Or reject</p>
                                                    <RejectForm application={application} />
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-[0.9375rem] leading-7 text-ink-muted">
                                                This application has already been{" "}
                                                {application.status}. Dealer details can be
                                                changed in the dealer directory, and their
                                                login in Accounts.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}
