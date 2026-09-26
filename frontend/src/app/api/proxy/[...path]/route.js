import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";

// Client components can't read the httpOnly session cookie, so authenticated
// calls go through here: the browser calls /api/proxy/... and this handler
// attaches the bearer token server-side.
//
// This grants no more access than the user already has — it forwards their own
// token to the same API they could call directly — but it keeps the token out
// of the browser.

// Only these API paths may be reached through the proxy. Without this an
// attacker-supplied path could be used to probe unrelated endpoints with the
// victim's token.
const ALLOWED = [
    /^api\/inquiries$/,
    /^api\/inquiries\/mine$/,
    /^api\/auth\/me$/,
    /^api\/orders$/,
    /^api\/orders\/mine$/,
    /^api\/orders\/mine\/\d+$/,
    /^api\/favourites$/,
    /^api\/favourites\/\d+$/,
    // Reviews. Only the customer's own — moderation lives behind the admin
    // panel's server actions, not here.
    /^api\/reviews$/,
    /^api\/reviews\/mine$/,
    /^api\/reviews\/\d+$/,
    // The payment QR shown at checkout. Public on the API, but routed through
    // here so the page talks to one origin.
    /^api\/payment\/details$/,
    // Live chat, customer side only. The staff endpoints are reached from the
    // admin panel's own server-side calls, never through here.
    /^api\/chat\/mine$/,
    /^api\/chat\/mine\/read$/,
];

async function forward(request, context, method) {
    const { path } = await context.params;
    const target = path.join("/");

    if (!ALLOWED.some((pattern) => pattern.test(target))) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return Response.json(
            { message: "You need to sign in to do that." },
            { status: 401 }
        );
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    };

    let body;

    if (method !== "GET" && method !== "DELETE") {
        body = await request.text();
        headers["Content-Type"] = "application/json";
    }

    let upstream;

    try {
        upstream = await fetch(`${API_BASE}/${target}${new URL(request.url).search}`, {
            method,
            headers,
            body,
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

export const GET = (request, context) => forward(request, context, "GET");
export const POST = (request, context) => forward(request, context, "POST");
export const DELETE = (request, context) => forward(request, context, "DELETE");
export const PATCH = (request, context) => forward(request, context, "PATCH");
