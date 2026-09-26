import { getAllReports } from "@/lib/marketer";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import ReportList from "@/components/admin/ReportList";

export const metadata = { title: "Field reports" };

export default async function AdminReportsPage({ searchParams }) {
    const params = await searchParams;

    const filters = {
        marketerId: typeof params?.marketerId === "string" ? params.marketerId : "",
        from: typeof params?.from === "string" ? params.from : "",
        to: typeof params?.to === "string" ? params.to : "",
    };

    const { reports, marketers } = await getAllReports(filters);

    return (
        <>
            <PageHeader eyebrow="Field sales" title="Daily reports" count={reports.length} />

            {marketers.length > 0 ? (
                <FilterTabs
                    basePath="/admin/reports"
                    param="marketerId"
                    current={filters.marketerId}
                    options={[
                        { value: "", label: "Everyone" },
                        ...marketers.map((marketer) => ({
                            value: String(marketer.id),
                            label: `${marketer.firstName} ${marketer.lastName}`,
                        })),
                    ]}
                />
            ) : null}

            {/* A plain GET form, so a date range is a URL that can be bookmarked
                or pasted to somebody else. */}
            <form action="/admin/reports" className="mb-6 flex flex-wrap items-end gap-3">
                {filters.marketerId ? (
                    <input type="hidden" name="marketerId" value={filters.marketerId} />
                ) : null}

                <div>
                    <label
                        htmlFor="from"
                        className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
                    >
                        From
                    </label>
                    <input
                        id="from"
                        type="date"
                        name="from"
                        defaultValue={filters.from}
                        className="border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink focus:border-navy"
                    />
                </div>

                <div>
                    <label
                        htmlFor="to"
                        className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
                    >
                        To
                    </label>
                    <input
                        id="to"
                        type="date"
                        name="to"
                        defaultValue={filters.to}
                        className="border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink focus:border-navy"
                    />
                </div>

                <button
                    type="submit"
                    className="border border-rule-strong bg-surface px-4 py-2 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Apply
                </button>
            </form>

            {reports.length === 0 ? (
                <Panel>
                    <EmptyState
                        title={
                            marketers.length === 0
                                ? "No marketers yet."
                                : "No reports for that selection."
                        }
                        body={
                            marketers.length === 0
                                ? "Create an account with the Marketer role in Accounts, and their daily reports will appear here."
                                : "Try a different person or date range."
                        }
                    />
                </Panel>
            ) : (
                <ReportList reports={reports} filters={filters} />
            )}
        </>
    );
}
