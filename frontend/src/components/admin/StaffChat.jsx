"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "@/lib/session-config";
import ChatThread from "@/components/ChatThread";

// The staff side of a conversation. Same thread component the customer sees, so
// the two views cannot drift; the difference is that staff open a specific
// customer's thread rather than being locked to their own.

export default function StaffChat({ conversationId, initialMessages, customerName }) {
    const [messages, setMessages] = useState(initialMessages ?? []);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [customerTyping, setCustomerTyping] = useState(false);

    const socketRef = useRef(null);
    const typingTimer = useRef(null);

    const absorb = useCallback((message) => {
        setMessages((current) =>
            current.some((entry) => entry.id === message.id)
                ? current
                : [...current, message]
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        let socket = null;

        (async () => {
            try {
                const res = await fetch("/api/chat/ticket", { method: "POST" });
                if (!res.ok) return;

                const { ticket } = await res.json();
                if (cancelled || !ticket) return;

                socket = io(API_BASE, {
                    auth: { ticket },
                    transports: ["websocket", "polling"],
                });

                socketRef.current = socket;

                socket.on("connect", () => {
                    setConnected(true);
                    // Staff must ask for a thread; they are not in one by default.
                    socket.emit("conversation:open", { conversationId }, () => {
                        socket.emit("conversation:read", { conversationId });
                    });
                });

                socket.on("disconnect", () => setConnected(false));

                socket.on("message:new", (message) => {
                    if (message.conversationId !== conversationId) return;

                    absorb(message);

                    // Reading it as it arrives, since the thread is on screen.
                    socket.emit("conversation:read", { conversationId });
                });

                socket.on("typing", ({ from, conversationId: id }) => {
                    if (from !== "customer" || id !== conversationId) return;

                    setCustomerTyping(true);
                    clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => setCustomerTyping(false), 3000);
                });
            } catch {
                // Sending still works over HTTP below.
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(typingTimer.current);
            socket?.close();
            socketRef.current = null;
        };
    }, [conversationId, absorb]);

    const send = useCallback(
        async (body) => {
            setError(null);

            const socket = socketRef.current;

            if (socket?.connected) {
                const reply = await new Promise((resolve) => {
                    const timer = setTimeout(() => resolve(null), 4000);

                    socket.emit("message:send", { conversationId, body }, (response) => {
                        clearTimeout(timer);
                        resolve(response);
                    });
                });

                if (reply?.ok) {
                    absorb(reply.message);
                    return { ok: true };
                }

                if (reply && !reply.ok) {
                    setError(reply.message ?? "That message could not be sent.");
                    return { ok: false };
                }
            }

            // The admin panel has no proxy allowlist of its own, so the fallback
            // goes through a route handler that attaches the session token.
            try {
                const res = await fetch(`/api/admin/chat/${conversationId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body }),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setError(data.message ?? "That message could not be sent.");
                    return { ok: false };
                }

                absorb(data.message);
                return { ok: true };
            } catch {
                setError("Cannot reach the server. Please try again.");
                return { ok: false };
            }
        },
        [conversationId, absorb]
    );

    const notifyTyping = useCallback(() => {
        socketRef.current?.emit("typing", { conversationId });
    }, [conversationId]);

    return (
        <div className="flex h-[32rem] max-h-[70vh] flex-col border border-rule bg-panel">
            <header className="flex items-center justify-between border-b border-rule px-5 py-3">
                <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                    Replying as 4STAR
                </p>

                <p className="text-[0.75rem] text-ink-faint">
                    {connected ? "Live" : "Reconnecting…"}
                </p>
            </header>

            <div className="min-h-0 flex-1">
                <ChatThread
                    messages={messages}
                    onSend={send}
                    onTyping={notifyTyping}
                    staffTyping={customerTyping}
                    connected={connected}
                    loading={false}
                    error={error}
                    mineRole="staff"
                    typingLabel={`${customerName} is typing…`}
                    emptyHint={`${customerName} hasn't written anything yet.`}
                />
            </div>
        </div>
    );
}
