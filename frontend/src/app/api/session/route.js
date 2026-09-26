import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-config";

// Proxies sign-in, registration and Google sign-in to the Express API and
// stores the returned JWT in an httpOnly cookie. The token is never exposed to
// client-side JavaScript, so a script injected into the page cannot read or
// exfiltrate it.

// Only these modes may be reached, each mapped to a fixed API path — the mode
// is never interpolated into the URL, so it cannot be used to reach an
// endpoint that was not meant to be callable from the browser.
const MODES = {
    login: "/api/auth/login",
    register: "/api/auth/register",
    "register-verify": "/api/auth/register/verify",
    "register-resend": "/api/auth/register/resend",
    google: "/api/auth/google",
};

export async function POST(request) {
    let body;

    try {
        body = await request.json();
    } catch {
        return Response.json({ message: "Invalid request body." }, { status: 400 });
    }

    const { mode, ...credentials } = body;
    const path = MODES[mode];

    if (!path) {
        return Response.json(
            { message: `Unknown mode '${mode}'.` },
            { status: 400 }
        );
    }

    let upstream;

    try {
        upstream = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            cache: "no-store",
        });
    } catch {
        return Response.json(
            { message: "Cannot reach the server. Please try again." },
            { status: 503 }
        );
    }

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
        // Pass the API's own validation messages straight through.
        return Response.json(data, { status: upstream.status });
    }

    // Starting a registration, or asking for a fresh code, succeeds without
    // signing anyone in — there is no account yet. Nothing to store, so the
    // response goes back untouched for the form to act on.
    if (!data.token) {
        return Response.json(data, { status: upstream.status });
    }

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE,
    });

    // Upstream status is forwarded rather than flattened to 200, so a created
    // account still reports 201.
    return Response.json(
        { message: data.message, user: data.user },
        { status: upstream.status }
    );
}

// Log out.
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);

    return Response.json({ message: "Signed out." });
}
