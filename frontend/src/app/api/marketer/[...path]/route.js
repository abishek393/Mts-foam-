import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";
import { getSession } from "@/lib/auth";

// The marketer panel's writes, and the admin's PDF downloads.
//
// Kept separate from /api/proxy because that one is the customer surface: its
// allowlist is deliberately narrow and JSON-only, and PDFs have to stream
// through as bytes rather than be parsed.

const ALLOWED = [
    // Marketer's own work.
    { pattern: /^orders$/, roles: ["marketer", "admin"], methods: ["GET", "POST"] },
    { pattern: /^reports$/, roles: ["marketer", "admin"], methods: ["GET", "POST"] },
    // Admin review and downloads.
    { pattern: /^admin\/reports$/, roles: ["admin"], methods: ["GET"] },
    { pattern: /^admin\/reports\/pdf$/, roles: ["admin"], methods: ["GET"] },
    { pattern: /^admin\/reports\/\d+$/, roles: ["admin"], methods: ["PATCH"] },
    { pattern: /^admin\/reports\/\d+\/pdf$/, roles: ["admin"], methods: ["GET"] },
    { pattern: /^admin\/orders\/\d+\/pdf$/, roles: ["admin", "employee"], methods: ["GET"] },
];

async function forward(request, context, method) {
    const { path } = await context.params;
    const target = path.join("/");

    const rule = ALLOWED.find(
        (entry) => entry.pattern.test(target) && entry.methods.includes(method)
    );

    if (!rule) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const user = await getSession();

    // Checked here so a wrong role gets a clean 404 rather than a raw API
    // error; the API checks again on its own.
    if (!user || !rule.roles.includes(user.role)) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    const headers = { Authorization: `Bearer ${token}`, Accept: "*/*" };
    let body;

    if (method !== "GET") {
        body = await request.text();
        headers["Content-Type"] = "application/json";
    }

    let upstream;

    try {
        upstream = await fetch(
            `${API_BASE}/api/marketer/${target}${new URL(request.url).search}`,
            { method, headers, body, cache: "no-store" }
        );
    } catch {
        return Response.json(
            { message: "Cannot reach the server. Please try again." },
            { status: 503 }
        );
    }

    // A PDF is piped straight back — parsing it as JSON would destroy it.
    const type = upstream.headers.get("content-type") ?? "";

    if (type.includes("application/pdf")) {
        return new Response(upstream.body, {
            status: upstream.status,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition":
                    upstream.headers.get("content-disposition") ?? "attachment",
                "Cache-Control": "private, no-store",
            },
        });
    }

    const data = await upstream.json().catch(() => ({}));

    return Response.json(data, { status: upstream.status });
}

export const GET = (request, context) => forward(request, context, "GET");
export const POST = (request, context) => forward(request, context, "POST");
export const PATCH = (request, context) => forward(request, context, "PATCH");
