"use client";

import { useEffect, useRef, useState } from "react";
import FormField from "./FormField";
import Button from "./Button";

// The second half of registration. The account does not exist yet — it is
// created only when this code is accepted, so backing out here leaves nothing
// behind.

const RESEND_COOLDOWN = 60;

export default function VerifyCodeStep({ email, notice, onVerified, onCancel }) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(notice ?? null);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

    const input = useRef(null);

    useEffect(() => {
        input.current?.focus();
    }, []);

    // Counts the resend button back in. The API enforces the same limit — this
    // only saves a pointless round trip.
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function submit(event) {
        event.preventDefault();

        if (code.trim().length !== 6) {
            setError("Enter the 6-digit code from your email.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setInfo(null);

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "register-verify", email, code: code.trim() }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message ?? "That code could not be checked.");
                setSubmitting(false);
                return;
            }

            onVerified?.(data.user);
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    async function resend() {
        setError(null);
        setInfo(null);

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "register-resend", email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message ?? "Could not send another code.");
                if (typeof data.retryAfter === "number") setCooldown(data.retryAfter);
                return;
            }

            setInfo(data.message ?? "A new code is on its way.");
            setCooldown(data.cooldownSeconds ?? RESEND_COOLDOWN);
            setCode("");
            input.current?.focus();
        } catch {
            setError("Cannot reach the server. Please try again.");
        }
    }

    return (
        <div>
            <div className="mb-6 border border-rule bg-panel px-4 py-3">
                <p className="text-[0.875rem] leading-6 text-ink-soft">
                    We&apos;ve emailed a 6-digit code to{" "}
                    <span className="text-ink">{email}</span>. Enter it below to finish
                    creating your account.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <FormField
                    label="Verification code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    required
                    ref={input}
                    value={code}
                    onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="[&_input]:text-center [&_input]:text-[1.5rem] [&_input]:tracking-[0.4em]"
                />

                {error ? (
                    <p
                        role="alert"
                        className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                    >
                        {error}
                    </p>
                ) : null}

                {info ? (
                    <p
                        role="status"
                        className="border border-navy bg-panel px-3.5 py-2.5 text-[0.875rem] text-navy"
                    >
                        {info}
                    </p>
                ) : null}

                <Button type="submit" disabled={submitting} size="lg" className="w-full">
                    {submitting ? "Checking…" : "Verify and create account"}
                </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[0.875rem]">
                <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0}
                    className="text-navy underline underline-offset-4 transition-colors hover:text-brand-red disabled:text-ink-faint disabled:no-underline"
                >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Send another code"}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                    Use a different email
                </button>
            </div>
        </div>
    );
}
