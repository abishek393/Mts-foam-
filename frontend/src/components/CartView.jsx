"use client";

import Image from "next/image";
import Link from "next/link";
import {
    clearCart,
    countUnits,
    lineKey,
    removeFromCart,
    updateQuantity,
    useCart,
} from "@/lib/cart";
import Button from "./Button";

export default function CartView() {
    const items = useCart();
    const units = countUnits(items);

    if (items.length === 0) {
        return (
            <div className="mt-12 border border-rule bg-panel px-6 py-20 text-center">
                <p className="display mb-3 text-[1.75rem]">Your cart is empty</p>

                <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                    Add a mattress or a foam grade from the catalogue, choose a size and
                    quantity, and it will appear here.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                    <Button href="/products" size="lg">
                        Browse the catalogue
                    </Button>

                    <Button href="/find-mattress" variant="secondary" size="lg">
                        Find your mattress
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-[0.875rem] text-ink-muted">
                        {items.length} {items.length === 1 ? "line" : "lines"} · {units}{" "}
                        {units === 1 ? "unit" : "units"}
                    </p>

                    <button
                        type="button"
                        onClick={clearCart}
                        className="text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                    >
                        Empty cart
                    </button>
                </div>

                <ul className="border-t border-rule">
                    {items.map((line) => {
                        const key = lineKey(line);

                        return (
                            <li
                                key={key}
                                className="grid grid-cols-[88px_1fr] gap-5 border-b border-rule py-6 sm:grid-cols-[110px_1fr]"
                            >
                                <Link
                                    href={`/products/${line.slug}`}
                                    className="relative block aspect-4/3 overflow-hidden border border-rule bg-panel"
                                >
                                    <Image
                                        src={line.image ?? "/images/products/placeholder.svg"}
                                        alt={line.name}
                                        fill
                                        sizes="110px"
                                        className="object-cover"
                                    />
                                </Link>

                                <div>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="table-head mb-1.5">{line.category}</p>

                                            <h2 className="display text-[1.25rem]">
                                                <Link
                                                    href={`/products/${line.slug}`}
                                                    className="transition-colors hover:text-navy"
                                                >
                                                    {line.name}
                                                </Link>
                                            </h2>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(key)}
                                            aria-label={`Remove ${line.name} from cart`}
                                            className="text-[0.8125rem] text-ink-faint underline underline-offset-4 transition-colors hover:text-brand-red"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[0.875rem] text-ink-muted">
                                        {line.sizeLabel ? (
                                            <div className="flex gap-2">
                                                <dt>Size:</dt>
                                                <dd className="text-ink-soft">{line.sizeLabel}</dd>
                                            </div>
                                        ) : null}

                                        {line.thicknessLabel || line.thicknessIn ? (
                                            <div className="flex gap-2">
                                                <dt>Thickness:</dt>
                                                <dd className="text-ink-soft">
                                                    {line.thicknessLabel ?? `${line.thicknessIn} in`}
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>

                                    <div className="mt-4 flex items-center gap-3">
                                        <label htmlFor={`qty-${key}`} className="table-head">
                                            Quantity
                                        </label>

                                        <input
                                            id={`qty-${key}`}
                                            type="number"
                                            min="1"
                                            max="999"
                                            value={line.quantity}
                                            onChange={(event) =>
                                                updateQuantity(key, event.target.value)
                                            }
                                            className="w-20 border border-rule bg-surface px-3 py-1.5 text-[0.9375rem] text-ink"
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-6">
                    <Link
                        href="/products"
                        className="text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
                    >
                        Continue browsing
                    </Link>
                </div>
            </div>

            <aside className="h-fit border border-rule bg-panel p-7 lg:sticky lg:top-24">
                <p className="eyebrow mb-5">Summary</p>

                <dl className="mb-6 space-y-0">
                    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                        <dt className="table-head">Lines</dt>
                        <dd className="text-[1.0625rem] text-ink">{items.length}</dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                        <dt className="table-head">Total units</dt>
                        <dd className="text-[1.0625rem] text-ink">{units}</dd>
                    </div>
                </dl>

                <Button href="/checkout" size="lg" className="w-full">
                    Proceed to Checkout
                </Button>

                <p className="mt-4 text-[0.8125rem] leading-6 text-ink-faint">
                    No prices are shown and no payment is taken. Checkout sends us your
                    specified order request, and we reply with a quote.
                </p>
            </aside>
        </div>
    );
}
