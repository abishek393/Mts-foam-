"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { productImage } from "@/lib/api";

// Adds a product to the cart, with whatever specification the caller has.
// The product detail page passes a chosen size and thickness; a catalogue card
// adds the line unspecified and it can be adjusted in the cart.
export default function AddToCartButton({
    product,
    sizeLabel,
    thicknessIn,
    quantity = 1,
    size = "md",
    variant = "primary",
    className = "",
    children = "Add to Cart",
}) {
    const [feedback, setFeedback] = useState(null);

    const SIZES = {
        sm: "px-4 py-2 text-[0.8125rem]",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-3.5 text-[0.9375rem]",
    };

    const VARIANTS = {
        primary: "bg-navy text-white border-navy hover:bg-navy-dark",
        secondary: "bg-transparent text-ink border-rule-strong hover:border-ink hover:bg-panel",
    };

    function handleAdd() {
        const result = addToCart({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            image: productImage(product),
            sizeLabel: sizeLabel ?? null,
            thicknessIn: thicknessIn ?? null,
            quantity,
        });

        setFeedback(
            result.full
                ? "Cart is full"
                : result.merged
                    ? "Quantity updated"
                    : "Added to cart"
        );

        setTimeout(() => setFeedback(null), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleAdd}
            aria-live="polite"
            className={`inline-flex items-center justify-center gap-2 border font-medium tracking-wide transition-colors ${
                VARIANTS[variant] ?? VARIANTS.primary
            } ${SIZES[size] ?? SIZES.md} ${className}`}
        >
            {feedback ?? children}
        </button>
    );
}
