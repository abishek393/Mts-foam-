import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";

// Payment screenshots, in and out.
//
// The general /api/proxy route cannot carry these: it forces
// Content-Type: application/json on the way out and JSON-parses the reply, so
// it can neither send a file nor return an image. This does both, attaching the
// httpOnly session token server-side exactly as the proxy does.
//
// It grants no access of its own — the API decides who may read a given
// screenshot, and refuses anyone but the customer who uploaded it or staff.

const orderPath = async (context) => {
    const { orderId } = await context.params;
    return /^\d+$/.test(orderId) ? orderId : null;
};

const token = async () => {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
};

// Upload a screenshot against an order.
export async function POST(request, context) {
    const orderId = await orderPath(context);

    if (!orderId) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const session = await token();

    if (!session) {
        return Response.json(
            { message: "You need to sign in to do that." },
            { status: 401 }
        );
    }

    let upstream;

    try {
        // The multipart body is forwarded untouched — fetch sets the boundary
        // header itself, so Content-Type must not be set here.
        upstream = await fetch(`${API_BASE}/api/orders/${orderId}/payment-proof`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session}`, Accept: "application/json" },
            body: await request.formData(),
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

// Stream a screenshot back for viewing.
export async function GET(request, context) {
    const orderId = await orderPath(context);

    if (!orderId) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const session = await token();

    if (!session) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    let upstream;

    try {
        upstream = await fetch(`${API_BASE}/api/orders/${orderId}/payment-proof`, {
            headers: { Authorization: `Bearer ${session}` },
            cache: "no-store",
        });
    } catch {
        return Response.json(
            { message: "Cannot reach the server. Please try again." },
            { status: 503 }
        );
    }

    if (!upstream.ok) {
        return Response.json(
            { message: "That screenshot is not available." },
            { status: upstream.status }
        );
    }

    return new Response(upstream.body, {
        status: 200,
        headers: {
            "Content-Type":
                upstream.headers.get("content-type") ?? "application/octet-stream",
            "Content-Disposition": `inline; filename="payment-${orderId}"`,
            // A bank statement must not sit in a shared cache.
            "Cache-Control": "private, no-store",
        },
    });
}
