"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";
import { productImage } from "@/lib/api";
import InquiryButton from "./InquiryButton";
import FavouriteButton from "./FavouriteButton";

// Specification picker on the product page: choose a size and thickness, set a
// quantity, then add the line to the cart. No price is shown or stored — the
// cart is a specified request that 4STAR quotes against.
export default function ProductPurchasePanel({ product }) {
    const sizes = product.sizes ?? [];
    const thicknesses = product.thicknesses ?? [];

    const [sizeLabel, setSizeLabel] = useState(sizes[0] ?? "");
    const [thickness, setThickness] = useState(thicknesses[0] ?? "");
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    // Thicknesses are display strings like "6 in" — keep the number for the
    // order line, and the original string for what the customer saw.
    const thicknessIn = Number.parseFloat(thickness) || null;

    function handleAdd() {
        addToCart({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            image: productImage(product),
            sizeLabel: sizeLabel || null,
            thicknessIn,
            thicknessLabel: thickness || null,
            quantity,
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 3500);
    }

    return (
        <div className="mb-10 border border-rule bg-panel p-6">
            <div className="grid gap-4 sm:grid-cols-3">
                {sizes.length ? (
                    <label className="block">
                        <span className="table-head mb-2 block">Size</span>

                        <select
                            value={sizeLabel}
                            onChange={(event) => setSizeLabel(event.target.value)}
                            className="w-full border border-rule bg-surface px-3 py-2.5 text-[0.9375rem] text-ink"
                        >
                            {sizes.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}

                {thicknesses.length ? (
                    <label className="block">
                        <span className="table-head mb-2 block">Thickness</span>

                        <select
                            value={thickness}
                            onChange={(event) => setThickness(event.target.value)}
                            className="w-full border border-rule bg-surface px-3 py-2.5 text-[0.9375rem] text-ink"
                        >
                            {thicknesses.map((entry) => (
                                <option key={entry} value={entry}>
                                    {entry}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}

                <label className="block">
                    <span className="table-head mb-2 block">Quantity</span>

                    <input
                        type="number"
                        min="1"
                        max="999"
                        value={quantity}
                        onChange={(event) =>
                            setQuantity(
                                Math.max(1, Math.min(999, Number.parseInt(event.target.value, 10) || 1))
                            )
                        }
                        className="w-full border border-rule bg-surface px-3 py-2.5 text-[0.9375rem] text-ink"
                    />
                </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center border border-navy bg-navy px-8 py-3.5 text-[0.9375rem] font-medium tracking-wide text-white transition-colors hover:bg-navy-dark"
                >
                    Add to Cart
                </button>

                <FavouriteButton
                    productId={product.id}
                    productName={product.name}
                    variant="labelled"
                />

                <InquiryButton
                    productId={product.id}
                    productName={product.name}
                    sizeLabel={sizeLabel || undefined}
                    thicknessIn={thicknessIn ?? undefined}
                    quantity={quantity}
                    source="product"
                    variant="secondary"
                    size="lg"
                />
            </div>

            {added ? (
                <p
                    role="status"
                    className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-5 text-[0.875rem] text-ink-soft"
                >
                    Added to your cart.
                    <Link
                        href="/cart"
                        className="text-navy underline underline-offset-4 hover:text-brand-red"
                    >
                        View cart
                    </Link>
                    <Link
                        href="/checkout"
                        className="text-navy underline underline-offset-4 hover:text-brand-red"
                    >
                        Checkout
                    </Link>
                </p>
            ) : (
                <p className="mt-5 border-t border-rule pt-5 text-[0.8125rem] text-ink-faint">
                    No prices and no payment — checkout sends us a specified order
                    request and we reply with a quote.
                </p>
            )}
        </div>
    );
}
