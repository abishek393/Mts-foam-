"use client";

import { useState } from "react";
import Link from "next/link";
import useChat from "@/lib/useChat";
import ChatThread from "./ChatThread";

// The floating bubble. Only mounted for signed-in customers — staff answer in
// the admin panel, and a signed-out visitor has nobody to be.
//
// The socket stays open while they browse, so a reply lights the bubble up
// wherever they are on the site rather than only once they open the chat.

export default function ChatWidget({ user }) {
    const [open, setOpen] = useState(false);
    const isCustomer = user?.role === "customer";

    const chat = useChat({ enabled: isCustomer });

    if (!isCustomer) return null;

    // Opening the panel is reading it. Done here rather than in an effect,
    // because it is a response to a click, not a synchronisation.
    const toggle = () => {
        setOpen((wasOpen) => {
            if (!wasOpen) chat.markRead();
            return !wasOpen;
        });
    };

    const badge = open ? 0 : chat.unread;

    return (
        <>
            {open ? (
                <div className="fixed bottom-[10.5rem] right-5 z-50 flex h-[26rem] max-h-[calc(100vh-13rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col border border-rule bg-ground shadow-lg sm:bottom-[11rem] sm:right-7">
                    <header className="flex items-center justify-between border-b border-rule bg-band px-4 py-3">
                        <div>
                            <p className="text-[0.9375rem] text-white">Message 4STAR</p>
                            <p className="text-[0.6875rem] text-white/60">
                                {chat.connected ? "Connected" : "Connecting…"}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/messages"
                                className="text-[0.75rem] text-white/70 underline underline-offset-4 hover:text-white"
                            >
                                Full view
                            </Link>

                            <button
                                type="button"
                                onClick={toggle}
                                aria-label="Close chat"
                                className="text-[1.25rem] leading-none text-white/70 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1">
                        <ChatThread
                            compact
                            messages={chat.messages}
                            onSend={chat.send}
                            onTyping={chat.notifyTyping}
                            staffTyping={chat.staffTyping}
                            connected={chat.connected}
                            loading={chat.loading}
                            error={chat.error}
                        />
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                onClick={toggle}
                aria-label={open ? "Close chat" : "Message 4STAR"}
                aria-expanded={open}
                className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-navy bg-navy text-white shadow-lg transition-colors hover:bg-navy-dark sm:bottom-[6.5rem] sm:right-7"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {badge > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-brand-red px-1 text-[0.6875rem] text-white">
                        {badge}
                    </span>
                ) : null}
            </button>
        </>
    );
}
