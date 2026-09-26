"use client";

import Link from "next/link";
import { useFavourites } from "./FavouritesProvider";

// Favourites link with a saved count.
export default function FavouritesIndicator({ onNavigate }) {
    const { ids } = useFavourites();

    return (
        <Link
            href="/favourites"
            onClick={onNavigate}
            aria-label={ids.length ? `Favourites, ${ids.length} saved` : "Favourites, none saved"}
            className="relative flex h-9 w-9 items-center justify-center text-ink-muted transition-colors hover:text-brand-red"
        >
            <svg width="19" height="18" viewBox="0 0 20 18" aria-hidden="true">
                <path
                    d="M10 17S1 11.5 1 5.9A4.9 4.9 0 0 1 10 3.2 4.9 4.9 0 0 1 19 5.9C19 11.5 10 17 10 17z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>

            {ids.length > 0 ? (
                <span className="absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[0.625rem] font-medium text-white">
                    {ids.length > 99 ? "99+" : ids.length}
                </span>
            ) : null}
        </Link>
    );
}
