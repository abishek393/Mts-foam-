"use client";

import Link from "next/link";
import { countUnits, useCart } from "@/lib/cart";

// Cart link with a live count badge. Empty on the server and during hydration,
// then the stored cart — useSyncExternalStore handles the handover.
export default function CartIndicator({ onNavigate }) {
    const items = useCart();
    const units = countUnits(items);

    return (
        <Link
            href="/cart"
            onClick={onNavigate}
            aria-label={units ? `Cart, ${units} items` : "Cart, empty"}
            className="relative flex h-9 w-9 items-center justify-center text-ink-muted transition-colors hover:text-navy"
        >
            <svg width="19" height="19" viewBox="0 0 22 22" aria-hidden="true">
                <path
                    d="M1 1h3l2.2 11.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L20.5 5H5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinejoin="round"
                />
                <circle cx="9" cy="19" r="1.4" fill="currentColor" />
                <circle cx="17" cy="19" r="1.4" fill="currentColor" />
            </svg>

            {units > 0 ? (
                <span className="absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[0.625rem] font-medium text-white">
                    {units > 99 ? "99+" : units}
                </span>
            ) : null}
        </Link>
    );
}
