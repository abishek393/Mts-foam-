import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOffer } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import OfferForm from "@/components/admin/OfferForm";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const offer = await getAdminOffer(id);

    return { title: offer ? `Edit ${offer.title}` : "Offer" };
}

export default async function EditOfferPage({ params }) {
    const { id } = await params;
    const offer = await getAdminOffer(id);

    if (!offer) notFound();

    return (
        <>
            <PageHeader eyebrow="Marketing" title={offer.title}>
                <Link
                    href="/admin/offers"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Back to offers
                </Link>
            </PageHeader>

            <OfferForm offer={offer} />
        </>
    );
}
