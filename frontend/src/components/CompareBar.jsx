"use client";

import Link from "next/link";
import { clearCompare, removeFromCompare, useCompare } from "@/lib/compare";

// A slim bar that appears once something is selected, so the comparison is
// always one click away from anywhere in the catalogue.
export default function CompareBar() {
    const slugs = useCompare();

    if (slugs.length === 0) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-ground/97 backdrop-blur-sm">
            <div className="shell flex flex-wrap items-center justify-between gap-4 py-3.5 pr-20 sm:pr-24">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="table-head mr-1">Comparing</span>

                    {slugs.map((slug) => (
                        <span
                            key={slug}
                            className="inline-flex items-center gap-2 border border-rule bg-surface px-3 py-1.5 text-[0.8125rem] text-ink"
                        >
                            {slug}

                            <button
                                type="button"
                                onClick={() => removeFromCompare(slug)}
                                aria-label={`Remove ${slug} from comparison`}
                                className="text-ink-faint transition-colors hover:text-brand-red"
                            >
                                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                                    <path
                                        d="M1 1l8 8M9 1L1 9"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={clearCompare}
                        className="text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                    >
                        Clear
                    </button>

                    <Link
                        href="/compare"
                        className="border border-navy bg-navy px-5 py-2 text-[0.8125rem] text-white transition-colors hover:bg-navy-dark"
                    >
                        Compare {slugs.length}
                    </Link>
                </div>
            </div>
        </div>
    );
}
