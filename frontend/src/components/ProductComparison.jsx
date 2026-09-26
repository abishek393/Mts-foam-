"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE, productImage } from "@/lib/api";
import {
    clearCompare,
    removeFromCompare,
    replaceCompare,
    useCompare,
    MAX_COMPARE,
} from "@/lib/compare";
import InquiryButton from "./InquiryButton";
import Button from "./Button";

// Rows compared, per the design document: category, firmness, thickness,
// available sizes, core or density, and a one-line summary.
const ROWS = [
    { label: "Category", get: (p) => p.category },
    { label: "Firmness", get: (p) => p.firmness },
    { label: "Density", get: (p) => p.density },
    { label: "Thickness", get: (p) => p.thicknesses?.join(", ") },
    { label: "Sizes", get: (p) => p.sizes?.join(" · ") },
    { label: "Core", get: (p) => p.coreSpec },
    { label: "Summary", get: (p) => p.shortDescription },
];

export default function ProductComparison() {
    const slugs = useCompare();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Results are stored with the selection they were fetched for, so "loading"
    // is derived rather than tracked as its own flag.
    const [fetched, setFetched] = useState({ key: "", products: [] });

    // A ?slugs= link takes precedence on first load, so a comparison can be
    // shared with someone else.
    const shared = searchParams.get("slugs");

    useEffect(() => {
        if (!shared) return;

        replaceCompare(shared.split(","));
        router.replace("/compare", { scroll: false });
    }, [shared, router]);

    // Join on slug so a removed product disappears immediately, without having
    // to clear fetched state separately.
    const key = slugs.join(",");

    useEffect(() => {
        if (!key) return undefined;

        let cancelled = false;

        fetch(`${API_BASE}/api/products/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: key.split(",") }),
        })
            .then((res) => (res.ok ? res.json() : { products: [] }))
            .then((data) => {
                if (!cancelled) setFetched({ key, products: data.products ?? [] });
            })
            .catch(() => {
                if (!cancelled) setFetched({ key, products: [] });
            });

        return () => {
            cancelled = true;
        };
    }, [key]);

    const loading = Boolean(key) && fetched.key !== key;

    // Render only what is still selected, in the selected order. A product
    // removed from the selection disappears at once, without a refetch.
    const products = slugs
        .map((slug) => fetched.products.find((product) => product.slug === slug))
        .filter(Boolean);

    if (slugs.length === 0) {
        return (
            <div className="mt-12 border border-rule bg-panel px-6 py-20 text-center">
                <p className="display mb-3 text-[1.75rem]">Nothing selected yet</p>

                <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                    Add up to three products using the “Add to compare” control on any
                    catalogue card or product page.
                </p>

                <Button href="/products" variant="primary">
                    Browse the catalogue
                </Button>
            </div>
        );
    }

    // Skip rows where none of the selected products has a value — comparing
    // three foam grades shouldn't show an empty "Firmness" row.
    const rows = ROWS.filter((row) => products.some((product) => row.get(product)));

    return (
        <div className="mt-12">
            <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-[0.875rem] text-ink-muted">
                    Comparing {slugs.length} of {MAX_COMPARE}
                </p>

                <div className="flex items-center gap-4">
                    <ShareLink slugs={slugs} />

                    <button
                        type="button"
                        onClick={clearCompare}
                        className="text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse">
                    <thead>
                        <tr>
                            <th scope="col" className="w-40" />

                            {products.map((product) => (
                                <th
                                    key={product.id}
                                    scope="col"
                                    className="border-b border-rule p-4 text-left align-top"
                                >
                                    <div className="relative mb-4 aspect-4/3 overflow-hidden border border-rule bg-panel">
                                        <Image
                                            src={productImage(product)}
                                            alt={product.name}
                                            fill
                                            sizes="30vw"
                                            className="object-cover"
                                        />
                                    </div>

                                    <p className="table-head mb-1.5">{product.category}</p>

                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="display block text-[1.25rem] transition-colors hover:text-navy"
                                    >
                                        {product.name}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCompare(product.slug)}
                                        className="mt-2 text-[0.8125rem] font-normal text-ink-faint underline underline-offset-4 transition-colors hover:text-brand-red"
                                    >
                                        Remove
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label} className="border-b border-rule">
                                <th
                                    scope="row"
                                    className="table-head py-4 pr-4 text-left align-top font-normal"
                                >
                                    {row.label}
                                </th>

                                {products.map((product) => (
                                    <td
                                        key={product.id}
                                        className="p-4 align-top text-[0.9375rem] leading-7 text-ink"
                                    >
                                        {row.get(product) || (
                                            <span className="text-ink-faint">—</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        <tr>
                            <th scope="row" className="table-head py-5 pr-4 text-left font-normal">
                                Inquire
                            </th>

                            {products.map((product) => (
                                <td key={product.id} className="p-4 align-top">
                                    <InquiryButton
                                        productId={product.id}
                                        productName={product.name}
                                        source="compare"
                                        size="sm"
                                    />
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {loading ? (
                <p className="mt-6 text-[0.875rem] text-ink-faint">Loading…</p>
            ) : null}

            <div className="mt-10 border-t border-rule pt-8">
                <InquiryButton
                    source="compare"
                    message={`Inquiry about: ${products.map((p) => p.name).join(", ")}`}
                    size="lg"
                >
                    Send inquiry about these
                </InquiryButton>
            </div>
        </div>
    );
}

function ShareLink({ slugs }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            type="button"
            onClick={async () => {
                const url = `${window.location.origin}/compare?slugs=${slugs.join(",")}`;

                try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch {
                    // Clipboard blocked — fall back to putting it in the URL bar.
                    window.location.search = `?slugs=${slugs.join(",")}`;
                }
            }}
            className="text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-navy"
        >
            {copied ? "Link copied" : "Copy link"}
        </button>
    );
}
