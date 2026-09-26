import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import MessagesView from "@/components/MessagesView";

export const metadata = {
    title: "Messages",
    description: "Message the 4STAR team directly and get a reply in real time.",
};

export default async function MessagesPage() {
    const user = await getSession();

    if (!user) redirect("/login?next=/messages");

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Messages" title="Talk to us directly">
                <p>
                    Ask about a size, a quantity or a delivery and we&apos;ll reply here.
                    Messages arrive the moment they&apos;re sent, and the whole
                    conversation stays on your account.
                </p>
            </SectionHeading>

            <MessagesView />
        </div>
    );
}
