// Star rating display. Server component — no state, no interaction.
//
// The stars are drawn as a single SVG per star rather than a font glyph, so
// they render identically everywhere and a half star is possible.

const STAR_PATH =
    "M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4 6.2 20.45l1.1-6.5-4.7-4.6 6.5-.95z";

function Star({ fill, size }) {
    // A gradient id must be unique per fill level, or two stars on the same page
    // with different fills would share the first one's definition.
    const id = `star-${Math.round(fill * 100)}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="shrink-0"
        >
            {fill > 0 && fill < 1 ? (
                <defs>
                    <linearGradient id={id}>
                        <stop offset={`${fill * 100}%`} stopColor="var(--color-accent)" />
                        <stop offset={`${fill * 100}%`} stopColor="transparent" />
                    </linearGradient>
                </defs>
            ) : null}

            <path
                d={STAR_PATH}
                fill={fill >= 1 ? "var(--color-accent)" : fill > 0 ? `url(#${id})` : "transparent"}
                stroke="var(--color-accent)"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function Stars({ rating = 0, count, size = 16, showValue = false }) {
    const value = Number(rating) || 0;

    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="inline-flex items-center gap-0.5"
                role="img"
                aria-label={`${value.toFixed(1)} out of 5 stars`}
            >
                {[0, 1, 2, 3, 4].map((index) => (
                    <Star
                        key={index}
                        size={size}
                        fill={Math.max(0, Math.min(1, value - index))}
                    />
                ))}
            </span>

            {showValue && value > 0 ? (
                <span className="text-[0.8125rem] text-ink-soft">{value.toFixed(1)}</span>
            ) : null}

            {count !== undefined ? (
                <span className="text-[0.8125rem] text-ink-faint">
                    {count === 0
                        ? "No reviews yet"
                        : `(${count} ${count === 1 ? "review" : "reviews"})`}
                </span>
            ) : null}
        </span>
    );
}
