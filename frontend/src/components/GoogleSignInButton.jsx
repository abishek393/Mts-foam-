"use client";

import { useEffect, useRef, useState } from "react";

// Google Identity Services renders its own button into an element we give it.
// The browser never sends us an email — GIS hands back a signed ID token, which
// goes to /api/session and on to the API, where Google's signature and our
// client ID are both checked before anyone is signed in.

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// One <script> for the whole app, however many buttons are mounted.
let scriptPromise = null;

function loadGsi() {
    if (typeof window === "undefined") return Promise.reject(new Error("no window"));

    scriptPromise ??= new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();

        const existing = document.querySelector(`script[src="${GSI_SRC}"]`);

        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("failed")));
            return;
        }

        const script = document.createElement("script");
        script.src = GSI_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("failed"));
        document.head.appendChild(script);
    });

    return scriptPromise;
}

export default function GoogleSignInButton({ onSuccess, onError, text = "signin_with" }) {
    const holder = useRef(null);
    const [status, setStatus] = useState(CLIENT_ID ? "loading" : "unconfigured");

    // GIS is initialised once with a callback that reads this ref, so the
    // parent can re-render — and pass new onSuccess/onError closures — without
    // re-initialising GIS and leaving a second button behind. Synced in an
    // effect rather than during render, which React forbids.
    const handler = useRef(null);

    const respond = async (response) => {
        setStatus("submitting");

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "google", credential: response.credential }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus("ready");
                onError?.(data.message ?? "Google sign-in failed. Please try again.");
                return;
            }

            onSuccess?.(data.user);
        } catch {
            setStatus("ready");
            onError?.("Cannot reach the server. Please try again.");
        }
    };

    // Declared before the initialisation effect below, so the ref is populated
    // before GIS can ever invoke it.
    useEffect(() => {
        handler.current = respond;
    });

    useEffect(() => {
        if (!CLIENT_ID) return;

        let cancelled = false;

        loadGsi()
            .then(() => {
                if (cancelled || !holder.current) return;

                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: (response) => handler.current(response),
                });

                window.google.accounts.id.renderButton(holder.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text,
                    shape: "rectangular",
                    logo_alignment: "center",
                    width: 320,
                });

                setStatus("ready");
            })
            .catch(() => {
                if (!cancelled) setStatus("failed");
            });

        return () => {
            cancelled = true;
        };
    }, [text]);

    // Nothing is rendered when the site has no Google client ID — an inert
    // button that always errors is worse than no button at all.
    if (status === "unconfigured") return null;

    return (
        <div className="mb-6">
            {status === "failed" ? (
                <p className="text-[0.875rem] text-ink-muted">
                    Google sign-in could not load. Use your email and password below.
                </p>
            ) : (
                <div className="relative overflow-hidden">
                    <div
                        ref={holder}
                        className={`flex justify-center ${status === "loading" ? "invisible" : ""}`}
                    />

                    {status === "loading" ? (
                        <div className="absolute inset-0 flex h-[44px] items-center border border-rule bg-panel px-4 text-[0.875rem] text-ink-faint">
                            Loading Google sign-in…
                        </div>
                    ) : null}

                    {status === "submitting" ? (
                        <div className="absolute inset-0 flex h-[44px] items-center justify-center border border-rule bg-panel px-4 text-[0.875rem] text-ink-muted">
                            Signing you in…
                        </div>
                    ) : null}
                </div>
            )}

            <div className="mt-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-rule" />
                <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                    or
                </span>
                <span className="h-px flex-1 bg-rule" />
            </div>
        </div>
    );
}
