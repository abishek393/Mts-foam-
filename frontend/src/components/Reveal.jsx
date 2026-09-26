"use client";

import { useEffect, useRef, useState } from "react";

// Fades content up as it scrolls into view. Deliberately small — a 12px rise
// over 600ms — because the design is a printed brochure, and anything springier
// would read as a different product.
//
// The failure mode of every scroll-reveal is content stuck invisible, so this
// errs the other way at three points:
//   1. no IntersectionObserver  -> shown immediately
//   2. observer never fires     -> shown by a timer anyway
//   3. no JavaScript at all     -> shown by the <noscript> rule in the layout
// It can be wrong about *when* to show something. It cannot hide it forever.
export default function Reveal({
    children,
    delay = 0,
    as: Tag = "div",
    className = "",
    ...props
}) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) return;

        if (typeof IntersectionObserver === "undefined") {
            // Next tick rather than inline: setting state synchronously inside
            // an effect cascades an extra render.
            const immediate = setTimeout(() => setShown(true), 0);
            return () => clearTimeout(immediate);
        }

        // Already in view on first paint — above the fold, or a reload
        // partway down the page.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;

                    setShown(true);
                    observer.disconnect();
                }
            },
            // Starts slightly before the element reaches the viewport, so the
            // movement has finished by the time it is properly on screen.
            { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
        );

        observer.observe(node);

        // If the observer somehow never fires — a browser quirk, a display:none
        // ancestor that is later shown — the content appears regardless.
        const failsafe = setTimeout(() => setShown(true), 1200);

        return () => {
            observer.disconnect();
            clearTimeout(failsafe);
        };
    }, []);

    return (
        <Tag
            ref={ref}
            data-shown={shown ? "true" : "false"}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
            className={`reveal ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
}
