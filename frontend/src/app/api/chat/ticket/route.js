import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";

// Mints a short-lived ticket the browser can hand to the chat socket.
//
// The session JWT is httpOnly and must stay that way — handing it to page
// JavaScript would undo the whole reason it is a cookie. So the token is read
// here, server-side, and exchanged for a ticket that is valid for sixty seconds
// and good for nothing but opening a socket.

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return Response.json({ message: "You need to sign in to chat." }, { status: 401 });
    }

    let upstream;

    try {
        upstream = await fetch(`${API_BASE}/api/chat/ticket`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
        });
    } catch {
        return Response.json(
            { message: "Cannot reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await upstream.json().catch(() => ({}));

    return Response.json(data, { status: upstream.status });
}
