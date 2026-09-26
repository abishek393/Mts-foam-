"use client";

import { useState } from "react";

// The interactive counterpart to Stars. Radio inputs under the hood, so it is
// keyboard operable and submits with a plain form — the stars are the label.

const STAR_PATH =
    "M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4 6.2 20.45l1.1-6.5-4.7-4.6 6.5-.95z";

const LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Excellent",
};

export default function StarPicker({ name = "rating", defaultValue = 0, size = 32 }) {
    const [value, setValue] = useState(defaultValue);
    const [hovered, setHovered] = useState(0);

    // Hovering previews without committing, so the filled count follows the
    // pointer but the chosen value only changes on click.
    const shown = hovered || value;

    return (
        <div>
            <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHovered(0)}
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <label
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        className="cursor-pointer p-0.5"
                        title={LABELS[star]}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={star}
                            checked={value === star}
                            onChange={() => setValue(star)}
                            className="sr-only"
                        />

                        <span className="sr-only">
                            {star} {star === 1 ? "star" : "stars"} — {LABELS[star]}
                        </span>

                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="block transition-transform hover:scale-110"
                        >
                            <path
                                d={STAR_PATH}
                                fill={star <= shown ? "var(--color-accent)" : "transparent"}
                                stroke="var(--color-accent)"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </label>
                ))}

                <span className="ml-3 text-[0.875rem] text-ink-muted">
                    {shown ? LABELS[shown] : "Choose a rating"}
                </span>
            </div>
        </div>
    );
}
