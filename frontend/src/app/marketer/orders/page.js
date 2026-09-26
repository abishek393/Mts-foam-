import { getProducts } from "@/lib/api";
import { getMyFieldOrders } from "@/lib/marketer";
import { PageHeader, Panel, EmptyState, formatDate } from "@/components/admin/ui";
import FieldOrderForm from "@/components/marketer/FieldOrderForm";

export const metadata = { title: "Place an order" };

export default async function MarketerOrdersPage() {
    const [products, orders] = await Promise.all([getProducts(), getMyFieldOrders()]);

    return (
        <>
            <PageHeader eyebrow="Field sales" title="Place an order" />

            <FieldOrderForm products={products} />

            <div className="mt-10">
                <Panel title={`Orders you have taken (${orders.length})`}>
                    {orders.length === 0 ? (
                        <EmptyState title="Nothing yet." />
                    ) : (
                        <ul className="divide-y divide-rule">
                            {orders.map((order) => (
                                <li key={order.id} className="px-5 py-4">
                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                        <span className="font-mono text-[0.8125rem] text-ink">
                                            {order.orderNumber}
                                        </span>

                                        <span className="text-[0.8125rem] text-ink-faint">
                                            {formatDate(order.createdAt)} · {order.status}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[0.9375rem] text-ink-soft">
                                        {order.customerBusiness || order.contactName} —{" "}
                                        {(order.items ?? [])
                                            .map((item) => `${item.productLabel} x${item.quantity}`)
                                            .join(", ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </>
    );
}
