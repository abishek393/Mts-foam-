import Reveal from "./Reveal";

// The document's recurring section header: a small-caps tan eyebrow above a
// large serif heading, optionally with a paragraph of supporting copy.
//
// Revealing here rather than at each call site covers every public page at
// once — this component opens almost all of them.
export default function SectionHeading({
    eyebrow,
    title,
    children,
    align = "left",
    className = "",
}) {
    const alignment = align === "center" ? "text-center mx-auto" : "text-left";

    return (
        <Reveal as="header" className={`${alignment} ${className}`}>
            {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}

            <h2 className="display text-[2rem] sm:text-[2.5rem] lg:text-[3rem]">
                {title}
            </h2>

            {children ? (
                <div
                    className={`mt-5 max-w-2xl text-[0.9375rem] leading-7 text-ink-soft ${
                        align === "center" ? "mx-auto" : ""
                    }`}
                >
                    {children}
                </div>
            ) : null}
        </Reveal>
    );
}
