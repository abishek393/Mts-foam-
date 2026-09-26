import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthPage from "@/components/AuthPage";
import { safeNext } from "@/lib/site";

export const metadata = {
    title: "Sign in",
    description: "Sign in to your 4STAR account to send and track inquiries.",
};

export default async function LoginPage({ searchParams }) {
    // Set when a guard bounced the visitor here, e.g. /login?next=/admin.
    const params = await searchParams;
    const next = safeNext(params?.next);

    if (await getSession()) redirect(next ?? "/account");

    return (
        <AuthPage
            mode="login"
            eyebrow="Account"
            title="Sign in"
            intro="Sign in to send inquiries and follow their progress."
            next={next}
        />
    );
}
