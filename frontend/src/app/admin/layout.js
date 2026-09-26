import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
    title: {
        default: "Admin",
        template: "%s — 4STAR Admin",
    },
    // The panel must never be indexed, whatever robots.txt says.
    robots: { index: false, follow: false },
};

// The panel reads live data on every request; nothing here may be cached.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
    const user = await getSession();

    // The guard is here rather than in each page so a new section cannot be
    // added unprotected. The server actions re-check independently, because a
    // layout cannot protect an action's POST endpoint.
    if (!user) redirect("/login?next=/admin");
    if (user.role !== "admin") redirect("/");

    return <AdminShell user={user}>{children}</AdminShell>;
}
