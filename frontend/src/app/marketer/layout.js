import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MarketerShell from "@/components/marketer/MarketerShell";

export const metadata = {
    title: { default: "Field sales", template: "%s — 4STAR Field" },
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Admins are let in as well, so the panel can be checked without a second login.
const ALLOWED = ["marketer", "admin"];

export default async function MarketerLayout({ children }) {
    const user = await getSession();

    // The guard lives here rather than on each page, so a new section cannot be
    // added unprotected. The API re-checks every request independently.
    if (!user) redirect("/login?next=/marketer");
    if (!ALLOWED.includes(user.role)) redirect("/");

    return <MarketerShell user={user}>{children}</MarketerShell>;
}
