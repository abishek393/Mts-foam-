"use client";

import { useFavourites } from "./FavouritesProvider";

// The heart. Two shapes: a bare icon for catalogue cards, and a labelled
// button for the product detail page.
export default function FavouriteButton({
    productId,
    productName,
    variant = "icon",
    className = "",
}) {
    const { isFavourite, isPending, toggle, signedIn } = useFavourites();

    const saved = isFavourite(productId);
    const busy = isPending(productId);

    const label = !signedIn
        ? `Sign in to save ${productName}`
        : saved
            ? `Remove ${productName} from favourites`
            : `Save ${productName} to favourites`;

    const heart = (
        <svg width="17" height="16" viewBox="0 0 20 18" aria-hidden="true">
            <path
                d="M10 17S1 11.5 1 5.9A4.9 4.9 0 0 1 10 3.2 4.9 4.9 0 0 1 19 5.9C19 11.5 10 17 10 17z"
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );

    if (variant === "icon") {
        return (
            <button
                type="button"
                onClick={() => toggle(productId)}
                disabled={busy}
                aria-pressed={saved}
                aria-label={label}
                title={label}
                className={`flex h-9 w-9 items-center justify-center border transition-colors disabled:opacity-50 ${
                    saved
                        ? "border-brand-red bg-brand-red/5 text-brand-red"
                        : "border-rule bg-surface/90 text-ink-muted hover:border-brand-red hover:text-brand-red"
                } ${className}`}
            >
                {heart}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => toggle(productId)}
            disabled={busy}
            aria-pressed={saved}
            className={`inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm font-medium tracking-wide transition-colors disabled:opacity-50 ${
                saved
                    ? "border-brand-red bg-brand-red/5 text-brand-red"
                    : "border-rule-strong text-ink hover:border-brand-red hover:text-brand-red"
            } ${className}`}
        >
            {heart}
            {saved ? "Saved" : "Add to Favourites"}
        </button>
    );
}
