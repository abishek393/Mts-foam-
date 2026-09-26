"use client";

// A plain GET form, so a search is just a URL the admin can bookmark or share
// and the page stays a server component.
export default function AdminSearch({
    basePath,
    defaultValue = "",
    keep = {},
    placeholder = "Search",
}) {
    return (
        <form action={basePath} className="flex items-stretch">
            {/* Carries the current filter through, so searching does not
                silently reset the status tab. */}
            {Object.entries(keep).map(([name, value]) =>
                value ? <input key={name} type="hidden" name={name} value={value} /> : null
            )}

            <label htmlFor="admin-search" className="sr-only">
                {placeholder}
            </label>

            <input
                id="admin-search"
                type="search"
                name="search"
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="w-56 border border-rule bg-surface px-3 py-1.5 text-[0.875rem] text-ink placeholder:text-ink-faint focus:border-navy"
            />

            <button
                type="submit"
                className="border border-l-0 border-rule-strong bg-surface px-4 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
            >
                Search
            </button>
        </form>
    );
}
