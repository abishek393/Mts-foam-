"use client";

import { useState } from "react";
import Link from "next/link";
import { updateInquiry } from "@/app/admin/actions";
import WorkflowEditor from "./WorkflowEditor";
import { StatusPill, formatDateTime, fullName } from "./ui";

const STATUSES = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "quoted", label: "Quoted" },
    { value: "closed", label: "Closed" },
];

const SOURCE_LABELS = {
    product: "Product page",
    compare: "Comparison",
    finder: "Mattress finder",
    calculator: "Size calculator",
    contact: "Contact page",
    offer: "Offer",
    dealer: "Dealer page",
};

const COLUMNS = ["Customer", "About", "Source", "Assigned", "Status", "Received"];

// The size an inquiry asked about — either a preset label or the custom
// dimensions someone entered in the calculator.
function sizeSummary(inquiry) {
    if (inquiry.sizeLabel) return inquiry.sizeLabel;

    const { lengthIn, widthIn, thicknessIn } = inquiry;
    if (!lengthIn && !widthIn) return null;

    const base = `${Number(widthIn ?? 0)} × ${Number(lengthIn ?? 0)} in`;
    return thicknessIn ? `${base}, ${Number(thicknessIn)} in thick` : base;
}

const cell = "border-b border-rule px-4 py-3 align-top text-[0.875rem]";

export default function InquiryTable({ inquiries, assignees }) {
    // One row open at a time — the editor is tall, and two open at once makes
    // the table impossible to scan. Each record gets its own <tbody> so the
    // detail row stays inside the same column grid as the summary row.
    const [openId, setOpenId] = useState(null);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
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

                {inquiries.map((inquiry) => {
                    const open = openId === inquiry.id;
                    const size = sizeSummary(inquiry);

                    return (
                        <tbody key={inquiry.id} className={open ? "bg-panel" : undefined}>
                            <tr>
                                <td className={cell}>
                                    <span className="block text-ink">
                                        {fullName(inquiry.customer)}
                                    </span>
                                    <span className="block text-[0.8125rem] text-ink-faint">
                                        {inquiry.contactEmail ?? inquiry.customer?.email}
                                    </span>
                                    <span className="block text-[0.8125rem] text-ink-faint">
                                        {inquiry.contactPhone ??
                                            inquiry.customer?.phone ??
                                            "No phone"}
                                    </span>
                                </td>

                                <td className={`${cell} text-ink-soft`}>
                                    {inquiry.product ? (
                                        <Link
                                            href={`/products/${inquiry.product.slug}`}
                                            className="text-navy underline underline-offset-4 hover:text-brand-red"
                                        >
                                            {inquiry.productLabel ?? inquiry.product.name}
                                        </Link>
                                    ) : (
                                        (inquiry.productLabel ?? "General inquiry")
                                    )}

                                    <span className="block text-[0.8125rem] text-ink-faint">
                                        {size ? `${size} · ` : null}Qty {inquiry.quantity}
                                    </span>
                                </td>

                                <td className={`${cell} text-ink-muted`}>
                                    {SOURCE_LABELS[inquiry.source] ?? inquiry.source}
                                </td>

                                <td className={`${cell} text-ink-muted`}>
                                    {inquiry.assignee ? fullName(inquiry.assignee) : "—"}
                                </td>

                                <td className={cell}>
                                    <StatusPill status={inquiry.status} />
                                </td>

                                <td className={`${cell} whitespace-nowrap text-ink-muted`}>
                                    {formatDateTime(inquiry.createdAt)}
                                </td>

                                <td className={`${cell} text-right`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(open ? null : inquiry.id)}
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
                                                <p className="eyebrow mb-3">What they asked</p>

                                                <dl className="space-y-2 text-[0.875rem]">
                                                    <div className="flex gap-2">
                                                        <dt className="text-ink-muted">Quantity:</dt>
                                                        <dd className="text-ink-soft">{inquiry.quantity}</dd>
                                                    </div>

                                                    {size ? (
                                                        <div className="flex gap-2">
                                                            <dt className="text-ink-muted">Size:</dt>
                                                            <dd className="text-ink-soft">{size}</dd>
                                                        </div>
                                                    ) : null}

                                                    <div className="flex gap-2">
                                                        <dt className="text-ink-muted">Contact name:</dt>
                                                        <dd className="text-ink-soft">
                                                            {inquiry.contactName ?? fullName(inquiry.customer)}
                                                        </dd>
                                                    </div>
                                                </dl>

                                                {inquiry.message ? (
                                                    <p className="mt-4 border-l-2 border-rule-strong pl-4 text-[0.9375rem] leading-7 text-ink-soft">
                                                        {inquiry.message}
                                                    </p>
                                                ) : (
                                                    <p className="mt-4 text-[0.875rem] text-ink-faint">
                                                        No message was left.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="eyebrow mb-3">Handling</p>

                                                <WorkflowEditor
                                                    record={inquiry}
                                                    action={updateInquiry}
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
