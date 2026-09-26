"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "./form-bits";

// Status, assignment and internal note — identical for inquiries and orders,
// because both controllers accept exactly those three fields and treat an
// absent one as "leave it alone".
export default function WorkflowEditor({ record, action, statuses, assignees }) {
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={record.id} />

            <div className="grid gap-4 sm:grid-cols-2">
                <Field
                    label="Status"
                    name="status"
                    defaultValue={record.status}
                    options={statuses}
                />

                <Field
                    label="Assigned to"
                    name="assignedTo"
                    defaultValue={record.assignedTo ?? ""}
                    options={[
                        { value: "", label: "Nobody" },
                        ...assignees.map((person) => ({
                            value: String(person.id),
                            label: `${person.firstName} ${person.lastName} (${person.role})`,
                        })),
                    ]}
                />
            </div>

            <Field
                label="Internal note"
                name="internalNote"
                rows={3}
                defaultValue={record.internalNote ?? ""}
                hint="Only staff see this. The customer never does."
            />

            <FormMessage state={state} />

            <div>
                <SubmitButton size="sm">Save</SubmitButton>
            </div>
        </form>
    );
}
