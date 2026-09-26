import Button from "./Button";

// The recurring call-to-action band. `dark` renders the near-black variant used
// for the manufacturing and dealer sections.
export default function CTASection({
    eyebrow,
    title,
    body,
    primary,
    secondary,
    dark = false,
    className = "",
}) {
    return (
        <section
            className={`border px-6 py-14 sm:px-12 sm:py-16 ${
                dark ? "border-band bg-band" : "border-rule bg-panel"
            } ${className}`}
        >
            <div className="mx-auto max-w-3xl text-center">
                {eyebrow ? (
                    <p className={`eyebrow mb-4 ${dark ? "text-accent-soft" : ""}`}>
                        {eyebrow}
                    </p>
                ) : null}

                <h2
                    className={`display text-[1.875rem] sm:text-[2.5rem] ${
                        dark ? "text-white" : ""
                    }`}
                >
                    {title}
                </h2>

                {body ? (
                    <p
                        className={`mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-7 ${
                            dark ? "text-white/70" : "text-ink-soft"
                        }`}
                    >
                        {body}
                    </p>
                ) : null}

                <div className="mt-9 flex flex-wrap justify-center gap-3">
                    {primary ? (
                        <Button
                            href={primary.href}
                            variant={dark ? "accent" : "primary"}
                            size="lg"
                        >
                            {primary.label}
                        </Button>
                    ) : null}

                    {secondary ? (
                        <Button
                            href={secondary.href}
                            variant={dark ? "onDark" : "secondary"}
                            size="lg"
                        >
                            {secondary.label}
                        </Button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
