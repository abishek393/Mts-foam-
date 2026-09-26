"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Stars from "./Stars";
import StarPicker from "./StarPicker";
import FormField from "./FormField";
import Button from "./Button";
import { API_BASE } from "@/lib/session-config";

// The customer's own reviews, and the products they are entitled to review.
// Eligibility is decided by the API — this only renders what it was given, and
// every write is re-checked there.

const imageSrc = (images) => {
    const image = images?.[0];
    if (!image) return "/images/products/placeholder.svg";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads")) return `${API_BASE}${image}`;
    return image;
};

function ProductThumb({ images, name }) {
    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={imageSrc(images)}
            alt=""
            className="h-16 w-16 shrink-0 border border-rule object-cover"
        />
    );
}

function ReviewForm({ productId, initial, onDone, onCancel }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    async function submit(event) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const rating = form.get("rating");

        if (!rating) {
            setError("Choose a star rating.");
            return;
        }

        setSubmitting(true);
        setError(null);

        const editing = Boolean(initial?.id);

        const res = await fetch(
            editing ? `/api/proxy/api/reviews/${initial.id}` : "/api/proxy/api/reviews",
            {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(editing ? {} : { productId }),
                    rating: Number(rating),
                    title: form.get("title"),
                    body: form.get("body"),
                }),
            }
        ).catch(() => null);

        if (!res) {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
            return;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setError(data.message ?? "That could not be saved.");
            setSubmitting(false);
            return;
        }

        onDone();
    }

    return (
        <form onSubmit={submit} className="mt-5 grid gap-4 border-t border-rule pt-5">
            <StarPicker defaultValue={initial?.rating ?? 0} />

            <FormField
                label="Headline"
                name="title"
                maxLength={120}
                defaultValue={initial?.title ?? ""}
                placeholder="Sums up your experience"
            />

            <FormField
                label="Your review"
                name="body"
                rows={4}
                defaultValue={initial?.body ?? ""}
                placeholder="How does it sleep? How was delivery? Anything you'd tell a friend."
            />

            {error ? (
                <p
                    role="alert"
                    className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                >
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : initial?.id ? "Save changes" : "Post review"}
                </Button>

                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default function ReviewManager({ reviewable, reviews }) {
    const router = useRouter();

    // Which card has its form open: "new:<productId>" or "edit:<reviewId>".
    const [open, setOpen] = useState(null);

    const done = () => {
        setOpen(null);
        // Re-renders the server component so the lists move in step.
        router.refresh();
    };

    async function remove(review) {
        if (!window.confirm(`Delete your review of ${review.product?.name}?`)) return;

        await fetch(`/api/proxy/api/reviews/${review.id}`, { method: "DELETE" });
        router.refresh();
    }

    return (
        <>
            <section className="mt-14">
                <h2 className="display mb-2 text-[1.75rem]">
                    Ready to review{" "}
                    <span className="text-ink-faint">({reviewable.length})</span>
                </h2>

                <p className="mb-6 max-w-2xl text-[0.9375rem] leading-7 text-ink-muted">
                    These are the products from your completed orders. Only customers who
                    have received a product can review it.
                </p>

                {reviewable.length === 0 ? (
                    <div className="border border-rule bg-panel px-6 py-12 text-center">
                        <p className="mb-2 text-[1.0625rem] text-ink">
                            Nothing to review just yet.
                        </p>

                        <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                            Once an order of yours is marked completed, the products on it
                            appear here for you to review.
                        </p>
                    </div>
                ) : (
                    <ul className="border-t border-rule">
                        {reviewable.map((item) => {
                            const editing = open === `new:${item.productId}`;

                            return (
                                <li key={item.productId} className="border-b border-rule py-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <ProductThumb images={item.images} name={item.name} />

                                            <div>
                                                <Link
                                                    href={`/products/${item.slug}`}
                                                    className="display text-[1.25rem] transition-colors hover:text-navy"
                                                >
                                                    {item.name}
                                                </Link>

                                                <p className="text-[0.8125rem] text-ink-faint">
                                                    Order {item.orderNumber}
                                                </p>
                                            </div>
                                        </div>

                                        {!editing ? (
                                            <Button
                                                size="sm"
                                                onClick={() => setOpen(`new:${item.productId}`)}
                                            >
                                                Write a review
                                            </Button>
                                        ) : null}
                                    </div>

                                    {editing ? (
                                        <ReviewForm
                                            productId={item.productId}
                                            onDone={done}
                                            onCancel={() => setOpen(null)}
                                        />
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="mt-14">
                <h2 className="display mb-6 text-[1.75rem]">
                    Your reviews <span className="text-ink-faint">({reviews.length})</span>
                </h2>

                {reviews.length === 0 ? (
                    <div className="border border-rule bg-panel px-6 py-12 text-center">
                        <p className="text-[0.9375rem] leading-7 text-ink-muted">
                            You haven&apos;t written any reviews yet.
                        </p>
                    </div>
                ) : (
                    <ul className="border-t border-rule">
                        {reviews.map((review) => {
                            const editing = open === `edit:${review.id}`;

                            return (
                                <li key={review.id} className="border-b border-rule py-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <ProductThumb
                                                images={review.product?.images}
                                                name={review.product?.name}
                                            />

                                            <div>
                                                <Link
                                                    href={`/products/${review.product?.slug}`}
                                                    className="display text-[1.25rem] transition-colors hover:text-navy"
                                                >
                                                    {review.product?.name}
                                                </Link>

                                                <div className="mt-1">
                                                    <Stars rating={review.rating} size={15} />
                                                </div>

                                                {review.title ? (
                                                    <p className="mt-2 text-[0.9375rem] text-ink">
                                                        {review.title}
                                                    </p>
                                                ) : null}

                                                {review.body ? (
                                                    <p className="mt-1 max-w-2xl text-[0.9375rem] leading-7 text-ink-soft">
                                                        {review.body}
                                                    </p>
                                                ) : null}

                                                {/* An author must be told their review was
                                                    taken down, or they will assume it is live. */}
                                                {!review.isVisible ? (
                                                    <p className="mt-3 border-l-2 border-brand-red pl-3 text-[0.8125rem] leading-6 text-brand-red">
                                                        This review is hidden from the site
                                                        {review.hiddenReason
                                                            ? `: ${review.hiddenReason}`
                                                            : "."}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        {!editing ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setOpen(`edit:${review.id}`)}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => remove(review)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>

                                    {editing ? (
                                        <ReviewForm
                                            productId={review.productId}
                                            initial={review}
                                            onDone={done}
                                            onCancel={() => setOpen(null)}
                                        />
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </>
    );
}
