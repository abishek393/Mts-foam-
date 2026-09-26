import Link from "next/link";

export const metadata = { title: "Not found" };

// A record that has been deleted, or an id that never existed. Rendered inside
// the admin layout, so the sidebar stays available.
export default function AdminNotFound() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center border border-rule bg-surface px-6 py-20 text-center">
            <p className="eyebrow mb-4">404</p>

            <h1 className="display mb-4 text-[1.875rem]">That record isn&apos;t here</h1>

            <p className="mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                It may have been deleted, or the link may be pointing at an id that
                never existed.
            </p>

            <Link
                href="/admin"
                className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
            >
                Back to the dashboard
            </Link>
        </div>
    );
}
