import Link from "next/link";
import { getAdminOffers } from "@/lib/admin";
import { deleteOffer } from "@/app/admin/actions";
import { OFFER_AUDIENCES } from "@/lib/site";
import {
    PageHeader,
    Panel,
    EmptyState,
    FilterTabs,
    StatusPill,
    TableWrap,
    Th,
    Td,
} from "@/components/admin/ui";
import RowDelete from "@/components/admin/RowDelete";

export const metadata = { title: "Offers" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "active", label: "Running" },
    { value: "inactive", label: "Ended" },
];

export default async function AdminOffersPage({ searchParams }) {
    const params = await searchParams;
    const status = typeof params?.status === "string" ? params.status : "";

    const offers = await getAdminOffers({ status });

    return (
        <>
            <PageHeader eyebrow="Marketing" title="Offers & schemes" count={offers.length}>
                <Link
                    href="/admin/offers/new"
                    className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                >
                    New offer
                </Link>
            </PageHeader>

            <FilterTabs basePath="/admin/offers" current={status} options={FILTERS} />

            <Panel>
                {offers.length === 0 ? (
                    <EmptyState
                        title={status ? "Nothing matches that." : "No offers yet."}
                        body={
                            status
                                ? "Clear the filter to see every offer."
                                : "Consumer promotions and dealer schemes both live here."
                        }
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Offer</Th>
                                <Th>Audience</Th>
                                <Th>Validity</Th>
                                <Th>Eligible</Th>
                                <Th>Order</Th>
                                <Th>Status</Th>
                                <Th className="text-right">Actions</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {offers.map((offer) => (
                                <tr key={offer.id}>
                                    <Td>
                                        <Link
                                            href={`/admin/offers/${offer.id}`}
                                            className="text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-navy"
                                        >
                                            {offer.title}
                                        </Link>
                                    </Td>

                                    <Td className="text-ink-muted">
                                        {OFFER_AUDIENCES[offer.audience] ?? offer.audience}
                                    </Td>

                                    <Td className="text-ink-muted">
                                        {offer.validityLabel || "—"}
                                    </Td>

                                    <Td className="text-ink-muted">
                                        {offer.eligibleProducts?.length
                                            ? offer.eligibleProducts.join(", ")
                                            : "All products"}
                                    </Td>

                                    <Td className="text-ink-muted">{offer.sortOrder}</Td>

                                    <Td>
                                        <StatusPill
                                            status={offer.isActive ? "active" : "inactive"}
                                            label={offer.isActive ? "Running" : "Ended"}
                                        />
                                    </Td>

                                    <Td className="text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Link
                                                href={`/admin/offers/${offer.id}`}
                                                className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                            >
                                                Edit
                                            </Link>

                                            <RowDelete
                                                action={deleteOffer}
                                                id={offer.id}
                                                confirm={`Delete "${offer.title}" permanently? Ending it instead keeps the record.`}
                                            />
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </Panel>
        </>
    );
}
