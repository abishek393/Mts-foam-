import { getMyReports } from "@/lib/marketer";
import { PageHeader, Panel, EmptyState, formatDate } from "@/components/admin/ui";
import DailyReportForm from "@/components/marketer/DailyReportForm";

export const metadata = { title: "My reports" };

export default async function MarketerReportsPage() {
    const { reports, today } = await getMyReports();

    // Pre-fills the form when today has already been reported, so filing again
    // reads as editing rather than starting over.
    const todays = reports.find((report) => report.reportDate === today);

    return (
        <>
            <PageHeader eyebrow="Field sales" title="Daily report" />

            <DailyReportForm today={today} existing={todays} />

            <div className="mt-10">
                <Panel title={`Filed reports (${reports.length})`}>
                    {reports.length === 0 ? (
                        <EmptyState
                            title="No reports filed yet."
                            body="Your first one will appear here once you file it."
                        />
                    ) : (
                        <ul className="divide-y divide-rule">
                            {reports.map((report) => (
                                <li key={report.id} className="px-5 py-4">
                                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
                                        <span className="text-[0.9375rem] text-ink">
                                            {formatDate(report.reportDate)}
                                        </span>

                                        <span className="text-[0.8125rem] text-ink-faint">
                                            {report.visitsCount} visits · {report.ordersTaken} orders
                                        </span>
                                    </div>

                                    <p className="text-[0.9375rem] leading-6 text-ink-soft">
                                        {report.summary}
                                    </p>

                                    {/* The marketer sees the office's note on their
                                        own report — otherwise feedback goes nowhere. */}
                                    {report.adminNote ? (
                                        <p className="mt-2 border-l-2 border-accent pl-3 text-[0.875rem] leading-6 text-ink-muted">
                                            Office: {report.adminNote}
                                        </p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </>
    );
}
