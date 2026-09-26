import Link from "next/link";
import Image from "next/image";

// The two large cards on the home page — Mattresses and PU Foam — each opening
// the catalogue pre-filtered.
export default function CategoryCard({ group }) {
    return (
        <Link
            href={`/products?group=${group.key}`}
            className="group flex flex-col border border-rule bg-surface transition-colors hover:border-rule-strong"
        >
            <div className="relative aspect-16/9 overflow-hidden bg-panel">
                <Image
                    // Mattresses have real photography; foam does not yet.
                    src={
                        group.key === "mattress"
                            ? "/images/products/mattress-photo-1.jpg"
                            : `/images/products/${group.key}-1.svg`
                    }
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
            </div>

            <div className="flex flex-1 flex-col p-7 sm:p-9">
                <h3 className="display mb-3 text-[1.875rem]">{group.title}</h3>

                <p className="mb-6 text-[0.9375rem] leading-7 text-ink-soft">
                    {group.description}
                </p>

                <div className="mb-7 flex flex-wrap gap-2">
                    {group.categories.map((category) => (
                        <span
                            key={category}
                            className="border border-rule bg-panel px-3 py-1.5 text-[0.8125rem] text-ink-muted"
                        >
                            {category}
                        </span>
                    ))}
                </div>

                <span className="mt-auto inline-flex items-center gap-2 text-[0.875rem] text-navy transition-colors group-hover:text-brand-red">
                    View the range
                    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
                        <path
                            d="M0 5h14M10 1l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            fill="none"
                        />
                    </svg>
                </span>
            </div>
        </Link>
    );
}
