import Link from "next/link";
import Stars from "./Stars";

// The public review section on a product page. Server component — reading
// reviews needs no interaction, and writing happens on /reviews.

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

function Distribution({ breakdown, total }) {
    return (
        <ul className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown?.[star] ?? 0;
                const percent = total > 0 ? (count / total) * 100 : 0;

                return (
                    <li key={star} className="flex items-center gap-3 text-[0.8125rem]">
                        <span className="w-10 shrink-0 text-ink-muted">{star} star</span>

                        <span className="h-1.5 flex-1 bg-rule">
                            <span
                                className="block h-full bg-accent"
                                style={{ width: `${percent}%` }}
                            />
                        </span>

                        <span className="w-6 shrink-0 text-right text-ink-faint">{count}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default function ProductReviews({ product, reviews, breakdown, signedIn }) {
    const average = Number(product?.ratingAverage ?? 0);
    const total = product?.ratingCount ?? reviews.length;

    return (
        <section className="mt-16 border-t border-rule pt-14">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div>
                    <p className="eyebrow mb-3">Reviews</p>

                    <h2 className="display text-[1.75rem] sm:text-[2rem]">
                        What owners say
                    </h2>
                </div>

                {/* The claim that makes these reviews worth reading. */}
                <p className="max-w-sm text-[0.8125rem] leading-6 text-ink-faint">
                    Only customers whose order for this product has been completed can
                    review it, so every review below comes from someone who owns one.
                </p>
            </div>

            {total === 0 ? (
                <div className="border border-rule bg-panel px-6 py-14 text-center">
                    <p className="mb-2 text-[1.0625rem] text-ink">No reviews yet.</p>

                    <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                        {signedIn
                            ? "Once an order of yours for this product is completed, you'll be able to review it."
                            : "Reviews appear here once customers who have received this product write them."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-12 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16">
                    <div>
                        <p className="display text-[3rem] leading-none">
                            {average.toFixed(1)}
                        </p>

                        <div className="mt-3">
                            <Stars rating={average} size={20} />
                        </div>

                        <p className="mt-2 text-[0.875rem] text-ink-muted">
                            {total} {total === 1 ? "review" : "reviews"}
                        </p>

                        <div className="mt-6">
                            <Distribution breakdown={breakdown} total={total} />
                        </div>

                        <Link
                            href="/reviews"
                            className="mt-8 inline-block text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
                        >
                            Review a product you&apos;ve received
                        </Link>
                    </div>

                    <ul className="border-t border-rule">
                        {reviews.map((review) => (
                            <li key={review.id} className="border-b border-rule py-6">
                                <div className="mb-2 flex flex-wrap items-center gap-3">
                                    <Stars rating={review.rating} size={15} />

                                    <span className="border border-navy px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-navy">
                                        Verified purchase
                                    </span>
                                </div>

                                {review.title ? (
                                    <h3 className="mb-1.5 text-[1.0625rem] text-ink">
                                        {review.title}
                                    </h3>
                                ) : null}

                                {review.body ? (
                                    <p className="mb-3 max-w-2xl whitespace-pre-line text-[0.9375rem] leading-7 text-ink-soft">
                                        {review.body}
                                    </p>
                                ) : null}

                                <p className="text-[0.8125rem] text-ink-faint">
                                    {review.author} · {formatDate(review.createdAt)}
                                    {review.updatedAt &&
                                    new Date(review.updatedAt) - new Date(review.createdAt) > 1000
                                        ? " · edited"
                                        : ""}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
