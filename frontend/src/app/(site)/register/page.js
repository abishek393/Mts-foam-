import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthPage from "@/components/AuthPage";

export const metadata = {
    title: "Create an account",
    description:
        "Create a 4STAR account to send inquiries and track them from one place.",
};

export default async function RegisterPage() {
    if (await getSession()) redirect("/account");

    return (
        <AuthPage
            mode="register"
            eyebrow="Account"
            title="Create an account"
            intro="Inquiries are tied to an account so you can track quotes and follow-ups in one place. It takes a moment."
        />
    );
}
