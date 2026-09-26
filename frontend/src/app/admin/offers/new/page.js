import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import OfferForm from "@/components/admin/OfferForm";

export const metadata = { title: "New offer" };

export default function NewOfferPage() {
    return (
        <>
            <PageHeader eyebrow="Marketing" title="New offer">
                <Link
                    href="/admin/offers"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Back to offers
                </Link>
            </PageHeader>

            <OfferForm />
        </>
    );
}
