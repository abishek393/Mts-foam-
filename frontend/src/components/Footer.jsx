import Link from "next/link";
import { CONTACT, SITE } from "@/lib/site";
import Logo from "./Logo";

// Four-column footer: quick links, products, company, contact.
const COLUMNS = [
    {
        title: "Quick links",
        links: [
            { href: "/products", label: "All products" },
            { href: "/find-mattress", label: "Find your mattress" },
            { href: "/size-calculator", label: "Size calculator" },
            { href: "/compare", label: "Compare products" },
            { href: "/cart", label: "Cart" },
            { href: "/favourites", label: "Favourites" },
            { href: "/orders", label: "My orders" },
        ],
    },
    {
        title: "Products",
        links: [
            { href: "/products?group=mattress", label: "Mattresses" },
            { href: "/products?group=foam", label: "PU foam" },
            { href: "/products?category=Custom", label: "Custom sizes" },
            { href: "/products?category=Industrial", label: "Industrial foam" },
        ],
    },
    {
        title: "Company",
        links: [
            { href: "/about", label: "About 4STAR" },
            { href: "/dealers", label: "Become a dealer" },
            { href: "/offers", label: "Offers & schemes" },
            { href: "/contact", label: "Contact us" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-rule bg-panel">
            <div className="shell py-14">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Logo />

                        <p className="mt-5 max-w-xs text-[0.875rem] leading-6 text-ink-muted">
                            Mattresses and polyurethane foam for households, furniture
                            workshops and industrial buyers.
                        </p>
                    </div>

                    {COLUMNS.map((column) => (
                        <div key={column.title}>
                            <h2 className="table-head mb-4">{column.title}</h2>

                            <ul className="space-y-2.5">
                                {column.links.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-[0.875rem] text-ink-soft transition-colors hover:text-navy"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 border-t border-rule pt-8">
                    <h2 className="table-head mb-4">Contact</h2>

                    <div className="grid gap-4 text-[0.875rem] text-ink-soft sm:grid-cols-3">
                        <a href={CONTACT.phoneHref} className="hover:text-navy">
                            {CONTACT.phone}
                        </a>

                        <a href={CONTACT.emailHref} className="hover:text-navy">
                            {CONTACT.email}
                        </a>

                        <span>{CONTACT.address}</span>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-2 border-t border-rule pt-6 text-[0.8125rem] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {new Date().getFullYear()} {SITE.fullName}. All rights reserved.
                    </p>

                    {/* Contact details are real; product copy, specifications
                        and imagery are still placeholder. */}
                    <p>
                        Product specifications and imagery pending.
                    </p>
                </div>
            </div>
        </footer>
    );
}
