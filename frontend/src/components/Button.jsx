import Link from "next/link";

// Squared-off buttons with hairline borders, matching the document's print feel.
const VARIANTS = {
    primary:
        "bg-navy text-white border border-navy hover:bg-navy-dark hover:border-navy-dark",
    secondary:
        "bg-transparent text-ink border border-rule-strong hover:border-ink hover:bg-panel",
    accent:
        "bg-brand-red text-white border border-brand-red hover:brightness-95",
    ghost:
        "bg-transparent text-ink border border-transparent hover:border-rule-strong",
    onDark:
        "bg-transparent text-white border border-white/40 hover:bg-white hover:text-band",
};

const SIZES = {
    sm: "px-4 py-2 text-[0.8125rem]",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-3.5 text-[0.9375rem]",
};

const base =
    "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

export default function Button({
    children,
    href,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const classes = `${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`;

    if (href) {
        return (
            <Link href={href} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
