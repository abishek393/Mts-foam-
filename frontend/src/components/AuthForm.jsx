"use client";

import { useState } from "react";
import FormField from "./FormField";
import Button from "./Button";
import GoogleSignInButton from "./GoogleSignInButton";
import VerifyCodeStep from "./VerifyCodeStep";

// Shared by the /login and /register pages and by the inquiry dialog's inline
// sign-in step, so the two never drift apart.
export default function AuthForm({ mode: initialMode = "login", onSuccess, compact = false }) {
    const [mode, setMode] = useState(initialMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Set once registration has been started and a code emailed. While this is
    // set the form is replaced by the code step — no account exists yet.
    const [pending, setPending] = useState(null);

    const isRegister = mode === "register";

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries(form.entries());

        if (isRegister && payload.password !== payload.confirmPassword) {
            setFieldErrors({ confirmPassword: "Passwords do not match." });
            setSubmitting(false);
            return;
        }

        delete payload.confirmPassword;

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, ...payload }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.errors?.length ? data.errors.join(" ") : data.message || "Something went wrong."
                );
                setSubmitting(false);
                return;
            }

            // Registering no longer signs anyone in directly — it emails a code
            // and waits. Signing in still returns a user straight away.
            if (data.pending) {
                setPending({
                    email: data.email ?? payload.email,
                    // Said plainly when the server has no mail configured, so
                    // nobody sits waiting for an email that will never arrive.
                    notice: data.mailDelivered
                        ? null
                        : "This server has no email configured yet, so the code was printed to its console instead.",
                });
                setSubmitting(false);
                return;
            }

            onSuccess?.(data.user);
        } catch {
            setError("Cannot reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    // The code step stands in for the whole form, rather than sitting below it,
    // so there is only ever one thing being asked for at a time.
    if (pending) {
        return (
            <VerifyCodeStep
                email={pending.email}
                notice={pending.notice}
                onVerified={(user) => onSuccess?.(user)}
                onCancel={() => {
                    setPending(null);
                    setError(null);
                }}
            />
        );
    }

    return (
        <div>
            {/* Renders nothing when the site has no Google client ID, so the
                email form is unaffected on a server without it configured. */}
            <GoogleSignInButton
                text={isRegister ? "signup_with" : "signin_with"}
                onSuccess={(user) => onSuccess?.(user)}
                onError={setError}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="First name" name="firstName" required autoComplete="given-name" />
                        <FormField label="Last name" name="lastName" required autoComplete="family-name" />
                    </div>
                ) : null}

                <FormField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                />

                {isRegister ? (
                    <FormField
                        label="Phone / WhatsApp"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+977 0000 000000"
                    />
                ) : null}

                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    hint={isRegister ? "At least 6 characters." : undefined}
                />

                {isRegister ? (
                    <FormField
                        label="Confirm password"
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                        error={fieldErrors.confirmPassword}
                    />
                ) : null}

                {error ? (
                    <p role="alert" className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent">
                        {error}
                    </p>
                ) : null}

                <Button type="submit" disabled={submitting} size={compact ? "md" : "lg"} className="w-full">
                    {submitting
                        ? "Please wait…"
                        : isRegister
                            ? "Create account"
                            : "Sign in"}
                </Button>
            </form>

            <p className="mt-5 text-center text-[0.875rem] text-ink-muted">
                {isRegister ? "Already have an account?" : "No account yet?"}{" "}
                <button
                    type="button"
                    onClick={() => {
                        setMode(isRegister ? "login" : "register");
                        setError(null);
                        setFieldErrors({});
                        setPending(null);
                    }}
                    className="text-navy underline underline-offset-4 hover:text-brand-red"
                >
                    {isRegister ? "Sign in" : "Create one"}
                </button>
            </p>
        </div>
    );
}
