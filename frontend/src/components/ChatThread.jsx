"use client";

import { useEffect, useRef, useState } from "react";

// The message list and composer, shared by the floating bubble and the full
// /messages page so the two can never look or behave differently.

const time = (value) =>
    new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const day = (value) =>
    new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

export default function ChatThread({
    messages,
    onSend,
    onTyping,
    staffTyping,
    connected,
    loading,
    error,
    compact = false,
    emptyHint,
    // Which side of the conversation "you" are. The customer views their own
    // messages as mine; staff view theirs. Without this the admin panel would
    // show the customer's words as its own.
    mineRole = "customer",
    typingLabel = "4STAR is typing…",
}) {
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    // Follow the conversation as it grows, and when someone starts typing.
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, staffTyping]);

    async function submit(event) {
        event.preventDefault();

        const text = draft.trim();
        if (!text || sending) return;

        setSending(true);
        // Cleared straight away so the box feels responsive; restored below if
        // the send fails, so nothing is silently lost.
        setDraft("");

        const result = await onSend(text);

        if (!result?.ok) setDraft(text);

        setSending(false);
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className={`flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-5 py-6"}`}
            >
                {loading ? (
                    <p className="py-8 text-center text-[0.875rem] text-ink-faint">
                        Loading your messages…
                    </p>
                ) : messages.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="mb-2 text-[0.9375rem] text-ink">
                            No messages yet.
                        </p>
                        <p className="mx-auto max-w-xs text-[0.875rem] leading-6 text-ink-muted">
                            {emptyHint ??
                                "Ask us anything — a size, a price, a delivery date. We reply here."}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {messages.map((message, index) => {
                            const mine = message.senderRole === mineRole;
                            const stamp = day(message.createdAt);

                            // Compared against the previous message rather than
                            // a running variable — reassigning one during render
                            // misbehaves when React replays a render.
                            const previous = messages[index - 1];
                            const newDay = !previous || day(previous.createdAt) !== stamp;

                            return (
                                <li key={message.id}>
                                    {newDay ? (
                                        <p className="my-4 text-center text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                                            {stamp}
                                        </p>
                                    ) : null}

                                    <div className={mine ? "flex justify-end" : "flex justify-start"}>
                                        <div
                                            className={`max-w-[80%] border px-3.5 py-2.5 ${
                                                mine
                                                    ? "border-navy bg-navy text-white"
                                                    : "border-rule bg-surface text-ink"
                                            }`}
                                        >
                                            {!mine ? (
                                                <p className="mb-1 text-[0.6875rem] uppercase tracking-[0.12em] text-accent">
                                                    {message.sender?.firstName ??
                                                        (message.senderRole === "staff"
                                                            ? "4STAR"
                                                            : "Customer")}
                                                </p>
                                            ) : null}

                                            <p className="whitespace-pre-line text-[0.9375rem] leading-6">
                                                {message.body}
                                            </p>

                                            {message.product ? (
                                                <p
                                                    className={`mt-1.5 text-[0.75rem] ${
                                                        mine ? "text-white/70" : "text-ink-faint"
                                                    }`}
                                                >
                                                    About: {message.product.name}
                                                </p>
                                            ) : null}

                                            <p
                                                className={`mt-1 text-[0.6875rem] ${
                                                    mine ? "text-white/60" : "text-ink-faint"
                                                }`}
                                            >
                                                {time(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {staffTyping ? (
                    <p className="mt-3 text-[0.8125rem] text-ink-faint">{typingLabel}</p>
                ) : null}

                <div ref={endRef} />
            </div>

            {error ? (
                <p
                    role="alert"
                    className="border-t border-accent bg-panel px-4 py-2 text-[0.8125rem] text-accent"
                >
                    {error}
                </p>
            ) : null}

            <form onSubmit={submit} className="border-t border-rule bg-surface p-3">
                <div className="flex items-end gap-2">
                    <label htmlFor="chat-draft" className="sr-only">
                        Your message
                    </label>

                    <textarea
                        id="chat-draft"
                        rows={compact ? 2 : 3}
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            onTyping?.();
                        }}
                        onKeyDown={(event) => {
                            // Enter sends; Shift+Enter starts a new line.
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                submit(event);
                            }
                        }}
                        placeholder="Write a message…"
                        maxLength={2000}
                        className="min-h-[44px] flex-1 resize-none border border-rule bg-surface px-3 py-2 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-navy"
                    />

                    <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="border border-navy bg-navy px-4 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-40"
                    >
                        {sending ? "…" : "Send"}
                    </button>
                </div>

                {/* Only worth saying when it is not connected — "live" is the
                    expectation, so silence means working. */}
                {!connected && !loading ? (
                    <p className="mt-2 text-[0.75rem] text-ink-faint">
                        Not connected live — messages still send, replies may take a
                        moment to appear.
                    </p>
                ) : null}
            </form>
        </div>
    );
}
