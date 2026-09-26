"use client";

import { useActionState, useState } from "react";
import { reviewOrderPayment } from "@/app/admin/actions";
import { Field, FormMessage, SubmitButton } from "./form-bits";
import { StatusPill, formatDateTime, fullName } from "./ui";

// Confirming a payment screenshot against the bank.
//
// No amount appears anywhere — the site stores no prices. The customer paid
// whatever was quoted; this is the record that someone checked it.

const LABELS = {
    unpaid: "Not paid",
    awaiting_verification: "Awaiting check",
    verified: "Verified",
    rejected: "Refused",
};

const TONES = {
    unpaid: "inactive",
    awaiting_verification: "new",
    verified: "active",
    rejected: "cancelled",
};

export default function PaymentReview({ order }) {
    const [state, formAction] = useActionState(reviewOrderPayment, null);
    const [refusing, setRefusing] = useState(false);

    const status = order.paymentStatus ?? "unpaid";
    const hasProof = Boolean(order.paymentProofUploadedAt);

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={TONES[status]} label={LABELS[status] ?? status} />

                {order.paymentReference ? (
                    <span className="font-mono text-[0.8125rem] text-ink-muted">
                        {order.paymentReference}
                    </span>
                ) : null}
            </div>

            {!hasProof ? (
                <p className="text-[0.875rem] leading-6 text-ink-faint">
                    The customer has not sent a payment screenshot yet.
                </p>
            ) : (
                <>
                    <p className="text-[0.8125rem] text-ink-faint">
                        Sent {formatDateTime(order.paymentProofUploadedAt)}
                    </p>

                    {/* Opens in a tab rather than inline: it is a bank
                        statement, and it should not sit on screen behind
                        whoever walks past the desk. */}
                    <a
                        href={`/api/payment-proof/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block w-fit border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-navy transition-colors hover:border-navy hover:bg-panel"
                    >
                        Open the screenshot
                    </a>
                </>
            )}

            {order.paymentVerifiedAt ? (
                <p className="text-[0.8125rem] text-ink-faint">
                    {status === "verified" ? "Verified" : "Reviewed"} by{" "}
                    {fullName(order.paymentVerifier)} ·{" "}
                    {formatDateTime(order.paymentVerifiedAt)}
                </p>
            ) : null}

            {order.paymentNote ? (
                <p className="border-l-2 border-brand-red pl-3 text-[0.8125rem] leading-6 text-brand-red">
                    Refused: {order.paymentNote}
                </p>
            ) : null}

            <FormMessage state={state} />

            {hasProof && status !== "verified" ? (
                <form action={formAction} className="grid gap-3">
                    <input type="hidden" name="id" value={order.id} />

                    {refusing ? (
                        <>
                            <input type="hidden" name="paymentStatus" value="rejected" />

                            <Field
                                label="Why it was refused"
                                name="paymentNote"
                                required
                                placeholder="Amount does not match, screenshot unreadable…"
                                hint="The customer is shown this, so they know what to send instead."
                            />

                            <div className="flex flex-wrap gap-2">
                                <SubmitButton size="sm" variant="danger" pendingLabel="Refusing…">
                                    Refuse payment
                                </SubmitButton>

                                <button
                                    type="button"
                                    onClick={() => setRefusing(false)}
                                    className="border border-rule-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <input type="hidden" name="paymentStatus" value="verified" />

                            <SubmitButton size="sm" pendingLabel="Verifying…">
                                Mark as verified
                            </SubmitButton>

                            <button
                                type="button"
                                onClick={() => setRefusing(true)}
                                className="border border-brand-red px-3 py-1.5 text-[0.8125rem] text-brand-red transition-colors hover:bg-brand-red hover:text-white"
                            >
                                Refuse
                            </button>
                        </div>
                    )}
                </form>
            ) : null}

            {status === "verified" ? (
                <p className="text-[0.8125rem] leading-6 text-ink-faint">
                    Verified payments are locked — the customer cannot replace the
                    screenshot.
                </p>
            ) : null}
        </div>
    );
}
