"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import FormField from "./FormField";
import Button from "./Button";
import AuthForm from "./AuthForm";

const InquiryContext = createContext(null);

export function useInquiry() {
    const context = useContext(InquiryContext);

    if (!context) {
        throw new Error("useInquiry must be used inside <InquiryProvider>");
    }

    return context;
}

// Holds the sitewide inquiry dialog. Any "Send Inquiry" button anywhere calls
// openInquiry(prefill) — the dialog handles the login gate itself, keeping the
// prefill intact across sign-in so nothing has to be retyped.
export default function InquiryProvider({ initialUser, children }) {
    const router = useRouter();
    const [user, setUser] = useState(initialUser ?? null);
    const [open, setOpen] = useState(false);
    const [prefill, setPrefill] = useState({});

    const openInquiry = useCallback((details = {}) => {
        setPrefill(details);
        setOpen(true);
    }, []);

    const closeInquiry = useCallback(() => setOpen(false), []);

    const value = useMemo(
        () => ({ user, setUser, openInquiry, closeInquiry }),
        [user, openInquiry, closeInquiry]
    );

    return (
        <InquiryContext.Provider value={value}>
            {children}

            <Modal
                open={open}
                onClose={closeInquiry}
                title={user ? "Send inquiry" : "Sign in to send an inquiry"}
            >
                {user ? (
                    <InquiryForm
                        user={user}
                        prefill={prefill}
                        onDone={() => {
                            closeInquiry();
                            router.refresh();
                        }}
                    />
                ) : (
                    <div>
                        <p className="mb-6 text-[0.9375rem] leading-7 text-ink-soft">
                            Inquiries are tied to an account so you can track their
                            progress. Your selection is kept while you sign in.
                        </p>

                        <AuthForm
                            mode="register"
                            compact
                            onSuccess={(signedIn) => {
                                setUser(signedIn);
                                router.refresh();
                            }}
                        />
                    </div>
                )}
            </Modal>
        </InquiryContext.Provider>
    );
}

function InquiryForm({ user, prefill, onDone }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries(form.entries());

        // Strip empty strings so the API stores nulls rather than blanks.
        for (const key of Object.keys(payload)) {
            if (payload[key] === "") delete payload[key];
        }

        try {
            const res = await fetch("/api/proxy/api/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...payload,
                    productId: prefill.productId ?? undefined,
                    source: prefill.source ?? "contact",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.errors?.length ? data.errors.join(" ") : data.message || "Something went wrong."
                );
                setSubmitting(false);
                return;
            }

            setSent(true);
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    if (sent) {
        return (
            <div className="py-4 text-center">
                <p className="eyebrow mb-3">Inquiry sent</p>

                <h3 className="display mb-4 text-[1.75rem]">Thank you</h3>

                <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-soft">
                    Our team will get back to you shortly. You can follow this inquiry
                    from your account at any time.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                    <Button href="/account" variant="primary">
                        View my inquiries
                    </Button>

                    <Button variant="secondary" onClick={onDone}>
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {prefill.productName ? (
                <div className="border border-rule bg-panel px-4 py-3">
                    <p className="table-head mb-1">Product</p>
                    <p className="text-[0.9375rem] text-ink">{prefill.productName}</p>
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Name"
                    name="contactName"
                    required
                    defaultValue={`${user.firstName} ${user.lastName}`}
                />

                <FormField
                    label="Phone / WhatsApp"
                    name="contactPhone"
                    type="tel"
                    required
                    defaultValue={user.phone ?? ""}
                    placeholder="+977 0000 000000"
                />
            </div>

            <FormField
                label="Email"
                name="contactEmail"
                type="email"
                required
                defaultValue={user.email}
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                    label="Size"
                    name="sizeLabel"
                    defaultValue={prefill.sizeLabel ?? ""}
                    placeholder="60 × 72 in"
                />

                <FormField
                    label="Thickness (in)"
                    name="thicknessIn"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={prefill.thicknessIn ?? ""}
                    placeholder="6"
                />

                <FormField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    required
                    defaultValue={prefill.quantity ?? 1}
                />
            </div>

            <FormField
                label="Message"
                name="message"
                rows={4}
                defaultValue={prefill.message ?? ""}
                placeholder="Anything else we should know?"
            />

            {error ? (
                <p role="alert" className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent">
                    {error}
                </p>
            ) : null}

            <Button type="submit" disabled={submitting} size="lg" className="w-full">
                {submitting ? "Sending…" : "Send inquiry"}
            </Button>

            <p className="text-center text-[0.8125rem] text-ink-faint">
                No payment is taken. We reply with a quote and next steps.
            </p>
        </form>
    );
}
