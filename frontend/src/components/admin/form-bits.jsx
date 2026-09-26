"use client";

import { useFormStatus } from "react-dom";

// Shared client-side form pieces. Every admin mutation is a server action
// driven by useActionState, so these only need to reflect pending state and
// render whatever the action returned.

const VARIANTS = {
    primary: "bg-navy text-white border-navy hover:bg-navy-dark hover:border-navy-dark",
    secondary: "bg-surface text-ink border-rule-strong hover:border-ink hover:bg-panel",
    danger: "bg-surface text-brand-red border-brand-red hover:bg-brand-red hover:text-white",
};

const SIZES = {
    sm: "px-3 py-1.5 text-[0.8125rem]",
    md: "px-5 py-2.5 text-[0.875rem]",
};

// Disabled while its own form is in flight, so a slow save cannot be
// double-submitted.
export function SubmitButton({
    children,
    pendingLabel,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || props.disabled}
            className={`inline-flex items-center justify-center gap-2 border font-medium tracking-wide transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                VARIANTS[variant] ?? VARIANTS.primary
            } ${SIZES[size] ?? SIZES.md} ${className}`}
            {...props}
        >
            {pending ? (pendingLabel ?? "Saving…") : children}
        </button>
    );
}

// A destructive submit that asks first. The confirmation is native on purpose —
// a bespoke dialog here would be more code than the interaction deserves.
export function ConfirmSubmit({ message, children, ...props }) {
    return (
        <SubmitButton
            variant="danger"
            size="sm"
            onClick={(event) => {
                if (!window.confirm(message)) event.preventDefault();
            }}
            {...props}
        >
            {children}
        </SubmitButton>
    );
}

// Renders whatever a server action returned: the message, plus any per-field
// validation errors the API sent back.
export function FormMessage({ state }) {
    if (!state?.message) return null;

    const tone = state.ok
        ? "border-navy bg-navy/5 text-navy"
        : "border-brand-red bg-brand-red/5 text-brand-red";

    return (
        <div
            role="status"
            aria-live="polite"
            className={`border px-4 py-3 text-[0.875rem] ${tone}`}
        >
            <p>{state.message}</p>

            {state.errors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.8125rem]">
                    {state.errors.map((error) => (
                        <li key={error}>{error}</li>
                    ))}
                </ul>
            ) : null}

            {/* When the decision email did not go out, the admin has to know —
                the applicant is otherwise waiting for something that never came. */}
            {state.ok && state.emailed === false ? (
                <p className="mt-2 text-[0.8125rem]">
                    The email could not be sent. Pass the details on yourself.
                </p>
            ) : null}

            {state.resubmitLink ? (
                <p className="mt-3 border-t border-current/20 pt-3 text-[0.8125rem] break-all">
                    Upload link, if you need to send it by hand:{" "}
                    <code className="bg-white px-1.5 py-0.5 font-mono text-ink">
                        {state.resubmitLink}
                    </code>
                </p>
            ) : null}

            {state.temporaryPassword ? (
                <p className="mt-3 border-t border-current/20 pt-3 text-[0.8125rem]">
                    Temporary password — shown once, pass it to the dealer:{" "}
                    <code className="bg-white px-1.5 py-0.5 font-mono text-ink">
                        {state.temporaryPassword}
                    </code>
                </p>
            ) : null}
        </div>
    );
}

// Labelled control used by the admin forms. Denser than the public FormField
// and it accepts a defaultValue, since every admin form is an edit form.
export function Field({
    label,
    name,
    type = "text",
    hint,
    required,
    options,
    rows,
    className = "",
    ...props
}) {
    const id = `admin-${name}`;

    const control =
        "w-full border border-rule bg-surface px-3 py-2 text-[0.875rem] text-ink transition-colors placeholder:text-ink-faint focus:border-navy";

    return (
        <div className={className}>
            <label
                htmlFor={id}
                className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
            >
                {label}
                {required ? <span className="ml-1 text-brand-red">*</span> : null}
            </label>

            {options ? (
                <select id={id} name={name} required={required} className={control} {...props}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : rows ? (
                <textarea
                    id={id}
                    name={name}
                    rows={rows}
                    required={required}
                    className={`${control} resize-y`}
                    {...props}
                />
            ) : (
                <input
                    id={id}
                    name={name}
                    type={type}
                    required={required}
                    className={control}
                    {...props}
                />
            )}

            {hint ? (
                <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{hint}</p>
            ) : null}
        </div>
    );
}

export function Checkbox({ label, name, defaultChecked, hint }) {
    const id = `admin-${name}`;

    return (
        <div>
            <label htmlFor={id} className="flex items-center gap-2.5 text-[0.875rem] text-ink">
                <input
                    id={id}
                    name={name}
                    type="checkbox"
                    defaultChecked={defaultChecked}
                    className="h-4 w-4 accent-[color:var(--color-navy)]"
                />
                {label}
            </label>

            {hint ? <p className="mt-1 text-[0.8125rem] text-ink-faint">{hint}</p> : null}
        </div>
    );
}
