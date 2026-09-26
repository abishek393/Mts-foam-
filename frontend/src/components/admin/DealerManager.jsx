"use client";

import { useActionState, useState } from "react";
import { createDealer, updateDealer, deleteDealer } from "@/app/admin/actions";
import { DEALER_TYPES } from "@/lib/site";
import { Field, Checkbox, FormMessage, SubmitButton } from "./form-bits";
import RowDelete from "./RowDelete";
import { StatusPill, fullName } from "./ui";

const TYPE_OPTIONS = Object.entries(DEALER_TYPES).map(([value, label]) => ({
    value,
    label,
}));

const COLUMNS = ["Business", "Location", "Type", "Contact", "Login", "Status"];
const cell = "border-b border-rule px-4 py-3 align-top text-[0.875rem]";

// The add and edit forms are the same fields, so they share one component.
function DealerFields({ dealer }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
                label="Business name"
                name="businessName"
                required
                defaultValue={dealer?.businessName ?? ""}
            />

            <Field label="City" name="city" required defaultValue={dealer?.city ?? ""} />

            <Field
                label="Ward"
                name="ward"
                defaultValue={dealer?.ward ?? ""}
                placeholder="Ward 10"
            />

            <Field
                label="Type"
                name="type"
                defaultValue={dealer?.type ?? "authorised"}
                options={TYPE_OPTIONS}
            />

            <Field label="Phone" name="phone" defaultValue={dealer?.phone ?? ""} />

            <Field
                label="Email"
                name="email"
                type="email"
                defaultValue={dealer?.email ?? ""}
            />

            <div className="sm:col-span-2 lg:col-span-3">
                <Checkbox
                    label="Listed in the public directory"
                    name="isActive"
                    defaultChecked={dealer ? dealer.isActive : true}
                />
            </div>
        </div>
    );
}

function AddDealer({ onDone }) {
    const [state, formAction] = useActionState(createDealer, null);

    return (
        <form action={formAction} className="grid gap-5 border border-rule bg-surface p-5 sm:p-6">
            <h2 className="eyebrow">New dealer</h2>

            <DealerFields />

            <FormMessage state={state} />

            <div className="flex flex-wrap gap-3">
                <SubmitButton size="sm" pendingLabel="Adding…">
                    Add dealer
                </SubmitButton>

                <button
                    type="button"
                    onClick={onDone}
                    className="border border-rule-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Cancel
                </button>
            </div>

            <p className="text-[0.8125rem] leading-6 text-ink-faint">
                This creates a directory entry only. It does not create a login — a
                dealer gets one when their application is verified, or from Accounts.
            </p>
        </form>
    );
}

function EditDealer({ dealer, onDone }) {
    const [state, formAction] = useActionState(updateDealer, null);

    return (
        <form action={formAction} className="grid gap-5 py-2">
            <input type="hidden" name="id" value={dealer.id} />

            <DealerFields dealer={dealer} />

            <FormMessage state={state} />

            <div className="flex flex-wrap gap-3">
                <SubmitButton size="sm">Save</SubmitButton>

                <button
                    type="button"
                    onClick={onDone}
                    className="border border-rule-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function DealerManager({ dealers }) {
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    return (
        <div className="grid gap-5">
            <div>
                {adding ? (
                    <AddDealer onDone={() => setAdding(false)} />
                ) : (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                    >
                        New dealer
                    </button>
                )}
            </div>

            <section className="border border-rule bg-surface">
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
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>

                        {dealers.map((dealer) => {
                            const editing = editingId === dealer.id;

                            return (
                                <tbody key={dealer.id} className={editing ? "bg-panel" : undefined}>
                                    <tr>
                                        <td className={`${cell} text-ink`}>{dealer.businessName}</td>

                                        <td className={`${cell} text-ink-muted`}>
                                            {dealer.ward ? `${dealer.ward}, ${dealer.city}` : dealer.city}
                                        </td>

                                        <td className={`${cell} text-ink-muted`}>
                                            {DEALER_TYPES[dealer.type] ?? dealer.type}
                                        </td>

                                        <td className={cell}>
                                            <span className="block text-ink-muted">
                                                {dealer.phone || "No phone"}
                                            </span>
                                            <span className="block text-[0.8125rem] text-ink-faint">
                                                {dealer.email || "No email"}
                                            </span>
                                        </td>

                                        <td className={`${cell} text-ink-muted`}>
                                            {dealer.user ? fullName(dealer.user) : "None"}
                                        </td>

                                        <td className={cell}>
                                            <StatusPill
                                                status={dealer.isActive ? "active" : "inactive"}
                                                label={dealer.isActive ? "Listed" : "Hidden"}
                                            />
                                        </td>

                                        <td className={`${cell} text-right`}>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(editing ? null : dealer.id)}
                                                    aria-expanded={editing}
                                                    className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                                >
                                                    {editing ? "Close" : "Edit"}
                                                </button>

                                                <RowDelete
                                                    action={deleteDealer}
                                                    id={dealer.id}
                                                    confirm={`Remove "${dealer.businessName}" from the directory permanently? Hiding it instead keeps the record.`}
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    {editing ? (
                                        <tr>
                                            <td
                                                colSpan={COLUMNS.length + 1}
                                                className="border-b border-rule px-4 pb-6 pt-1"
                                            >
                                                <EditDealer
                                                    dealer={dealer}
                                                    onDone={() => setEditingId(null)}
                                                />
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            );
                        })}
                    </table>
                </div>
            </section>
        </div>
    );
}
