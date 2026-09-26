import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-config";

// A first gate in front of the staff areas, running before any page or layout
// code does.
//
// This only checks that a session cookie is PRESENT. It cannot check who you
// are: verifying the JWT needs the API's signing secret, which deliberately
// lives only on the Express side. The real check stays in each area's layout,
// which asks the API who the token belongs to and redirects anyone whose role
// is wrong. So this is defence in depth, not the guard itself — it turns a
// signed-out visit into a redirect before a page can run a single query.
//
// Setting no-store here would be the natural way to keep a signed-out
// browser from showing a cached panel, but Next writes its own
// Cache-Control over a dynamic page's response and the header never
// survives. StaleSessionGuard handles that case from inside the page.

const GUARDED = ["/admin", "/marketer"];

export default function proxy(request) {
    const { pathname, search } = request.nextUrl;

    const guarded = GUARDED.some(
        (base) => pathname === base || pathname.startsWith(`${base}/`)
    );

    if (!guarded) return NextResponse.next();

    if (!request.cookies.get(SESSION_COOKIE)?.value) {
        const login = new URL("/login", request.url);

        // Send them back where they were headed once they sign in.
        login.searchParams.set("next", `${pathname}${search}`);

        return NextResponse.redirect(login);
    }

    return NextResponse.next();
}

export const config = {
    // Static assets and the API routes are left alone; the API routes do their
    // own authorisation and must be able to answer a signed-out caller with a
    // 401 rather than an HTML redirect.
    matcher: ["/admin/:path*", "/marketer/:path*"],
};
