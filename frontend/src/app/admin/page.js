import Link from "next/link";
import { getStats } from "@/lib/admin";
import {
    PageHeader,
    Panel,
    EmptyState,
    StatusPill,
    TableWrap,
    Th,
    Td,
    formatDate,
    fullName,
} from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

// The three counts worth chasing: work that has not been looked at yet.
function Attention({ label, value, href, tone = "attention" }) {
    const border = tone === "attention" && value > 0 ? "border-brand-red" : "border-rule";
    const ink = tone === "attention" && value > 0 ? "text-brand-red" : "text-ink";

    return (
        <Link
            href={href}
            className={`block border ${border} bg-surface px-5 py-6 transition-colors hover:border-ink`}
        >
            <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                {label}
            </p>

            <p className={`display mt-2 text-[2.25rem] leading-none ${ink}`}>{value}</p>
        </Link>
    );
}

// A compact "3 active / 12 total" line for the catalogue counters.
function Tally({ label, primary, secondary, href }) {
    return (
        <Link
            href={href}
            className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-3 transition-colors last:border-b-0 hover:bg-panel"
        >
            <span className="text-[0.875rem] text-ink">{label}</span>

            <span className="text-[0.875rem] text-ink-muted">
                <span className="text-ink">{primary}</span>
                {secondary !== undefined ? ` / ${secondary}` : null}
            </span>
        </Link>
    );
}

export default async function AdminDashboard() {
    const { stats, recentInquiries, recentOrders } = await getStats();

    const openInquiries = (stats.inquiries.new ?? 0) + (stats.inquiries.contacted ?? 0);
    const openOrders = (stats.orders.pending ?? 0) + (stats.orders.confirmed ?? 0);

    return (
        <>
            <PageHeader eyebrow="Overview" title="Dashboard" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Attention
                    label="New inquiries"
                    value={stats.inquiries.new ?? 0}
                    href="/admin/inquiries?status=new"
                />

                <Attention
                    label="Pending orders"
                    value={stats.orders.pending ?? 0}
                    href="/admin/orders?status=pending"
                />

                <Attention
                    label="Applications to review"
                    value={stats.applications.pending ?? 0}
                    href="/admin/applications?status=pending"
                />

                <Attention
                    label="Open work"
                    value={openInquiries + openOrders}
                    href="/admin/inquiries"
                    tone="neutral"
                />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <Panel title="Catalogue">
                    <Tally
                        label="Products active"
                        primary={stats.products.active}
                        secondary={stats.products.total}
                        href="/admin/products?status=active"
                    />
                    <Tally
                        label="Products withdrawn"
                        primary={stats.products.inactive}
                        href="/admin/products?status=inactive"
                    />
                    <Tally
                        label="Featured on the home page"
                        primary={stats.products.featured}
                        href="/admin/products"
                    />
                    <Tally
                        label="Offers running"
                        primary={stats.offers.active}
                        secondary={stats.offers.total}
                        href="/admin/offers?status=active"
                    />
                </Panel>

                <Panel title="Network">
                    <Tally
                        label="Dealers listed"
                        primary={stats.dealers.active}
                        secondary={stats.dealers.total}
                        href="/admin/dealers?status=active"
                    />
                    <Tally
                        label="Applications pending"
                        primary={stats.applications.pending ?? 0}
                        href="/admin/applications?status=pending"
                    />
                    <Tally
                        label="Applications verified"
                        primary={stats.applications.verified ?? 0}
                        href="/admin/applications?status=verified"
                    />
                    <Tally
                        label="Applications rejected"
                        primary={stats.applications.rejected ?? 0}
                        href="/admin/applications?status=rejected"
                    />
                </Panel>

                <Panel title="Accounts">
                    <Tally
                        label="Customers"
                        primary={stats.users.customer ?? 0}
                        href="/admin/users"
                    />
                    <Tally
                        label="Dealers with a login"
                        primary={stats.users.dealer ?? 0}
                        href="/admin/users"
                    />
                    <Tally
                        label="Employees"
                        primary={stats.users.employee ?? 0}
                        href="/admin/users"
                    />
                    <Tally
                        label="Administrators"
                        primary={stats.users.admin ?? 0}
                        href="/admin/users"
                    />
                </Panel>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
                <Panel
                    title="Latest inquiries"
                    action={
                        <Link
                            href="/admin/inquiries"
                            className="text-[0.8125rem] text-navy underline underline-offset-4 hover:text-brand-red"
                        >
                            All inquiries
                        </Link>
                    }
                >
                    {recentInquiries.length === 0 ? (
                        <EmptyState title="No inquiries yet." />
                    ) : (
                        <TableWrap>
                            <thead>
                                <tr>
                                    <Th>Customer</Th>
                                    <Th>About</Th>
                                    <Th>Status</Th>
                                    <Th>Received</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentInquiries.map((inquiry) => (
                                    <tr key={inquiry.id}>
                                        <Td>
                                            <span className="block text-ink">
                                                {fullName(inquiry.customer)}
                                            </span>
                                            <span className="block text-[0.8125rem] text-ink-faint">
                                                {inquiry.customer?.email}
                                            </span>
                                        </Td>
                                        <Td className="text-ink-soft">
                                            {inquiry.productLabel ?? "General inquiry"}
                                        </Td>
                                        <Td>
                                            <StatusPill status={inquiry.status} />
                                        </Td>
                                        <Td className="whitespace-nowrap text-ink-muted">
                                            {formatDate(inquiry.createdAt)}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableWrap>
                    )}
                </Panel>

                <Panel
                    title="Latest orders"
                    action={
                        <Link
                            href="/admin/orders"
                            className="text-[0.8125rem] text-navy underline underline-offset-4 hover:text-brand-red"
                        >
                            All orders
                        </Link>
                    }
                >
                    {recentOrders.length === 0 ? (
                        <EmptyState title="No orders yet." />
                    ) : (
                        <TableWrap>
                            <thead>
                                <tr>
                                    <Th>Reference</Th>
                                    <Th>Customer</Th>
                                    <Th>Lines</Th>
                                    <Th>Status</Th>
                                    <Th>Placed</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <Td className="whitespace-nowrap font-mono text-[0.8125rem] text-ink">
                                            {order.orderNumber}
                                        </Td>
                                        <Td>{fullName(order.customer)}</Td>
                                        <Td className="text-ink-muted">
                                            {order.items?.length ?? 0}
                                        </Td>
                                        <Td>
                                            <StatusPill status={order.status} />
                                        </Td>
                                        <Td className="whitespace-nowrap text-ink-muted">
                                            {formatDate(order.createdAt)}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableWrap>
                    )}
                </Panel>
            </div>

            <p className="mt-8 border-t border-rule pt-5 text-[0.8125rem] leading-6 text-ink-faint">
                No prices or payments exist anywhere on this site. An order is a
                specified request that 4STAR quotes against, which is why orders carry
                line items but no totals.
            </p>
        </>
    );
}
