import { Suspense } from "react";
import { getDealers } from "@/lib/api";
import { DEALER_TYPES } from "@/lib/site";
import SectionHeading from "@/components/SectionHeading";
import DealerForm from "@/components/DealerForm";
import DealerSearch from "@/components/DealerSearch";

export const metadata = {
    title: "Dealers",
    description:
        "Apply to become a 4STAR dealer, or find an authorised dealer or distributor near you.",
};

export default async function DealersPage({ searchParams }) {
    const { city, type, search } = await searchParams;

    const { dealers, cities } = await getDealers({ city, type, search });

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Dealer platform" title="Dealers & partnership">
                <p>
                    4STAR distributes through appointed dealers, with direct supply for
                    larger business orders. Apply below, or find a dealer near you.
                </p>
            </SectionHeading>

            <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
                <section>
                    <h2 className="display mb-3 text-[1.75rem]">Become a dealer</h2>

                    <p className="mb-8 max-w-lg text-[0.9375rem] leading-7 text-ink-soft">
                        Send us your business registration and VAT documents. Our team
                        verifies them and sets up your dealer account, scheme access and
                        first supply.
                    </p>

                    <DealerForm />
                </section>

                <aside className="border border-rule bg-panel p-8 lg:p-10">
                    <p className="eyebrow mb-6">What dealers get</p>

                    <ul className="space-y-5">
                        {[
                            ["Scheme-backed pricing", "Quarterly volume schemes and standing trade rates."],
                            ["Display support", "A sample set covering every mattress line."],
                            ["Planned supply", "Scheduled despatch against your own forecast."],
                            ["One point of contact", "The same team handles inquiry, quote and follow-up."],
                        ].map(([title, body]) => (
                            <li key={title} className="border-b border-rule pb-5 last:border-0 last:pb-0">
                                <p className="mb-1 text-[0.9375rem] text-ink">{title}</p>
                                <p className="text-[0.875rem] leading-6 text-ink-muted">{body}</p>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-8 text-[0.8125rem] leading-6 text-ink-faint">
                        Placeholder content pending 4STAR&apos;s own dealer terms.
                    </p>
                </aside>
            </div>

            <section className="mt-24 border-t border-rule pt-14">
                <h2 className="display mb-3 text-[1.75rem]">Find a dealer</h2>

                <p className="mb-8 max-w-lg text-[0.9375rem] leading-7 text-ink-soft">
                    Every dealer listed below is placeholder content pending
                    4STAR&apos;s own network data.
                </p>

                <Suspense fallback={<div className="h-20" />}>
                    <DealerSearch cities={cities} />
                </Suspense>

                {dealers.length === 0 ? (
                    <div className="mt-8 border border-rule bg-panel px-6 py-16 text-center">
                        <p className="text-[1.0625rem] text-ink">No dealers match</p>

                        <p className="mt-2 text-[0.9375rem] text-ink-muted">
                            Try a different city, or clear the filters.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full min-w-[36rem] border-collapse">
                            <thead>
                                <tr className="border-b border-rule-strong">
                                    <th scope="col" className="table-head py-3 pr-4 text-left">
                                        Dealer
                                    </th>
                                    <th scope="col" className="table-head py-3 pr-4 text-left">
                                        Location
                                    </th>
                                    <th scope="col" className="table-head py-3 pr-4 text-left">
                                        Type
                                    </th>
                                    <th scope="col" className="table-head py-3 text-left">
                                        Contact
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {dealers.map((dealer) => (
                                    <tr key={dealer.id} className="border-b border-rule">
                                        <td className="py-4 pr-4 text-[0.9375rem] text-ink">
                                            {dealer.businessName}
                                        </td>

                                        <td className="py-4 pr-4 text-[0.9375rem] text-ink-soft">
                                            {dealer.ward ? `${dealer.ward}, ` : ""}
                                            {dealer.city}
                                        </td>

                                        <td className="py-4 pr-4 text-[0.9375rem] text-ink-soft">
                                            {DEALER_TYPES[dealer.type] ?? dealer.type}
                                        </td>

                                        <td className="py-4 text-[0.9375rem]">
                                            {dealer.phone ? (
                                                <a
                                                    href={`tel:${dealer.phone.replace(/\s/g, "")}`}
                                                    className="text-navy transition-colors hover:text-brand-red"
                                                >
                                                    {dealer.phone}
                                                </a>
                                            ) : (
                                                <span className="text-ink-faint">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
