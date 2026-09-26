"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import StaleSessionGuard from "../StaleSessionGuard";

// The panel's chrome: a fixed sidebar on desktop, a collapsing drawer on
// mobile. Denser and squarer than the public site — it is a work surface, not
// a brochure — but built from the same tokens so it still reads as 4STAR.

const SECTIONS = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/inquiries", label: "Inquiries" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/offers", label: "Offers" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/reports", label: "Field reports" },
    { href: "/admin/applications", label: "Dealer applications" },
    { href: "/admin/dealers", label: "Dealer directory" },
    { href: "/admin/users", label: "Accounts" },
];

export default function AdminShell({ user, children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const isCurrent = (section) =>
        section.exact ? pathname === section.href : pathname.startsWith(section.href);

    async function signOut() {
        setSigningOut(true);

        try {
            await fetch("/api/session", { method: "DELETE" });
            router.push("/");
            router.refresh();
        } finally {
            setSigningOut(false);
        }
    }

    const nav = (
        <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((section) => {
                const current = isCurrent(section);

                return (
                    <Link
                        key={section.href}
                        href={section.href}
                        onClick={() => setOpen(false)}
                        aria-current={current ? "page" : undefined}
                        className={`border-l-2 px-4 py-2.5 text-[0.875rem] transition-colors ${
                            current
                                ? "border-accent bg-white/5 text-white"
                                : "border-transparent text-white/60 hover:border-white/30 hover:text-white"
                        }`}
                    >
                        {section.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <StaleSessionGuard />

            {/* Mobile bar */}
            <header className="flex items-center justify-between border-b border-rule bg-band px-5 py-3 lg:hidden">
                <Link href="/admin" className="display text-[1.125rem] text-white">
                    4STAR <span className="text-accent">Admin</span>
                </Link>

                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-expanded={open}
                    className="border border-white/30 px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.14em] text-white"
                >
                    {open ? "Close" : "Menu"}
                </button>
            </header>

            {/* Sidebar */}
            <aside
                className={`bg-band lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 ${
                    open ? "block" : "hidden lg:block"
                }`}
            >
                <div className="flex h-full flex-col">
                    <Link
                        href="/admin"
                        className="hidden border-b border-white/10 px-6 py-6 lg:block"
                    >
                        <span className="display block text-[1.375rem] leading-none text-white">
                            4STAR
                        </span>
                        <span className="mt-1 block text-[0.6875rem] uppercase tracking-[0.22em] text-accent">
                            Administration
                        </span>
                    </Link>

                    <div className="flex-1 py-4">{nav}</div>

                    <div className="border-t border-white/10 px-4 py-4">
                        <p className="px-2 text-[0.8125rem] text-white/80">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="mb-3 px-2 text-[0.6875rem] uppercase tracking-[0.14em] text-white/40">
                            {user.role}
                        </p>

                        <div className="flex flex-col gap-1">
                            <Link
                                href="/"
                                className="px-2 py-1.5 text-left text-[0.8125rem] text-white/60 transition-colors hover:text-white"
                            >
                                View the site
                            </Link>

                            <button
                                type="button"
                                onClick={signOut}
                                disabled={signingOut}
                                className="px-2 py-1.5 text-left text-[0.8125rem] text-white/60 transition-colors hover:text-white disabled:opacity-50"
                            >
                                {signingOut ? "Signing out…" : "Sign out"}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="min-w-0 flex-1 bg-ground px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
                {children}
            </main>
        </div>
    );
}
