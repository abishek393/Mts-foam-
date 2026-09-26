import Image from "next/image";
import Link from "next/link";
import Stars from "./Stars";
import Reveal from "./Reveal";
import { productImage } from "@/lib/api";
import InquiryButton from "./InquiryButton";
import CompareToggle from "./CompareToggle";
import AddToCartButton from "./AddToCartButton";
import FavouriteButton from "./FavouriteButton";

// Catalogue card: image, category, name, short description, key specification,
// then View Details and Send Inquiry. No prices appear anywhere on the site.
export default function ProductCard({ product, delay = 0 }) {
    return (
        <Reveal
            as="article"
            delay={delay}
            className="group flex flex-col border border-rule bg-surface transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-rule-strong hover:shadow-[0_10px_30px_-18px_rgba(26,26,26,0.45)]"
        >
            <div className="relative">
                <Link
                    href={`/products/${product.slug}`}
                    className="relative block aspect-4/3 overflow-hidden bg-panel"
                >
                    <Image
                        src={productImage(product)}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                </Link>

                <FavouriteButton
                    productId={product.id}
                    productName={product.name}
                    className="absolute right-3 top-3"
                />
            </div>

            <div className="flex flex-1 flex-col p-5">
                <p className="table-head mb-2">{product.category}</p>

                <h3 className="display mb-2 text-[1.375rem]">
                    <Link
                        href={`/products/${product.slug}`}
                        className="transition-colors hover:text-navy"
                    >
                        {product.name}
                    </Link>
                </h3>

                {/* Only shown once a product has been reviewed — an empty row
                    of grey stars reads as a bad rating, not as no rating. */}
                {product.ratingCount > 0 ? (
                    <div className="mb-3">
                        <Stars
                            rating={product.ratingAverage}
                            count={product.ratingCount}
                            size={14}
                            showValue
                        />
                    </div>
                ) : null}

                <p className="mb-4 text-[0.875rem] leading-6 text-ink-muted">
                    {product.shortDescription}
                </p>

                {product.keySpec ? (
                    <p className="mb-5 border-t border-rule pt-3 text-[0.8125rem] text-ink-soft">
                        {product.keySpec}
                    </p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-2">
                    <Link
                        href={`/products/${product.slug}`}
                        className="border border-rule-strong px-4 py-2 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                    >
                        View Details
                    </Link>

                    <AddToCartButton product={product} size="sm" />

                    <InquiryButton
                        productId={product.id}
                        productName={product.name}
                        source="product"
                        variant="secondary"
                        size="sm"
                    />
                </div>

                <CompareToggle slug={product.slug} name={product.name} />
            </div>
        </Reveal>
    );
}
