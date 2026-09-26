import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/api";
import { getProductReviews } from "@/lib/reviews";
import { getSession } from "@/lib/auth";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import CompareToggle from "@/components/CompareToggle";
import CompareBar from "@/components/CompareBar";
import ProductReviews from "@/components/ProductReviews";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) return { title: "Product not found" };

    return {
        title: product.name,
        description: product.shortDescription ?? product.description,
    };
}

export default async function ProductDetailPage({ params }) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) notFound();

    // Related lines from the same group, excluding this one, plus the reviews
    // and who is looking — fetched together rather than in sequence.
    const [relatedAll, reviewData, viewer] = await Promise.all([
        getProducts({ group: product.group }),
        getProductReviews(slug),
        getSession(),
    ]);

    const related = relatedAll
        .filter((entry) => entry.slug !== product.slug)
        .slice(0, 4);

    // Only show rows that actually have a value — foam has no firmness, and
    // mattresses have no density.
    const specs = [
        ["Features", product.features?.join(" · ")],
        ["Guarantee", product.warrantyYears ? product.warrantyYears + (product.warrantyYears === 1 ? " year" : " years") : null],
        ["Firmness", product.firmness],
        ["Density", product.density],
        ["Thickness", product.thicknesses?.join(", ")],
        ["Sizes", product.sizes?.join(" · ")],
        ["Core", product.coreSpec],
        ["Lead time", product.leadTime],
    ].filter(([, value]) => Boolean(value));

    return (
        <div className="shell py-10 sm:py-14">
            <nav aria-label="Breadcrumb" className="mb-8 text-[0.8125rem] text-ink-muted">
                <Link href="/products" className="transition-colors hover:text-navy">
                    Products
                </Link>

                <span className="mx-2 text-ink-faint">/</span>

                <Link
                    href={`/products?group=${product.group}`}
                    className="transition-colors hover:text-navy"
                >
                    {product.group === "mattress" ? "Mattresses" : "PU Foam"}
                </Link>

                <span className="mx-2 text-ink-faint">/</span>

                <span className="text-ink">{product.name}</span>
            </nav>

            <p className="eyebrow mb-4">Product detail</p>

            <h1 className="display mb-10 text-[2.25rem] sm:text-[3rem]">
                {product.name}
            </h1>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
                <ProductGallery product={product} />

                <div>
                    <p className="mb-8 text-[1.0625rem] leading-8 text-ink-soft">
                        {product.description}
                    </p>

                    {/* Calls to action above the fold, per the design document. */}
                    <ProductPurchasePanel product={product} />

                    <div className="mb-10">
                        <Link
                            href="/compare"
                            className="inline-flex items-center border border-rule-strong px-8 py-3.5 text-[0.9375rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                        >
                            Compare Product
                        </Link>
                    </div>

                    <table className="w-full border-collapse">
                        <tbody>
                            {specs.map(([label, value]) => (
                                <tr key={label} className="border-b border-rule">
                                    <th
                                        scope="row"
                                        className="table-head w-40 py-3.5 pr-4 text-left align-top font-normal"
                                    >
                                        {label}
                                    </th>

                                    <td className="py-3.5 text-[0.9375rem] text-ink">
                                        {value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <CompareToggle slug={product.slug} name={product.name} className="mt-5" />

                    {product.features?.length ? (
                        <section className="mt-12">
                            <h2 className="display mb-5 text-[1.5rem]">Features</h2>

                            <ul className="space-y-3">
                                {product.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex gap-3 text-[0.9375rem] leading-7 text-ink-soft"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="mt-2.5 h-px w-4 shrink-0 bg-accent"
                                        />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {product.applications?.length ? (
                        <section className="mt-10">
                            <h2 className="display mb-5 text-[1.5rem]">Applications</h2>

                            <div className="flex flex-wrap gap-2">
                                {product.applications.map((application) => (
                                    <span
                                        key={application}
                                        className="border border-rule bg-panel px-3.5 py-1.5 text-[0.8125rem] text-ink-soft"
                                    >
                                        {application}
                                    </span>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>

            <ProductReviews
                product={reviewData.product ?? product}
                reviews={reviewData.reviews}
                breakdown={reviewData.breakdown}
                signedIn={Boolean(viewer)}
            />

            {related.length ? (
                <section className="mt-20 border-t border-rule pt-14">
                    <h2 className="display mb-8 text-[1.75rem]">
                        More {product.group === "mattress" ? "mattresses" : "foam grades"}
                    </h2>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {related.map((entry, index) => (
                            <ProductCard
                                key={entry.id}
                                product={entry}
                                delay={Math.min(index, 7) * 60}
                            />
                        ))}
                    </div>
                </section>
            ) : null}

            <CompareBar />
        </div>
    );
}
