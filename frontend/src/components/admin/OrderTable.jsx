"use client";

import { useState } from "react";
import { updateOrder } from "@/app/admin/actions";
import WorkflowEditor from "./WorkflowEditor";
import PaymentReview from "./PaymentReview";
import { StatusPill, formatDateTime, fullName } from "./ui";

const STATUSES = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "quoted", label: "Quoted" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const COLUMNS = [
    "Reference",
    "Customer",
    "Lines",
    "Payment",
    "Assigned",
    "Status",
    "Placed",
];

// Mirrors PaymentReview, so the column and the panel never disagree.
const PAYMENT_LABELS = {
    unpaid: "Not paid",
    awaiting_verification: "Awaiting check",
    verified: "Verified",
    rejected: "Refused",
};

const PAYMENT_TONES = {
    unpaid: "inactive",
    awaiting_verification: "new",
    verified: "active",
    rejected: "cancelled",
};

const cell = "border-b border-rule px-4 py-3 align-top text-[0.875rem]";

// An order line's size — a preset label, or the dimensions from the calculator.
function itemSize(item) {
    if (item.sizeLabel) return item.sizeLabel;

    const { lengthIn, widthIn, thicknessIn } = item;
    if (!lengthIn && !widthIn) return null;

    const base = `${Number(widthIn ?? 0)} × ${Number(lengthIn ?? 0)} in`;
    return thicknessIn ? `${base}, ${Number(thicknessIn)} in thick` : base;
}

export default function OrderTable({ orders, assignees }) {
    const [openId, setOpenId] = useState(null);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
                <thead>
                    <tr>
                        {COLUMNS.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className="table-head border-b border-rule px-4 py-3 font-normal"
                            >
                                {column}
                            </th>
                        ))}

                        <th scope="col" className="border-b border-rule px-4 py-3">
                            <span className="sr-only">Manage</span>
                        </th>
                    </tr>
                </thead>

                {orders.map((order) => {
                    const open = openId === order.id;
                    const items = order.items ?? [];

                    return (
                        <tbody key={order.id} className={open ? "bg-panel" : undefined}>
                            <tr>
                                <td className={`${cell} whitespace-nowrap font-mono text-[0.8125rem] text-ink`}>
                                    {order.orderNumber}
                                </td>

                                <td className={cell}>
                                    <span className="block text-ink">{order.contactName}</span>
                                    <span className="block text-[0.8125rem] text-ink-faint">
                                        {order.contactEmail}
                                    </span>
                                    <span className="block text-[0.8125rem] text-ink-faint">
                                        {order.contactPhone}
                                    </span>
                                </td>

                                <td className={`${cell} text-ink-muted`}>{items.length}</td>

                                <td className={cell}>
                                    <StatusPill
                                        status={PAYMENT_TONES[order.paymentStatus ?? "unpaid"]}
                                        label={
                                            PAYMENT_LABELS[order.paymentStatus ?? "unpaid"]
                                        }
                                    />
                                </td>

                                <td className={`${cell} text-ink-muted`}>
                                    {order.assignee ? fullName(order.assignee) : "—"}
                                </td>

                                <td className={cell}>
                                    <StatusPill status={order.status} />
                                </td>

                                <td className={`${cell} whitespace-nowrap text-ink-muted`}>
                                    {formatDateTime(order.createdAt)}
                                </td>

                                <td className={`${cell} text-right`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(open ? null : order.id)}
                                        aria-expanded={open}
                                        className="whitespace-nowrap border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                    >
                                        {open ? "Close" : "Manage"}
                                    </button>
                                </td>
                            </tr>

                            {open ? (
                                <tr>
                                    <td colSpan={COLUMNS.length + 1} className="border-b border-rule px-4 pb-6 pt-1">
                                        <div className="grid gap-8 lg:grid-cols-2">
                                            <div>
                                                <p className="eyebrow mb-3">
                                                    Requested — {items.length}{" "}
                                                    {items.length === 1 ? "line" : "lines"}
                                                </p>

                                                <ul className="divide-y divide-rule border-y border-rule">
                                                    {items.map((item) => {
                                                        const size = itemSize(item);

                                                        return (
                                                            <li key={item.id} className="flex justify-between gap-4 py-3">
                                                                <div>
                                                                    <p className="text-[0.9375rem] text-ink">
                                                                        {item.productLabel}
                                                                    </p>

                                                                    {size ? (
                                                                        <p className="text-[0.8125rem] text-ink-muted">
                                                                            {size}
                                                                        </p>
                                                                    ) : null}

                                                                    {item.note ? (
                                                                        <p className="mt-1 text-[0.8125rem] text-ink-faint">
                                                                            {item.note}
                                                                        </p>
                                                                    ) : null}
                                                                </div>

                                                                <p className="shrink-0 text-[0.875rem] text-ink-muted">
                                                                    × {item.quantity}
                                                                </p>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                                <dl className="mt-4 space-y-2 text-[0.875rem]">
                                                    <div>
                                                        <dt className="text-ink-muted">Delivery address</dt>
                                                        <dd className="whitespace-pre-line text-ink-soft">
                                                            {order.deliveryAddress || "Not given"}
                                                        </dd>
                                                    </div>

                                                    {order.note ? (
                                                        <div>
                                                            <dt className="text-ink-muted">Customer note</dt>
                                                            <dd className="text-ink-soft">{order.note}</dd>
                                                        </div>
                                                    ) : null}
                                                </dl>

                                                <p className="mt-4 text-[0.8125rem] leading-6 text-ink-faint">
                                                    This is a request, not a paid order — quote it and
                                                    reply using the contact details above.
                                                </p>
                                            </div>

                                            <div>
                                                <p className="eyebrow mb-3">Payment</p>

                                                <PaymentReview order={order} />

                                                <p className="eyebrow mb-3 mt-8">Handling</p>

                                                <WorkflowEditor
                                                    record={order}
                                                    action={updateOrder}
                                                    statuses={STATUSES}
                                                    assignees={assignees}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    );
                })}
            </table>
        </div>
    );
}
