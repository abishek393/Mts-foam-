"use client";

import { useEffect } from "react";
import useChat from "@/lib/useChat";
import ChatThread from "./ChatThread";

// The full-page view of the same conversation the floating bubble shows.
export default function MessagesView() {
    const chat = useChat();
    const { loading, markRead } = chat;

    // Opening the page is reading it. markRead talks to the server rather than
    // setting local render state, which is what an effect is for.
    useEffect(() => {
        if (!loading) markRead();
    }, [loading, markRead]);

    return (
        <div className="mt-12 flex h-[34rem] max-h-[70vh] flex-col border border-rule bg-panel">
            <header className="flex items-center justify-between border-b border-rule px-5 py-3">
                <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                    Conversation with 4STAR
                </p>

                <p className="text-[0.75rem] text-ink-faint">
                    {chat.connected ? "Live" : "Reconnecting…"}
                </p>
            </header>

            <div className="min-h-0 flex-1">
                <ChatThread
                    messages={chat.messages}
                    onSend={chat.send}
                    onTyping={chat.notifyTyping}
                    staffTyping={chat.staffTyping}
                    connected={chat.connected}
                    loading={chat.loading}
                    error={chat.error}
                    emptyHint="Tell us what you're after — a product, a size and a quantity is enough to start."
                />
            </div>
        </div>
    );
}
