import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const product = await getAdminProduct(id);

    return { title: product ? `Edit ${product.name}` : "Product" };
}

export default async function EditProductPage({ params }) {
    const { id } = await params;
    const product = await getAdminProduct(id);

    if (!product) notFound();

    return (
        <>
            <PageHeader eyebrow="Catalogue" title={product.name}>
                {product.isActive ? (
                    <Link
                        href={`/products/${product.slug}`}
                        className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                    >
                        View on the site
                    </Link>
                ) : null}

                <Link
                    href="/admin/products"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Back to products
                </Link>
            </PageHeader>

            <ProductForm product={product} />
        </>
    );
}
