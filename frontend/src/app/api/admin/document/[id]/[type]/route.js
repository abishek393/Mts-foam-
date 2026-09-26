import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";
import { getSession } from "@/lib/auth";

// Streams a dealership application's registration or VAT document.
//
// These files sit outside the API's static mount on purpose — business
// registration and VAT papers must not be reachable by anyone who happens to
// hold a URL. The API serves them only to an authenticated admin, and the
// browser cannot attach a bearer token to an <a href>, so the request is made
// here instead and the bytes are piped back.
//
// The general /api/proxy route cannot do this: it JSON-parses every response.

const TYPES = new Set(["registration", "vat"]);

export async function GET(request, context) {
    const { id, type } = await context.params;

    if (!/^\d+$/.test(id) || !TYPES.has(type)) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const user = await getSession();

    if (!user || user.role !== "admin") {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    let upstream;

    try {
        upstream = await fetch(
            `${API_BASE}/api/dealer-applications/${id}/document/${type}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );
    } catch {
        return Response.json(
            { message: "Cannot reach the server. Please try again." },
            { status: 503 }
        );
    }

    if (!upstream.ok) {
        return Response.json(
            { message: "That document is not available." },
            { status: upstream.status }
        );
    }

    return new Response(upstream.body, {
        status: 200,
        headers: {
            "Content-Type":
                upstream.headers.get("content-type") ?? "application/octet-stream",
            // Shown in a tab rather than downloaded, and never cached to disk by
            // a shared proxy.
            "Content-Disposition": `inline; filename="${type}-${id}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
