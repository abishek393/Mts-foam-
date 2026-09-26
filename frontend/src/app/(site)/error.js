"use client";

export default function Error({ error, reset }) {
    return (
        <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
            <p className="eyebrow mb-5">Something went wrong</p>

            <h1 className="display mb-5 text-[2.25rem] sm:text-[2.75rem]">
                This page didn&apos;t load
            </h1>

            <p className="mb-10 max-w-md text-[0.9375rem] leading-7 text-ink-soft">
                The catalogue may be briefly unavailable. Try again, or call us on the
                number in the footer.
            </p>

            <button
                type="button"
                onClick={reset}
                className="border border-navy bg-navy px-8 py-3.5 text-[0.9375rem] text-white transition-colors hover:bg-navy-dark"
            >
                Try again
            </button>

            {process.env.NODE_ENV === "development" && error?.message ? (
                <p className="mt-8 max-w-xl border border-rule bg-panel px-4 py-3 text-left text-[0.8125rem] text-ink-muted">
                    {error.message}
                </p>
            ) : null}
        </div>
    );
}
