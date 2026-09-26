"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/admin/form-bits";

// Taking an order at a shop. Built for someone standing in a doorway on a
// phone: few required fields, lines added one tap at a time.

const blankLine = () => ({
    key: crypto.randomUUID(),
    productId: "",
    productLabel: "",
    sizeLabel: "",
    quantity: "1",
    note: "",
});

export default function FieldOrderForm({ products }) {
    const router = useRouter();

    const [lines, setLines] = useState([blankLine()]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null);

    const updateLine = (key, patch) =>
        setLines((current) =>
            current.map((line) => (line.key === key ? { ...line, ...patch } : line))
        );

    async function submit(event) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        // A line counts if it names a product, either from the catalogue or by
        // hand for something not listed.
        const payload = lines
            .filter((line) => line.productId || line.productLabel.trim())
            .map((line) => ({
                productId: line.productId || undefined,
                productLabel: line.productLabel.trim() || undefined,
                sizeLabel: line.sizeLabel.trim() || undefined,
                quantity: Number(line.quantity) || 1,
                note: line.note.trim() || undefined,
            }));

        if (payload.length === 0) {
            setError("Add at least one product to the order.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/marketer/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerBusiness: form.get("customerBusiness"),
                    contactName: form.get("contactName"),
                    contactPhone: form.get("contactPhone"),
                    contactEmail: form.get("contactEmail"),
                    deliveryAddress: form.get("deliveryAddress"),
                    note: form.get("note"),
                    items: payload,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message ?? "That order could not be saved.");
                setSubmitting(false);
                return;
            }

            setDone(data.order);
            setLines([blankLine()]);
            event.target.reset();
            router.refresh();
        } catch {
            setError("Cannot reach the server. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="border border-navy bg-surface p-6">
                <p className="eyebrow mb-3">Order recorded</p>

                <p className="display mb-2 text-[1.5rem]">{done.orderNumber}</p>

                <p className="mb-6 text-[0.9375rem] leading-7 text-ink-muted">
                    Saved against your name and sent to the office. They will quote it and
                    follow up — no prices are set here.
                </p>

                <button
                    type="button"
                    onClick={() => setDone(null)}
                    className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                >
                    Take another order
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="grid gap-6">
            <section className="border border-rule bg-surface p-5 sm:p-6">
                <h2 className="eyebrow mb-5">Who it&apos;s for</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Shop or business"
                        name="customerBusiness"
                        placeholder="Ram Furniture House"
                        className="sm:col-span-2"
                    />

                    <Field label="Contact name" name="contactName" required />
                    <Field label="Phone" name="contactPhone" type="tel" required />

                    <Field
                        label="Email"
                        name="contactEmail"
                        type="email"
                        hint="Optional — yours is used if they have none."
                    />

                    <Field label="Delivery address" name="deliveryAddress" />
                </div>
            </section>

            <section className="border border-rule bg-surface p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="eyebrow">What they want</h2>

                    <button
                        type="button"
                        onClick={() => setLines((current) => [...current, blankLine()])}
                        className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                    >
                        Add a line
                    </button>
                </div>

                <ul className="grid gap-4">
                    {lines.map((line, index) => (
                        <li key={line.key} className="border border-rule bg-ground p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                                    Line {index + 1}
                                </span>

                                {lines.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLines((current) =>
                                                current.filter((entry) => entry.key !== line.key)
                                            )
                                        }
                                        className="text-[0.8125rem] text-brand-red hover:underline"
                                    >
                                        Remove
                                    </button>
                                ) : null}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field
                                    label="Product"
                                    name={`product-${line.key}`}
                                    value={line.productId}
                                    onChange={(event) =>
                                        updateLine(line.key, {
                                            productId: event.target.value,
                                            // Clearing the free-text name when a
                                            // catalogue product is chosen keeps
                                            // the two from disagreeing.
                                            productLabel: "",
                                        })
                                    }
                                    options={[
                                        { value: "", label: "— choose, or type below —" },
                                        ...products.map((product) => ({
                                            value: String(product.id),
                                            label: product.name,
                                        })),
                                    ]}
                                />

                                <Field
                                    label="Or write it in"
                                    name={`label-${line.key}`}
                                    value={line.productLabel}
                                    disabled={Boolean(line.productId)}
                                    onChange={(event) =>
                                        updateLine(line.key, { productLabel: event.target.value })
                                    }
                                    placeholder="Something not in the list"
                                />

                                <Field
                                    label="Size"
                                    name={`size-${line.key}`}
                                    value={line.sizeLabel}
                                    onChange={(event) =>
                                        updateLine(line.key, { sizeLabel: event.target.value })
                                    }
                                    placeholder="72 × 60 in"
                                />

                                <Field
                                    label="Quantity"
                                    name={`qty-${line.key}`}
                                    type="number"
                                    min="1"
                                    value={line.quantity}
                                    onChange={(event) =>
                                        updateLine(line.key, { quantity: event.target.value })
                                    }
                                />

                                <Field
                                    label="Note"
                                    name={`note-${line.key}`}
                                    value={line.note}
                                    onChange={(event) =>
                                        updateLine(line.key, { note: event.target.value })
                                    }
                                    className="sm:col-span-2"
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="border border-rule bg-surface p-5 sm:p-6">
                <h2 className="eyebrow mb-5">Anything else</h2>

                <Field
                    label="Note for the office"
                    name="note"
                    rows={3}
                    placeholder="Delivery timing, who to call, anything they should know."
                />
            </section>

            {error ? (
                <p
                    role="alert"
                    className="border border-brand-red bg-brand-red/5 px-4 py-3 text-[0.875rem] text-brand-red"
                >
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
                <button
                    type="submit"
                    disabled={submitting}
                    className="border border-navy bg-navy px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
                >
                    {submitting ? "Saving…" : "Record this order"}
                </button>

                <p className="text-[0.8125rem] text-ink-faint">
                    No prices are taken — the office quotes it.
                </p>
            </div>
        </form>
    );
}
