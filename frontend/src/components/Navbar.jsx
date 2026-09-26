"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS, PRIMARY_NAV_HREFS } from "@/lib/site";
import { useInquiry } from "./InquiryProvider";
import Logo from "./Logo";
import CartIndicator from "./CartIndicator";
import FavouritesIndicator from "./FavouritesIndicator";

// Sticky header, read left to right: logo and the main links on the left, then
// the two calls to action on the right, with Send Inquiry carrying the site's
// accent so it is the one thing that stands out.
//
// The hamburger is present at every width, not just on a phone. On a wide
// screen the bar shows four links and the panel holds the rest; below 1120px
// the bar shows none and the panel holds all of them.
export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setUser, openInquiry } = useInquiry();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close the panel whenever the route changes. Adjusted during render rather
    // than in an effect, so the panel is never painted open on the new page.
    const [menuPath, setMenuPath] = useState(pathname);

    if (menuPath !== pathname) {
        setMenuPath(pathname);
        setMenuOpen(false);
    }

    // Don't leave a hidden panel scroll-locking the page. Hiding the scrollbar
    // would otherwise widen the page and shift the sticky header sideways, so
    // its width is paid back as padding.
    useEffect(() => {
        if (!menuOpen) return undefined;

        const { overflow, paddingRight } = document.body.style;
        const gap = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        if (gap > 0) document.body.style.paddingRight = `${gap}px`;

        return () => {
            document.body.style.overflow = overflow;
            document.body.style.paddingRight = paddingRight;
        };
    }, [menuOpen]);

    // Escape closes it, as with any other overlay.
    useEffect(() => {
        if (!menuOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuOpen]);

    async function signOut() {
        await fetch("/api/session", { method: "DELETE" });
        setUser(null);
        setMenuOpen(false);
        router.push("/");
        router.refresh();
    }

    const isActive = (href) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const barLinks = NAV_LINKS.filter((link) =>
        PRIMARY_NAV_HREFS.includes(link.href)
    );

    return (
        <header className="sticky top-0 z-50 border-b border-rule bg-ground/95 backdrop-blur-sm">
            <div className="shell flex h-[72px] items-center gap-3 min-[1120px]:gap-8">
                {/* ── Left: identity and the main links ─────────────────── */}
                <Link href="/" className="shrink-0" aria-label={`${"4STAR"} home`}>
                    <Logo />
                </Link>

                <nav
                    aria-label="Primary"
                    className="hidden min-[1120px]:flex items-center gap-7"
                >
                    {barLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={`text-[0.875rem] transition-colors ${
                                isActive(link.href)
                                    ? "text-ink"
                                    : "text-ink-muted hover:text-ink"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* ── Right: the calls to action ────────────────────────── */}
                {/* Only Send Inquiry and the hamburger sit here; favourites,
                    cart and Find Your Mattress live in the panel. */}
                <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
                    {/* The one accent-coloured control in the header. */}
                    <button
                        type="button"
                        onClick={() => openInquiry({ source: "contact" })}
                        className="border border-brand-red bg-brand-red px-4 py-2.5 text-[0.8125rem] font-medium tracking-wide text-white transition-colors hover:brightness-95 sm:px-5"
                    >
                        Send Inquiry
                    </button>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((value) => !value)}
                        aria-expanded={menuOpen}
                        aria-controls="site-menu"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        className="-mr-2 flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-navy"
                    >
                        <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
                            {menuOpen ? (
                                <path
                                    d="M2 2l18 12M20 2L2 14"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                            ) : (
                                <path
                                    d="M0 1h22M0 8h22M0 15h22"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {menuOpen ? (
                <>
                    {/* Clicking away closes it. Sits below the panel but above
                        the page, and starts under the 72px bar so the
                        hamburger itself stays clickable. */}
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        onClick={() => setMenuOpen(false)}
                        className="fixed inset-x-0 bottom-0 top-[72px] z-40 cursor-default bg-ink/20"
                    />

                    <div
                        id="site-menu"
                        className="relative z-50 max-h-[calc(100vh-72px)] overflow-y-auto border-t border-rule bg-ground shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]"
                    >
                        <div className="shell grid gap-8 py-7 min-[760px]:grid-cols-[1fr_auto] min-[760px]:gap-16">
                            <nav aria-label="All pages">
                                <p className="eyebrow mb-4">Browse</p>

                                <div className="grid min-[760px]:grid-cols-2 min-[760px]:gap-x-14">
                                    {NAV_LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            aria-current={
                                                isActive(link.href) ? "page" : undefined
                                            }
                                            // Touch-sized rows, per the design document.
                                            className={`flex min-h-[52px] items-center border-b border-rule text-[0.9375rem] transition-colors hover:text-navy min-[760px]:min-h-[44px] ${
                                                isActive(link.href)
                                                    ? "text-ink"
                                                    : "text-ink-soft"
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </nav>

                            <div className="min-[760px]:w-[260px]">
                                <p className="eyebrow mb-4">Your account</p>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <FavouritesIndicator
                                            onNavigate={() => setMenuOpen(false)}
                                        />
                                        <CartIndicator
                                            onNavigate={() => setMenuOpen(false)}
                                        />
                                    </div>

                                    <Link
                                        href="/find-mattress"
                                        className="flex min-h-[48px] items-center justify-center border border-rule-strong text-[0.9375rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                                    >
                                        Find Your Mattress
                                    </Link>

                                    {user ? (
                                        <>
                                            {/* The only way into the panel from
                                                the site. It is a convenience,
                                                not the guard — /admin checks the
                                                role server-side whether this
                                                link is shown or not. */}
                                            {user.role === "admin" ? (
                                                <Link
                                                    href="/admin"
                                                    className="flex min-h-[48px] items-center justify-center border border-navy text-[0.9375rem] text-navy transition-colors hover:bg-navy hover:text-white"
                                                >
                                                    Admin panel
                                                </Link>
                                            ) : null}

                                            {/* A marketer has no other way into
                                                their panel — without this they
                                                sign in and see the ordinary
                                                shop. Admins get it too, since
                                                they can open the panel to check
                                                it. */}
                                            {user.role === "marketer" ||
                                            user.role === "admin" ? (
                                                <Link
                                                    href="/marketer"
                                                    className="flex min-h-[48px] items-center justify-center border border-navy text-[0.9375rem] text-navy transition-colors hover:bg-navy hover:text-white"
                                                >
                                                    Marketer panel
                                                </Link>
                                            ) : null}

                                            <Link
                                                href="/account"
                                                className="flex min-h-[48px] items-center justify-center border border-rule text-[0.9375rem] text-ink transition-colors hover:bg-panel"
                                            >
                                                {user.firstName
                                                    ? `${user.firstName}'s account`
                                                    : "My account"}
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={signOut}
                                                className="flex min-h-[48px] items-center justify-center border border-rule text-[0.9375rem] text-ink-muted transition-colors hover:border-brand-red hover:text-brand-red"
                                            >
                                                Sign out
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="flex min-h-[48px] items-center justify-center border border-rule text-[0.9375rem] text-ink-muted transition-colors hover:bg-panel"
                                        >
                                            Sign in
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </header>
    );
}
