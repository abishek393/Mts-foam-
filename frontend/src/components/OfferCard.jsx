import { OFFER_AUDIENCES } from "@/lib/site";
import InquiryButton from "./InquiryButton";

export default function OfferCard({ offer }) {
    return (
        <article className="flex flex-col border border-rule bg-surface">
            {/* The banner is a typographic panel until real artwork arrives. */}
            <div className="flex items-end justify-between gap-4 border-b border-rule bg-panel px-6 py-5">
                <span className="eyebrow">
                    {OFFER_AUDIENCES[offer.audience] ?? offer.audience}
                </span>

                <span className="text-[0.8125rem] text-ink-muted">
                    {offer.validityLabel}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
                <h3 className="display mb-3 text-[1.5rem]">{offer.title}</h3>

                <p className="mb-6 text-[0.9375rem] leading-7 text-ink-soft">
                    {offer.description}
                </p>

                {offer.eligibleProducts?.length ? (
                    <div className="mb-6">
                        <p className="table-head mb-2.5">Eligible products</p>

                        <div className="flex flex-wrap gap-2">
                            {offer.eligibleProducts.map((product) => (
                                <span
                                    key={product}
                                    className="border border-rule bg-panel px-3 py-1.5 text-[0.8125rem] text-ink-soft"
                                >
                                    {product}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                {offer.terms ? (
                    <p className="mb-6 border-t border-rule pt-4 text-[0.8125rem] leading-6 text-ink-faint">
                        {offer.terms}
                    </p>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-2">
                    {offer.documentUrl ? (
                        <a
                            href={offer.documentUrl}
                            className="border border-rule-strong px-4 py-2 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                        >
                            Download Scheme
                        </a>
                    ) : (
                        <span
                            className="cursor-not-allowed border border-rule px-4 py-2 text-[0.8125rem] text-ink-faint"
                            title="Scheme document pending"
                        >
                            Document pending
                        </span>
                    )}

                    <InquiryButton
                        source="offer"
                        message={`Inquiry about the scheme: ${offer.title}`}
                        size="sm"
                    >
                        Ask about this
                    </InquiryButton>
                </div>
            </div>
        </article>
    );
}
