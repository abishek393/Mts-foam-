"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCart, countUnits, lineKey, useCart } from "@/lib/cart";
import FormField from "./FormField";
import Button from "./Button";
import PaymentProofPanel from "./PaymentProofPanel";
import AuthForm from "./AuthForm";
import { useInquiry } from "./InquiryProvider";

// Checkout takes no payment — the catalogue carries no prices. It collects
// contact and delivery details and sends the cart as an order request.
export default function CheckoutView({ user: initialUser }) {
    const router = useRouter();
    const { setUser } = useInquiry();
    const [user, setLocalUser] = useState(initialUser ?? null);
    const items = useCart();
    const units = countUnits(items);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [placed, setPlaced] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = new FormData(event.currentTarget);
        const values = Object.fromEntries(form.entries());

        try {
            const res = await fetch("/api/proxy/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    items: items.map((line) => ({
                        productId: line.productId,
                        productLabel: line.name,
                        sizeLabel: line.sizeLabel,
                        thicknessIn: line.thicknessIn,
                        quantity: line.quantity,
                    })),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.errors?.length
                        ? data.errors.join(" ")
                        : data.message || "Something went wrong."
                );
                setSubmitting(false);
                return;
            }

            // The order now lives on the server, so the local cart is done with.
            clearCart();
            setPlaced(data.order);
            router.refresh();
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    // Order placed — the cart is empty by now, so this must come before the
    // empty-cart branch below.
    if (placed) {
        return (
            <div className="mt-12 border border-rule bg-panel px-6 py-16 text-center">
                <p className="eyebrow mb-4">Order placed</p>

                <h2 className="display mb-4 text-[2rem]">Thank you</h2>

                <p className="mx-auto mb-2 max-w-lg text-[0.9375rem] leading-7 text-ink-soft">
                    Your order reference is{" "}
                    <strong className="font-normal text-ink">{placed.orderNumber}</strong>.
                    Our team will confirm the specification and reply with a quote.
                </p>

                <p className="mx-auto mb-2 max-w-lg text-[0.8125rem] text-ink-faint">
                    Nothing has been charged automatically — pay the amount we quote you
                    using the code below.
                </p>

                {/* Placed first, so the QR is on screen the moment the order
                    exists rather than buried in a later email. */}
                <PaymentProofPanel
                    orderId={placed.id}
                    orderNumber={placed.orderNumber}
                />

                <div className="mt-9" />

                <div className="flex flex-wrap justify-center gap-3">
                    <Button href="/orders" size="lg">
                        View my orders
                    </Button>

                    <Button href="/products" variant="secondary" size="lg">
                        Continue browsing
                    </Button>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="mt-12 border border-rule bg-panel px-6 py-20 text-center">
                <p className="display mb-3 text-[1.75rem]">Nothing to check out</p>

                <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                    Your cart is empty. Add a product and its size, then come back.
                </p>

                <Button href="/products" size="lg">
                    Browse the catalogue
                </Button>
            </div>
        );
    }

    // Placing an order requires an account, like every inquiry on the site.
    // The cart is untouched while they sign in.
    if (!user) {
        return (
            <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
                <div className="max-w-md">
                    <p className="eyebrow mb-4">One step first</p>

                    <h2 className="display mb-5 text-[1.875rem]">
                        Sign in to place your order
                    </h2>

                    <p className="mb-8 text-[0.9375rem] leading-7 text-ink-soft">
                        Orders are tied to an account so you can track the quote and
                        follow-up in one place. Your cart is kept while you sign in.
                    </p>

                    <AuthForm
                        mode="register"
                        compact
                        onSuccess={(signedIn) => {
                            setLocalUser(signedIn);
                            setUser(signedIn);
                            router.refresh();
                        }}
                    />
                </div>

                <CartSummary items={items} units={units} />
            </div>
        );
    }

    return (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="display text-[1.75rem]">Your details</h2>

                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                        label="Name"
                        name="contactName"
                        required
                        defaultValue={`${user.firstName} ${user.lastName}`}
                        autoComplete="name"
                    />

                    <FormField
                        label="Phone / WhatsApp"
                        name="contactPhone"
                        type="tel"
                        required
                        defaultValue={user.phone ?? ""}
                        placeholder="+977 0000 000000"
                        autoComplete="tel"
                    />
                </div>

                <FormField
                    label="Email"
                    name="contactEmail"
                    type="email"
                    required
                    defaultValue={user.email}
                    autoComplete="email"
                />

                <FormField
                    label="Delivery address"
                    name="deliveryAddress"
                    rows={3}
                    placeholder="Where should we deliver or arrange collection?"
                />

                <FormField
                    label="Order note"
                    name="note"
                    rows={3}
                    placeholder="Anything else we should know — timing, access, custom requirements."
                />

                {error ? (
                    <p
                        role="alert"
                        className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                    >
                        {error}
                    </p>
                ) : null}

                <Button type="submit" disabled={submitting} size="lg" className="w-full sm:w-auto">
                    {submitting ? "Placing order…" : "Place Order Request"}
                </Button>

                <p className="text-[0.8125rem] leading-6 text-ink-faint">
                    No payment is taken now or later on this site. We reply with a quote
                    against this specification.
                </p>
            </form>

            <CartSummary items={items} units={units} />
        </div>
    );
}

function CartSummary({ items, units }) {
    return (
        <aside className="h-fit border border-rule bg-panel p-7 lg:sticky lg:top-24">
            <div className="mb-5 flex items-baseline justify-between gap-4">
                <p className="eyebrow">Your order</p>

                <Link
                    href="/cart"
                    className="text-[0.8125rem] text-navy underline underline-offset-4 hover:text-brand-red"
                >
                    Edit
                </Link>
            </div>

            <ul className="border-t border-rule">
                {items.map((line) => (
                    <li key={lineKey(line)} className="flex gap-4 border-b border-rule py-4">
                        <div className="relative h-14 w-16 shrink-0 overflow-hidden border border-rule bg-surface">
                            <Image
                                src={line.image ?? "/images/products/placeholder.svg"}
                                alt=""
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-[0.9375rem] text-ink">{line.name}</p>

                            <p className="mt-1 text-[0.8125rem] text-ink-muted">
                                {[line.sizeLabel, line.thicknessLabel]
                                    .filter(Boolean)
                                    .join(" · ") || "Specification to confirm"}
                            </p>

                            <p className="mt-1 text-[0.8125rem] text-ink-soft">
                                Quantity {line.quantity}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="mt-5 flex items-baseline justify-between gap-4">
                <span className="table-head">Total units</span>
                <span className="text-[1.0625rem] text-ink">{units}</span>
            </div>
        </aside>
    );
}
