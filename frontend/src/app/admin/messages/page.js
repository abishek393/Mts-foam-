import Link from "next/link";
import { getConversations } from "@/lib/admin";
import {
    PageHeader,
    Panel,
    EmptyState,
    FilterTabs,
    StatusPill,
    formatDateTime,
    fullName,
} from "@/components/admin/ui";

export const metadata = { title: "Messages" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "true", label: "Waiting on us" },
];

export default async function AdminMessagesPage({ searchParams }) {
    const params = await searchParams;
    const unread = typeof params?.unread === "string" ? params.unread : "";

    const conversations = await getConversations({ unread });

    return (
        <>
            <PageHeader
                eyebrow="Customers"
                title="Messages"
                count={conversations.length}
            />

            <FilterTabs
                basePath="/admin/messages"
                param="unread"
                current={unread}
                options={FILTERS}
            />

            {conversations.length === 0 ? (
                <Panel>
                    <EmptyState
                        title={unread ? "Nothing waiting on you." : "No messages yet."}
                        body={
                            unread
                                ? "Every conversation has been answered."
                                : "When a customer messages you from the site, the conversation appears here."
                        }
                    />
                </Panel>
            ) : (
                <ul className="grid gap-2">
                    {conversations.map((conversation) => (
                        <li key={conversation.id}>
                            <Link
                                href={`/admin/messages/${conversation.id}`}
                                className={`flex flex-wrap items-start justify-between gap-4 border bg-surface px-5 py-4 transition-colors hover:border-ink ${
                                    conversation.unreadForStaff > 0
                                        ? "border-brand-red/50"
                                        : "border-rule"
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="mb-1 flex flex-wrap items-center gap-3">
                                        <span className="text-[1.0625rem] text-ink">
                                            {fullName(conversation.customer)}
                                        </span>

                                        {conversation.unreadForStaff > 0 ? (
                                            <StatusPill
                                                status="new"
                                                label={`${conversation.unreadForStaff} new`}
                                            />
                                        ) : null}
                                    </div>

                                    <p className="mb-1 max-w-2xl truncate text-[0.9375rem] text-ink-soft">
                                        {conversation.lastMessagePreview}
                                    </p>

                                    <p className="text-[0.8125rem] text-ink-faint">
                                        {conversation.customer?.email}
                                        {conversation.customer?.phone
                                            ? ` · ${conversation.customer.phone}`
                                            : ""}
                                    </p>
                                </div>

                                <p className="shrink-0 text-[0.8125rem] text-ink-faint">
                                    {formatDateTime(conversation.lastMessageAt)}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
