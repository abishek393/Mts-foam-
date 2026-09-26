import { getOffers } from "@/lib/api";
import { OFFER_AUDIENCES } from "@/lib/site";
import SectionHeading from "@/components/SectionHeading";
import OfferCard from "@/components/OfferCard";
import CTASection from "@/components/CTASection";

export const metadata = {
    title: "Offers & schemes",
    description:
        "Current 4STAR consumer offers, dealer volume schemes and trade pricing.",
};

export default async function OffersPage() {
    const offers = await getOffers();

    // Consumer offers first, then the trade-facing schemes.
    const consumer = offers.filter((offer) => offer.audience === "consumer");
    const trade = offers.filter((offer) => offer.audience !== "consumer");

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Offers" title="Offers & schemes">
                <p>
                    Consumer offers and dealer schemes, each with its validity, eligible
                    products and terms. Every scheme below is placeholder content pending
                    4STAR&apos;s own data.
                </p>
            </SectionHeading>

            {consumer.length ? (
                <section className="mt-14">
                    <h2 className="display mb-8 text-[1.75rem]">
                        {OFFER_AUDIENCES.consumer} offers
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {consumer.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                </section>
            ) : null}

            {trade.length ? (
                <section className="mt-16">
                    <h2 className="display mb-8 text-[1.75rem]">Dealer & trade schemes</h2>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {trade.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                </section>
            ) : null}

            {offers.length === 0 ? (
                <div className="mt-14 border border-rule bg-panel px-6 py-16 text-center">
                    <p className="text-[1.0625rem] text-ink">No schemes are running</p>

                    <p className="mt-2 text-[0.9375rem] text-ink-muted">
                        Check back, or send us an inquiry about your requirement.
                    </p>
                </div>
            ) : null}

            <CTASection
                className="mt-20"
                eyebrow="Dealer partnership"
                title="Schemes are strongest through a dealership"
                body="Appointed dealers get scheme-backed pricing, display support and planned supply. Apply with your business registration and VAT documents."
                primary={{ href: "/dealers", label: "Become a Dealer" }}
                secondary={{ href: "/dealers#find-a-dealer", label: "Find a Dealer" }}
            />
        </div>
    );
}
