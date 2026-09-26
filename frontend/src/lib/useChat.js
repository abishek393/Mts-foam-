"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "./session-config";

// Live chat for the customer side.
//
// The socket carries messages the moment they are sent. If it cannot connect —
// a network that blocks WebSocket, or the API being briefly down — sending
// falls back to plain HTTP, so the chat still works, just without the push.

export default function useChat({ enabled = true } = {}) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [staffTyping, setStaffTyping] = useState(false);
    // Replies the customer has not looked at. Seeded from the server, then
    // moved by socket events — never recomputed in an effect.
    const [unread, setUnread] = useState(0);

    const socketRef = useRef(null);
    const typingTimer = useRef(null);

    // Adds a message unless it is already there — a message sent over the
    // socket arrives back through the room broadcast as well as the ack.
    const absorb = useCallback((message) => {
        setMessages((current) =>
            current.some((entry) => entry.id === message.id)
                ? current
                : [...current, message]
        );
    }, []);

    // History comes over HTTP: it is a plain read, and having it before the
    // socket opens means the thread is never blank while connecting.
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/proxy/api/chat/mine");
                const data = await res.json().catch(() => ({}));

                if (cancelled) return;

                if (!res.ok) {
                    setError(data.message ?? "Could not load your messages.");
                } else {
                    setMessages(data.messages ?? []);
                    setUnread(data.unread ?? 0);
                }
            } catch {
                if (!cancelled) setError("Could not load your messages.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

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

                socket.on("connect", () => setConnected(true));
                socket.on("disconnect", () => setConnected(false));

                // A ticket only lasts a minute, so a reconnect after a long
                // drop needs a fresh one rather than retrying the stale ticket.
                socket.on("connect_error", async () => {
                    setConnected(false);

                    try {
                        const retry = await fetch("/api/chat/ticket", { method: "POST" });
                        if (!retry.ok) return;

                        const { ticket: fresh } = await retry.json();
                        if (fresh && socket) socket.auth = { ticket: fresh };
                    } catch {
                        // Left to socket.io's own retry schedule.
                    }
                });

                socket.on("message:new", (message) => {
                    absorb(message);

                    // Counting here, in the event, keeps the badge correct
                    // without a render-time comparison.
                    if (message.senderRole === "staff") {
                        setUnread((count) => count + 1);
                    }
                });

                socket.on("typing", ({ from }) => {
                    if (from !== "staff") return;

                    setStaffTyping(true);
                    clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => setStaffTyping(false), 3000);
                });
            } catch {
                // Falls back to HTTP sending; nothing to show the user.
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(typingTimer.current);
            socket?.close();
            socketRef.current = null;
        };
    }, [enabled, absorb]);

    const send = useCallback(
        async (body, { productId } = {}) => {
            const text = String(body ?? "").trim();
            if (!text) return { ok: false };

            setError(null);

            const socket = socketRef.current;

            if (socket?.connected) {
                const reply = await new Promise((resolve) => {
                    // If the server never acks, fall through to HTTP rather
                    // than leaving the message apparently unsent.
                    const timer = setTimeout(() => resolve(null), 4000);

                    socket.emit("message:send", { body: text, productId }, (response) => {
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

            try {
                const res = await fetch("/api/proxy/api/chat/mine", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body: text, productId }),
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
        [absorb]
    );

    const markRead = useCallback(() => {
        setUnread(0);

        const socket = socketRef.current;

        if (socket?.connected) {
            socket.emit("conversation:read", {});
            return;
        }

        fetch("/api/proxy/api/chat/mine/read", { method: "POST" }).catch(() => {});
    }, []);

    const notifyTyping = useCallback(() => {
        socketRef.current?.emit("typing", {});
    }, []);

    return {
        messages,
        send,
        markRead,
        notifyTyping,
        connected,
        loading,
        error,
        staffTyping,
        unread,
    };
}
