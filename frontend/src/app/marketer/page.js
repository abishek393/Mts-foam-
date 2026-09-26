import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMyReports, getMyFieldOrders } from "@/lib/marketer";
import { PageHeader, Panel, EmptyState, formatDate } from "@/components/admin/ui";

export const metadata = { title: "Today" };

export default async function MarketerHome() {
    // The session is read first, on its own. A page and its layout render in
    // parallel, so this runs before the layout's redirect has had any effect —
    // fetching the marketer's reports as nobody would only produce a 401, and
    // reading a name off a null session would crash the render.
    const user = await getSession();

    if (!user) redirect("/login?next=/marketer");

    const [{ reports, today }, orders] = await Promise.all([
        getMyReports(),
        getMyFieldOrders(),
    ]);

    const filedToday = reports.some((report) => report.reportDate === today);

    const thisMonth = reports.filter(
        (report) => report.reportDate?.slice(0, 7) === today?.slice(0, 7)
    );

    const visits = thisMonth.reduce((sum, report) => sum + report.visitsCount, 0);
    const taken = thisMonth.reduce((sum, report) => sum + report.ordersTaken, 0);

    return (
        <>
            <PageHeader eyebrow="Field sales" title={`Hello, ${user.firstName}`} />

            {/* The one thing that has to happen every day, said first and in red
                until it is done. */}
            <div
                className={`mb-8 border px-5 py-5 ${
                    filedToday ? "border-rule bg-surface" : "border-brand-red bg-brand-red/5"
                }`}
            >
                <p className="mb-1 text-[1.0625rem] text-ink">
                    {filedToday
                        ? "Today's report is filed."
                        : "You haven't filed today's report yet."}
                </p>

                <p className="mb-4 text-[0.9375rem] leading-6 text-ink-muted">
                    {filedToday
                        ? "You can still update it if anything changed."
                        : "File it at the end of the day — it takes a minute."}
                </p>

                <Link
                    href="/marketer/reports"
                    className="inline-block border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                >
                    {filedToday ? "Update today's report" : "File today's report"}
                </Link>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {[
                    ["Reports this month", thisMonth.length],
                    ["Shops visited", visits],
                    ["Orders taken", taken],
                ].map(([label, value]) => (
                    <div key={label} className="border border-rule bg-surface px-5 py-5">
                        <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                            {label}
                        </p>
                        <p className="display mt-2 text-[2rem] leading-none">{value}</p>
                    </div>
                ))}
            </div>

            <Panel
                title="Your latest orders"
                action={
                    <Link
                        href="/marketer/orders"
                        className="text-[0.8125rem] text-navy underline underline-offset-4 hover:text-brand-red"
                    >
                        Place an order
                    </Link>
                }
            >
                {orders.length === 0 ? (
                    <EmptyState
                        title="No orders taken yet."
                        body="When you record an order at a shop, it appears here and goes straight to the office."
                    />
                ) : (
                    <ul className="divide-y divide-rule">
                        {orders.slice(0, 6).map((order) => (
                            <li
                                key={order.id}
                                className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3.5"
                            >
                                <div>
                                    <span className="font-mono text-[0.8125rem] text-ink">
                                        {order.orderNumber}
                                    </span>
                                    <span className="ml-3 text-[0.9375rem] text-ink-soft">
                                        {order.customerBusiness || order.contactName}
                                    </span>
                                </div>

                                <span className="text-[0.8125rem] text-ink-faint">
                                    {order.items?.length ?? 0}{" "}
                                    {order.items?.length === 1 ? "line" : "lines"} ·{" "}
                                    {formatDate(order.createdAt)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </>
    );
}
