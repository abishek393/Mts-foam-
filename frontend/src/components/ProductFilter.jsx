"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_GROUPS } from "@/lib/site";

// Filters write to the URL rather than to local state, so a filtered catalogue
// is shareable and the back button behaves.
export default function ProductFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const group = searchParams.get("group") ?? "";
    const category = searchParams.get("category") ?? "";
    const search = searchParams.get("search") ?? "";

    const apply = (changes) => {
        const params = new URLSearchParams(searchParams);

        for (const [key, value] of Object.entries(changes)) {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }

        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    // Only offer categories belonging to the selected group.
    const categories = group
        ? (PRODUCT_GROUPS.find((entry) => entry.key === group)?.categories ?? [])
        : PRODUCT_GROUPS.flatMap((entry) => entry.categories);

    const hasFilters = Boolean(group || category || search);

    return (
        <div className="border-y border-rule py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
                    <div>
                        <p className="table-head mb-2.5">Group</p>

                        <div className="flex flex-wrap gap-2">
                            <FilterChip
                                active={!group}
                                // Clearing the group also clears a category that
                                // may no longer belong to it.
                                onClick={() => apply({ group: "", category: "" })}
                            >
                                All
                            </FilterChip>

                            {PRODUCT_GROUPS.map((entry) => (
                                <FilterChip
                                    key={entry.key}
                                    active={group === entry.key}
                                    onClick={() => apply({ group: entry.key, category: "" })}
                                >
                                    {entry.title}
                                </FilterChip>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="category-filter"
                            className="table-head mb-2.5 block"
                        >
                            Category
                        </label>

                        <select
                            id="category-filter"
                            value={category}
                            onChange={(event) => apply({ category: event.target.value })}
                            className="min-w-[11rem] border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink"
                        >
                            <option value="">All categories</option>

                            {categories.map((entry) => (
                                <option key={entry} value={entry}>
                                    {entry}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-end gap-3">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const value = new FormData(event.currentTarget).get("search");
                            apply({ search: value.trim() });
                        }}
                    >
                        <label htmlFor="product-search" className="table-head mb-2.5 block">
                            Search
                        </label>

                        <div className="flex">
                            {/* Uncontrolled and keyed on the URL value, so the URL
                                stays the single source of truth and the box resets
                                when the query changes from elsewhere — the back
                                button, or a category card on the home page. */}
                            <input
                                key={search}
                                id="product-search"
                                name="search"
                                type="search"
                                defaultValue={search}
                                placeholder="Product or category"
                                className="w-full border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink placeholder:text-ink-faint sm:w-56"
                            />

                            <button
                                type="submit"
                                className="border border-l-0 border-rule bg-panel px-4 text-[0.8125rem] text-ink transition-colors hover:bg-rule"
                            >
                                Go
                            </button>
                        </div>
                    </form>

                    {hasFilters ? (
                        <button
                            type="button"
                            onClick={() => router.push(pathname, { scroll: false })}
                            className="pb-2 text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                        >
                            Clear
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function FilterChip({ active, children, ...props }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={`border px-4 py-2 text-[0.8125rem] transition-colors ${
                active
                    ? "border-navy bg-navy text-white"
                    : "border-rule-strong text-ink hover:bg-panel"
            }`}
            {...props}
        >
            {children}
        </button>
    );
}
