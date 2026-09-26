"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Button from "./Button";
import FormField from "./FormField";
import { API_BASE } from "@/lib/session-config";

// Pay by QR, then send the screenshot.
//
// No amount is shown or stored anywhere — the site carries no prices. The
// customer pays whatever 4STAR quoted them and uploads the statement; an admin
// checks it against the bank. This panel is only the handover.

export default function PaymentProofPanel({ orderId, orderNumber }) {
    const [details, setDetails] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    const input = useRef(null);

    useEffect(() => {
        let cancelled = false;

        fetch("/api/proxy/api/payment/details")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled) setDetails(data ?? { configured: false });
            })
            .catch(() => {
                if (!cancelled) setDetails({ configured: false });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Derived from the chosen file rather than mirrored into state — storing it
    // would mean setting state inside an effect just to track something already
    // known at render time.
    const preview = useMemo(
        () =>
            file && file.type?.startsWith("image/")
                ? URL.createObjectURL(file)
                : null,
        [file]
    );

    // Object URLs hold the file in memory until they are revoked.
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview]
    );

    async function submit(event) {
        event.preventDefault();

        if (!file) {
            setError("Choose the screenshot of your payment.");
            return;
        }

        setSubmitting(true);
        setError(null);

        const body = new FormData();
        body.append("proof", file);
        body.set("reference", input.current?.value ?? "");

        try {
            const res = await fetch(`/api/payment-proof/${orderId}`, {
                method: "POST",
                body,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message ?? "That could not be uploaded.");
                setSubmitting(false);
                return;
            }

            setDone(true);
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="mt-10 border border-navy bg-surface px-6 py-8 text-left">
                <p className="eyebrow mb-3">Payment sent</p>

                <p className="text-[0.9375rem] leading-7 text-ink-soft">
                    Thank you — we have your screenshot for order{" "}
                    <strong className="font-normal text-ink">{orderNumber}</strong> and
                    will confirm it against our account shortly. You can follow its
                    progress under My orders.
                </p>
            </div>
        );
    }

    // Until an admin uploads a QR there is nothing to scan, so the panel says so
    // rather than showing an empty box.
    if (details && !details.configured) {
        return (
            <div className="mt-10 border border-rule bg-surface px-6 py-8 text-left">
                <p className="eyebrow mb-3">Payment</p>

                <p className="text-[0.9375rem] leading-7 text-ink-soft">
                    We will send payment details with your quote. No payment is needed
                    yet.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-10 border border-rule bg-surface px-6 py-8 text-left">
            <p className="eyebrow mb-3">Payment</p>

            <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-10">
                <div>
                    {details?.qrUrl ? (
                        <div className="relative h-48 w-48 border border-rule bg-panel">
                            <Image
                                src={`${API_BASE}${details.qrUrl}`}
                                alt="Payment QR code"
                                fill
                                sizes="192px"
                                className="object-contain p-2"
                            />
                        </div>
                    ) : (
                        <div className="h-48 w-48 animate-pulse border border-rule bg-panel" />
                    )}
                </div>

                <div>
                    <p className="mb-4 text-[0.9375rem] leading-7 text-ink-soft">
                        {details?.instructions ??
                            "Scan the code to pay, then upload a screenshot of the confirmation so we can match it to your order."}
                    </p>

                    <form onSubmit={submit} className="space-y-4">
                        <FormField
                            label="Transaction reference"
                            name="reference"
                            ref={input}
                            placeholder="From your statement — optional"
                        />

                        <div>
                            <label
                                htmlFor="payment-proof"
                                className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
                            >
                                Screenshot of the payment
                                <span className="ml-1 text-brand-red">*</span>
                            </label>

                            <input
                                id="payment-proof"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                className="w-full border border-rule bg-surface px-3.5 py-2.5 text-[0.875rem] text-ink"
                            />

                            <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                                JPEG, PNG, WebP or PDF, up to 8 MB. Only you and our team
                                can see it.
                            </p>
                        </div>

                        {preview ? (
                            <div>
                                <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                                    Will be sent
                                </p>

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview}
                                    alt=""
                                    className="max-h-48 border border-rule object-contain"
                                />
                            </div>
                        ) : null}

                        {error ? (
                            <p
                                role="alert"
                                className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                            >
                                {error}
                            </p>
                        ) : null}

                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Uploading…" : "Send payment screenshot"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
