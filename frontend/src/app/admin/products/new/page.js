import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default function NewProductPage() {
    return (
        <>
            <PageHeader eyebrow="Catalogue" title="New product">
                <Link
                    href="/admin/products"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Back to products
                </Link>
            </PageHeader>

            <ProductForm />
        </>
    );
}
