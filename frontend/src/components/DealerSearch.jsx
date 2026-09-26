"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEALER_TYPES } from "@/lib/site";

// Directory filters, written to the URL like the catalogue's.
export default function DealerSearch({ cities = [] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const city = searchParams.get("city") ?? "";
    const type = searchParams.get("type") ?? "";
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

        // Keep the reader at the directory rather than jumping to the top.
        router.push(query ? `${pathname}?${query}#find-a-dealer` : pathname, {
            scroll: false,
        });
    };

    return (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-y border-rule py-5">
            <div>
                <label htmlFor="dealer-city" className="table-head mb-2 block">
                    City
                </label>

                <select
                    id="dealer-city"
                    value={city}
                    onChange={(event) => apply({ city: event.target.value })}
                    className="min-w-[10rem] border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink"
                >
                    <option value="">All cities</option>

                    {cities.map((entry) => (
                        <option key={entry} value={entry}>
                            {entry}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="dealer-type" className="table-head mb-2 block">
                    Type
                </label>

                <select
                    id="dealer-type"
                    value={type}
                    onChange={(event) => apply({ type: event.target.value })}
                    className="min-w-[10rem] border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink"
                >
                    <option value="">All types</option>

                    {Object.entries(DEALER_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    const value = new FormData(event.currentTarget).get("search");
                    apply({ search: value.trim() });
                }}
            >
                <label htmlFor="dealer-search" className="table-head mb-2 block">
                    Search
                </label>

                <div className="flex">
                    {/* Uncontrolled and keyed on the URL value — see ProductFilter. */}
                    <input
                        key={search}
                        id="dealer-search"
                        name="search"
                        type="search"
                        defaultValue={search}
                        placeholder="Business or area"
                        className="w-full border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink placeholder:text-ink-faint sm:w-52"
                    />

                    <button
                        type="submit"
                        className="border border-l-0 border-rule bg-panel px-4 text-[0.8125rem] text-ink transition-colors hover:bg-rule"
                    >
                        Go
                    </button>
                </div>
            </form>

            {city || type || search ? (
                <button
                    type="button"
                    onClick={() => router.push(pathname, { scroll: false })}
                    className="pb-2 text-[0.8125rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                >
                    Clear
                </button>
            ) : null}
        </div>
    );
}
