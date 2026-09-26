"use client";

import { useActionState } from "react";
import { ConfirmSubmit } from "./form-bits";

// A one-button delete for a table row. The action is passed in from the server
// component that renders the row, so this works for any resource.
export default function RowDelete({ action, id, confirm, label = "Delete" }) {
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="inline-block text-right">
            <input type="hidden" name="id" value={id} />

            <ConfirmSubmit message={confirm} pendingLabel="Deleting…">
                {label}
            </ConfirmSubmit>

            {/* A failed delete leaves the row in place, so the reason has to be
                said here rather than by the row disappearing. */}
            {state && !state.ok ? (
                <p className="mt-1 max-w-[14rem] text-[0.75rem] leading-4 text-brand-red">
                    {state.message}
                </p>
            ) : null}
        </form>
    );
}
