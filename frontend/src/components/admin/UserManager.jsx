"use client";

import { useActionState, useState } from "react";
import { createUser, updateUser, deleteUser } from "@/app/admin/actions";
import { Field, Checkbox, FormMessage, SubmitButton } from "./form-bits";
import RowDelete from "./RowDelete";
import { StatusPill, formatDate } from "./ui";

// Roles an admin may create. Customers are absent on purpose — they
// self-register, and the API rejects "customer" here.
const CREATABLE_ROLES = [
    { value: "employee", label: "Employee" },
    { value: "marketer", label: "Marketer" },
    { value: "dealer", label: "Dealer" },
    { value: "admin", label: "Administrator" },
];

// An existing account can be any role, including a customer who registered
// themselves, so editing offers the full set.
const ALL_ROLES = [{ value: "customer", label: "Customer" }, ...CREATABLE_ROLES];

const ROLE_LABELS = Object.fromEntries(
    ALL_ROLES.map((role) => [role.value, role.label])
);

const COLUMNS = ["Name", "Email", "Phone", "Role", "Status", "Joined"];
const cell = "border-b border-rule px-4 py-3 align-top text-[0.875rem]";

function AddUser({ onDone }) {
    const [state, formAction] = useActionState(createUser, null);

    return (
        <form action={formAction} className="grid gap-5 border border-rule bg-surface p-5 sm:p-6">
            <h2 className="eyebrow">New account</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="First name" name="firstName" required />
                <Field label="Last name" name="lastName" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" />

                <Field
                    label="Password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    hint="At least 6 characters. Pass it on yourself — no email is sent."
                />

                <Field
                    label="Role"
                    name="role"
                    required
                    defaultValue="employee"
                    options={CREATABLE_ROLES}
                />
            </div>

            <FormMessage state={state} />

            <div className="flex flex-wrap gap-3">
                <SubmitButton size="sm" pendingLabel="Creating…">
                    Create account
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
                Customers are not created here — they register themselves. Employees
                work on inquiries and orders; marketers get their own field panel at
                /marketer for taking orders and filing daily reports; administrators
                can do everything here.
            </p>
        </form>
    );
}

function EditUser({ account, onDone }) {
    const [state, formAction] = useActionState(updateUser, null);

    return (
        <form action={formAction} className="grid gap-5 py-2">
            <input type="hidden" name="id" value={account.id} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                    label="First name"
                    name="firstName"
                    required
                    defaultValue={account.firstName}
                />

                <Field
                    label="Last name"
                    name="lastName"
                    required
                    defaultValue={account.lastName}
                />

                <Field
                    label="Email"
                    name="email"
                    type="email"
                    required
                    defaultValue={account.email}
                />

                <Field label="Phone" name="phone" defaultValue={account.phone ?? ""} />

                <Field
                    label="Role"
                    name="role"
                    defaultValue={account.role}
                    options={ALL_ROLES}
                />

                <Field
                    label="New password"
                    name="password"
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    hint="Leave blank to keep the current one."
                />

                <div className="sm:col-span-2 lg:col-span-3">
                    <Checkbox
                        label="Account is active"
                        name="isActive"
                        defaultChecked={account.isActive}
                        hint="A deactivated account cannot sign in, and its existing token stops working."
                    />
                </div>
            </div>

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

export default function UserManager({ users, currentUserId }) {
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    return (
        <div className="grid gap-5">
            <div>
                {adding ? (
                    <AddUser onDone={() => setAdding(false)} />
                ) : (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                    >
                        New account
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

                        {users.map((account) => {
                            const editing = editingId === account.id;
                            const isSelf = String(account.id) === String(currentUserId);

                            return (
                                <tbody key={account.id} className={editing ? "bg-panel" : undefined}>
                                    <tr>
                                        <td className={`${cell} text-ink`}>
                                            {account.firstName} {account.lastName}
                                            {isSelf ? (
                                                <span className="ml-2 text-[0.75rem] text-ink-faint">
                                                    (you)
                                                </span>
                                            ) : null}
                                        </td>

                                        <td className={`${cell} text-ink-muted`}>{account.email}</td>

                                        <td className={`${cell} text-ink-muted`}>
                                            {account.phone || "—"}
                                        </td>

                                        <td className={`${cell} text-ink-muted`}>
                                            {ROLE_LABELS[account.role] ?? account.role}
                                        </td>

                                        <td className={cell}>
                                            <StatusPill
                                                status={account.isActive ? "active" : "inactive"}
                                                label={account.isActive ? "Active" : "Disabled"}
                                            />
                                        </td>

                                        <td className={`${cell} whitespace-nowrap text-ink-muted`}>
                                            {formatDate(account.createdAt)}
                                        </td>

                                        <td className={`${cell} text-right`}>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(editing ? null : account.id)}
                                                    aria-expanded={editing}
                                                    className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                                >
                                                    {editing ? "Close" : "Edit"}
                                                </button>

                                                {/* Deleting your own account would end your
                                                    own session, so it is not offered. */}
                                                {isSelf ? null : (
                                                    <RowDelete
                                                        action={deleteUser}
                                                        id={account.id}
                                                        confirm={`Delete ${account.firstName} ${account.lastName} permanently? Deactivating instead keeps their inquiries readable.`}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {editing ? (
                                        <tr>
                                            <td
                                                colSpan={COLUMNS.length + 1}
                                                className="border-b border-rule px-4 pb-6 pt-1"
                                            >
                                                <EditUser
                                                    account={account}
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
