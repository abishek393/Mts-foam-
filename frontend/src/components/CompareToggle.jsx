"use client";

import { MAX_COMPARE, toggleCompare, useCompare } from "@/lib/compare";

// "Add to compare" on every catalogue card and on the product detail page.
export default function CompareToggle({ slug, name, className = "" }) {
    // Empty on the server and during hydration, then the stored selection.
    const slugs = useCompare();

    const selected = slugs.includes(slug);
    const full = slugs.length >= MAX_COMPARE && !selected;

    return (
        <div className={`mt-4 ${className}`}>
            <button
                type="button"
                onClick={() => toggleCompare(slug)}
                disabled={full}
                aria-pressed={selected}
                className={`inline-flex items-center gap-2 text-[0.8125rem] transition-colors ${
                    full
                        ? "cursor-not-allowed text-ink-faint"
                        : selected
                            ? "text-navy"
                            : "text-ink-muted hover:text-navy"
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 items-center justify-center border ${
                        selected ? "border-navy bg-navy" : "border-rule-strong"
                    }`}
                >
                    {selected ? (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                            <path
                                d="M1 4l2.5 2.5L9 1"
                                stroke="#fff"
                                strokeWidth="1.6"
                                fill="none"
                            />
                        </svg>
                    ) : null}
                </span>

                {selected
                    ? "Added to compare"
                    : full
                        ? `Compare full (${MAX_COMPARE})`
                        : "Add to compare"}

                <span className="sr-only">{name}</span>
            </button>
        </div>
    );
}
