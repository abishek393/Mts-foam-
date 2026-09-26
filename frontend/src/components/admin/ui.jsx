import Link from "next/link";

// Small presentational pieces shared by every admin section. Server components
// — none of them hold state.

export function PageHeader({ eyebrow, title, count, children }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
            <div>
                {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}

                <h1 className="display text-[1.875rem] sm:text-[2.25rem]">
                    {title}
                    {count !== undefined ? (
                        <span className="ml-2 text-ink-faint">({count})</span>
                    ) : null}
                </h1>
            </div>

            {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
        </div>
    );
}

// A bordered panel — the panel's only container idiom.
export function Panel({ title, action, children, className = "" }) {
    return (
        <section className={`border border-rule bg-surface ${className}`}>
            {title ? (
                <header className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3.5">
                    <h2 className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                        {title}
                    </h2>

                    {action}
                </header>
            ) : null}

            {children}
        </section>
    );
}

export function EmptyState({ title, body }) {
    return (
        <div className="px-6 py-16 text-center">
            <p className="mb-2 text-[1.0625rem] text-ink">{title}</p>

            {body ? (
                <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                    {body}
                </p>
            ) : null}
        </div>
    );
}

// Horizontal scroll lives on the table's own wrapper so the page body never
// scrolls sideways on a narrow screen.
export function TableWrap({ children }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
                {children}
            </table>
        </div>
    );
}

export function Th({ children, className = "" }) {
    return (
        <th
            scope="col"
            className={`table-head border-b border-rule px-4 py-3 font-normal ${className}`}
        >
            {children}
        </th>
    );
}

export function Td({ children, className = "" }) {
    return (
        <td className={`border-b border-rule px-4 py-3 align-top text-[0.875rem] ${className}`}>
            {children}
        </td>
    );
}

// ─── Status pills ────────────────────────────────────────────────────────────

// Every workflow status across the panel, mapped to one of four visual weights
// so that "needs attention" always looks the same wherever it appears.
const TONES = {
    attention: "border-brand-red text-brand-red",
    active: "border-navy text-navy",
    progress: "border-accent text-accent",
    done: "border-rule-strong text-ink-faint",
};

const STATUS_TONE = {
    // Inquiries
    new: "attention",
    contacted: "active",
    quoted: "progress",
    closed: "done",
    // Orders
    pending: "attention",
    confirmed: "active",
    processing: "progress",
    completed: "done",
    cancelled: "done",
    // Applications
    verified: "active",
    rejected: "done",
    on_hold: "progress",
    // Records
    active: "active",
    inactive: "done",
    featured: "progress",
};

const STATUS_LABEL = {
    new: "New",
    contacted: "Contacted",
    quoted: "Quoted",
    closed: "Closed",
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
    verified: "Verified",
    rejected: "Rejected",
    on_hold: "On hold",
    active: "Active",
    inactive: "Inactive",
};

export function StatusPill({ status, label }) {
    const tone = TONES[STATUS_TONE[status]] ?? TONES.done;

    return (
        <span
            className={`inline-block whitespace-nowrap border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ${tone}`}
        >
            {label ?? STATUS_LABEL[status] ?? status}
        </span>
    );
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatDateTime(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function fullName(person) {
    if (!person) return "—";
    return `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "—";
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

// Filters are plain links that set a search param, so the whole panel works
// without client-side state and every filtered view is a shareable URL.
export function FilterTabs({ basePath, param = "status", current, options }) {
    return (
        <div className="mb-5 flex flex-wrap gap-1.5">
            {options.map((option) => {
                const selected = (current ?? "") === option.value;
                const href = option.value ? `${basePath}?${param}=${option.value}` : basePath;

                return (
                    <Link
                        key={option.value || "all"}
                        href={href}
                        aria-current={selected ? "true" : undefined}
                        className={`border px-3 py-1.5 text-[0.8125rem] transition-colors ${
                            selected
                                ? "border-navy bg-navy text-white"
                                : "border-rule bg-surface text-ink-muted hover:border-ink"
                        }`}
                    >
                        {option.label}
                        {option.count !== undefined ? (
                            <span className={selected ? "ml-1.5 text-white/60" : "ml-1.5 text-ink-faint"}>
                                {option.count}
                            </span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}
