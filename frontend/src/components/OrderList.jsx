import Link from "next/link";

export const ORDER_STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    quoted: "Quoted",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
};

const STATUS_STYLES = {
    pending: "border-navy text-navy",
    confirmed: "border-navy text-navy",
    quoted: "border-accent text-accent",
    processing: "border-accent text-accent",
    completed: "border-rule-strong text-ink-muted",
    cancelled: "border-rule-strong text-ink-faint",
};

// Shared by /orders and the summary on /account.
export default function OrderList({ orders }) {
    return (
        <div className="border-t border-rule">
            {orders.map((order) => {
                const units = order.items.reduce(
                    (total, item) => total + item.quantity,
                    0
                );

                return (
                    <article key={order.id} className="border-b border-rule py-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="display text-[1.25rem]">
                                    {order.orderNumber}
                                </h3>

                                <span
                                    className={`border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ${
                                        STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                                    }`}
                                >
                                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                </span>
                            </div>

                            <p className="text-[0.8125rem] text-ink-faint">
                                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                        </div>

                        <p className="mb-4 text-[0.875rem] text-ink-muted">
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "line" : "lines"} · {units}{" "}
                            {units === 1 ? "unit" : "units"}
                        </p>

                        <ul className="space-y-2">
                            {order.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.9375rem]"
                                >
                                    <span className="text-ink">
                                        {item.product ? (
                                            <Link
                                                href={`/products/${item.product.slug}`}
                                                className="transition-colors hover:text-navy"
                                            >
                                                {item.productLabel}
                                            </Link>
                                        ) : (
                                            item.productLabel
                                        )}
                                    </span>

                                    <span className="text-ink-muted">
                                        ×{item.quantity}
                                    </span>

                                    {item.sizeLabel ? (
                                        <span className="text-[0.875rem] text-ink-faint">
                                            {item.sizeLabel}
                                        </span>
                                    ) : null}

                                    {item.thicknessIn ? (
                                        <span className="text-[0.875rem] text-ink-faint">
                                            {Number(item.thicknessIn)} in
                                        </span>
                                    ) : null}
                                </li>
                            ))}
                        </ul>

                        {order.deliveryAddress ? (
                            <p className="mt-4 text-[0.875rem] leading-6 text-ink-soft">
                                <span className="table-head mr-2">Deliver to</span>
                                {order.deliveryAddress}
                            </p>
                        ) : null}

                        {order.note ? (
                            <p className="mt-2 text-[0.875rem] leading-6 text-ink-soft">
                                <span className="table-head mr-2">Note</span>
                                {order.note}
                            </p>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}
