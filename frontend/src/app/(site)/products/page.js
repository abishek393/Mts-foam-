import { Suspense } from "react";
import { getProducts } from "@/lib/api";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import ProductFilter from "@/components/ProductFilter";
import CompareBar from "@/components/CompareBar";

export const metadata = {
    title: "Products",
    description:
        "The full 4STAR catalogue — seven mattress lines and six PU foam grades, filterable by group, category and search.",
};

export default async function ProductsPage({ searchParams }) {
    // params and searchParams are Promises in this version of Next.
    const { group, category, search } = await searchParams;

    const products = await getProducts({ group, category, search });

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Catalogue" title="Products">
                <p>
                    Thirteen lines across mattresses and polyurethane foam. Every
                    specification below is placeholder content pending 4STAR&apos;s own
                    data. No prices are shown — send an inquiry and we quote against
                    your requirement.
                </p>
            </SectionHeading>

            <div className="mt-10">
                {/* useSearchParams needs a Suspense boundary during prerender. */}
                <Suspense fallback={<div className="h-[104px] border-y border-rule" />}>
                    <ProductFilter />
                </Suspense>
            </div>

            <p className="mt-6 text-[0.875rem] text-ink-muted">
                {products.length} {products.length === 1 ? "product" : "products"}
                {group ? ` in ${group === "mattress" ? "mattresses" : "PU foam"}` : ""}
                {category ? ` · ${category}` : ""}
                {search ? ` · matching “${search}”` : ""}
            </p>

            {products.length === 0 ? (
                <div className="mt-10 border border-rule bg-panel px-6 py-16 text-center">
                    <p className="display mb-3 text-[1.5rem]">Nothing matches</p>

                    <p className="text-[0.9375rem] text-ink-muted">
                        Try clearing the filters, or search for a different term.
                    </p>
                </div>
            ) : (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            delay={Math.min(index, 7) * 60}
                        />
                    ))}
                </div>
            )}

            <CompareBar />
        </div>
    );
}
