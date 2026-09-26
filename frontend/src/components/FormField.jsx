"use client";

// Error styling follows the document: the field border turns accent and a short
// message prints beneath it.
export default function FormField({
    label,
    name,
    type = "text",
    error,
    hint,
    required,
    options,
    rows,
    className = "",
    ...props
}) {
    const id = `field-${name}`;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    const control = `w-full bg-surface border px-3.5 py-2.5 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-faint ${
        error
            ? "border-accent focus:border-accent"
            : "border-rule focus:border-navy"
    }`;

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
                <select
                    id={id}
                    name={name}
                    required={required}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={describedBy}
                    className={control}
                    {...props}
                >
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
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={describedBy}
                    className={`${control} resize-y`}
                    {...props}
                />
            ) : (
                <input
                    id={id}
                    name={name}
                    type={type}
                    required={required}
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={describedBy}
                    className={control}
                    {...props}
                />
            )}

            {error ? (
                <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] text-accent">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-ink-faint">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
