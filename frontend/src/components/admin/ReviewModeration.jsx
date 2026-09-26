"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { setReviewVisibility, deleteReviewAsAdmin } from "@/app/admin/actions";
import Stars from "@/components/Stars";
import { Field, FormMessage, SubmitButton, ConfirmSubmit } from "./form-bits";
import { StatusPill, formatDateTime, fullName } from "./ui";

// Hiding a review keeps it — the author still sees it on their own page, marked
// as hidden, and it can be restored. Deleting is permanent and is the last
// resort, which is why it asks first.
function HideForm({ review }) {
    const [state, formAction] = useActionState(setReviewVisibility, null);
    const [open, setOpen] = useState(false);

    if (review.isVisible && !open) {
        return (
            <div className="flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                >
                    Hide
                </button>

                <DeleteForm review={review} />
            </div>
        );
    }

    if (!review.isVisible) {
        return (
            <form action={formAction} className="flex flex-wrap justify-end gap-2">
                <input type="hidden" name="id" value={review.id} />
                <input type="hidden" name="isVisible" value="true" />

                <SubmitButton size="sm" variant="secondary" pendingLabel="Restoring…">
                    Restore
                </SubmitButton>

                <DeleteForm review={review} />

                <FormMessage state={state} />
            </form>
        );
    }

    return (
        <form action={formAction} className="grid gap-3">
            <input type="hidden" name="id" value={review.id} />
            <input type="hidden" name="isVisible" value="false" />

            <Field
                label="Reason (shown to the author)"
                name="reason"
                placeholder="Off-topic, abusive, not about this product…"
            />

            <FormMessage state={state} />

            <div className="flex flex-wrap gap-2">
                <SubmitButton size="sm" pendingLabel="Hiding…">
                    Hide review
                </SubmitButton>

                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="border border-rule-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function DeleteForm({ review }) {
    const [state, formAction] = useActionState(deleteReviewAsAdmin, null);

    return (
        <form action={formAction} className="inline-block">
            <input type="hidden" name="id" value={review.id} />

            <ConfirmSubmit
                message={`Delete this review permanently? Hiding it instead keeps the record and can be undone.`}
                pendingLabel="Deleting…"
            >
                Delete
            </ConfirmSubmit>

            {state && !state.ok ? (
                <p className="mt-1 text-[0.75rem] text-brand-red">{state.message}</p>
            ) : null}
        </form>
    );
}

export default function ReviewModeration({ reviews }) {
    return (
        <div className="grid gap-3">
            {reviews.map((review) => (
                <article
                    key={review.id}
                    className={`border bg-surface px-5 py-4 ${
                        review.isVisible ? "border-rule" : "border-brand-red/40 bg-brand-red/[0.03]"
                    }`}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                <Stars rating={review.rating} size={15} showValue />

                                <StatusPill
                                    status={review.isVisible ? "active" : "inactive"}
                                    label={review.isVisible ? "Visible" : "Hidden"}
                                />

                                {review.product ? (
                                    <Link
                                        href={`/products/${review.product.slug}`}
                                        className="text-[0.875rem] text-navy underline underline-offset-4 hover:text-brand-red"
                                    >
                                        {review.product.name}
                                    </Link>
                                ) : (
                                    <span className="text-[0.875rem] text-ink-faint">
                                        Product deleted
                                    </span>
                                )}
                            </div>

                            {review.title ? (
                                <h2 className="mb-1 text-[1.0625rem] text-ink">{review.title}</h2>
                            ) : null}

                            {review.body ? (
                                <p className="mb-2 max-w-2xl whitespace-pre-line text-[0.9375rem] leading-7 text-ink-soft">
                                    {review.body}
                                </p>
                            ) : (
                                <p className="mb-2 text-[0.875rem] text-ink-faint">
                                    Rating only — no written review.
                                </p>
                            )}

                            <p className="text-[0.8125rem] text-ink-faint">
                                {fullName(review.author)} · {review.author?.email} ·{" "}
                                {formatDateTime(review.createdAt)}
                                {review.order ? (
                                    <>
                                        {" · order "}
                                        <span className="font-mono">{review.order.orderNumber}</span>
                                        {" ("}
                                        {review.order.status}
                                        {")"}
                                    </>
                                ) : null}
                            </p>

                            {!review.isVisible && review.hiddenReason ? (
                                <p className="mt-2 border-l-2 border-brand-red pl-3 text-[0.8125rem] leading-6 text-brand-red">
                                    Hidden: {review.hiddenReason}
                                </p>
                            ) : null}
                        </div>

                        <div className="shrink-0">
                            <HideForm review={review} />
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
