import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";
import { getSession } from "@/lib/auth";

// HTTP fallback for a staff reply, used when the socket is not connected.
//
// The customer-facing /api/proxy allowlist deliberately excludes the staff chat
// endpoints, so this small handler carries them instead — role-checked here and
// again by the API.

const STAFF_ROLES = ["admin", "employee"];

export async function POST(request, context) {
    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const user = await getSession();

    if (!user || !STAFF_ROLES.includes(user.role)) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    let upstream;

    try {
        upstream = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: await request.text(),
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
