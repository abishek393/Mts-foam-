const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // Personal and transient pages: nothing here is worth indexing.
            // /admin is guarded server-side too — this only keeps it out of
            // search results, it is not what protects it.
            disallow: [
                "/account",
                "/orders",
                "/favourites",
                "/cart",
                "/checkout",
                "/admin",
                "/api/",
            ],
        },
        sitemap: `${BASE}/sitemap.xml`,
    };
}
