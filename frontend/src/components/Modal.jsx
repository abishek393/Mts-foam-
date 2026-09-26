"use client";

import { useEffect, useRef } from "react";

// Accessible dialog: focus moves in on open and returns on close, Escape
// dismisses, and focus is trapped inside while it is open.
export default function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }) {
    const panelRef = useRef(null);
    const previouslyFocused = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        previouslyFocused.current = document.activeElement;

        const { overflow } = document.body.style;
        document.body.style.overflow = "hidden";

        // Move focus to the panel so screen readers announce the dialog.
        panelRef.current?.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = panelRef.current?.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (!focusable?.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = overflow;
            previouslyFocused.current?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
            <div
                className="fixed inset-0 bg-ink/40"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={`relative my-auto w-full ${maxWidth} border border-rule bg-ground shadow-xl outline-none`}
            >
                <div className="flex items-start justify-between gap-6 border-b border-rule px-6 py-5 sm:px-8">
                    <h2 className="display text-[1.5rem] sm:text-[1.75rem]">{title}</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-2 -mt-1 p-2 text-ink-muted transition-colors hover:text-ink"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                            <path
                                d="M1 1l16 16M17 1L1 17"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                fill="none"
                            />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-6 sm:px-8">{children}</div>
            </div>
        </div>
    );
}
