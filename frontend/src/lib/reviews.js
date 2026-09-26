import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "./session-config";

// Server-side review reads. Public listings need no token; the customer's own
// reviews are read with theirs.

// A product's visible reviews, for the product page. Never cached — a review
// posted a moment ago should be there on the next load.
export async function getProductReviews(slug) {
    const empty = { reviews: [], count: 0, breakdown: {}, product: null };

    try {
        const res = await fetch(`${API_BASE}/api/products/${slug}/reviews`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
        });

        if (!res.ok) return empty;

        return await res.json();
    } catch (error) {
        console.error(`[reviews] ${slug}:`, error.message);
        return empty;
    }
}

// What the signed-in customer may review, and what they have written.
export async function getMyReviews() {
    const empty = { reviewable: [], reviews: [] };

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return empty;

    try {
        const res = await fetch(`${API_BASE}/api/reviews/mine`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
        });

        if (!res.ok) return empty;

        const data = await res.json();
        return { reviewable: data.reviewable ?? [], reviews: data.reviews ?? [] };
    } catch (error) {
        console.error("[reviews] mine:", error.message);
        return empty;
    }
}
