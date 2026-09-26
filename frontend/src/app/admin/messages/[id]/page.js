import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import StaffChat from "@/components/admin/StaffChat";

export const metadata = { title: "Conversation" };

export default async function AdminConversationPage({ params }) {
    const { id } = await params;
    const { conversation, messages } = await getConversation(id);

    if (!conversation) notFound();

    const customer = conversation.customer;

    return (
        <>
            <PageHeader
                eyebrow="Messages"
                title={`${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim() || "Customer"}
            >
                <Link
                    href="/admin/messages"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    All messages
                </Link>
            </PageHeader>

            <p className="mb-5 text-[0.875rem] text-ink-muted">
                {customer?.email}
                {customer?.phone ? ` · ${customer.phone}` : ""}
            </p>

            <StaffChat
                conversationId={conversation.id}
                initialMessages={messages}
                customerName={customer?.firstName ?? "the customer"}
            />
        </>
    );
}
