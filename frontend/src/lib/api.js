// Talks to the Express API. Server Components call these directly; client
// components go through the same helpers so the base URL lives in one place.

export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Catalogue content changes rarely, so it is revalidated on a timer rather than
// refetched on every render. Next 16 does not cache fetch by default.
const CATALOGUE_REVALIDATE = 300;

async function apiGet(path, { revalidate = CATALOGUE_REVALIDATE } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        next: { revalidate },
        headers: { Accept: "application/json" },
    });

    if (!res.ok) {
        throw new Error(`GET ${path} failed with ${res.status}`);
    }

    return res.json();
}

// A page should still render if the API is unreachable — an empty catalogue
// beats a crashed route.
async function safeGet(path, fallback, options) {
    try {
        return await apiGet(path, options);
    } catch (error) {
        console.error(`[api] ${path}:`, error.message);
        return fallback;
    }
}

const buildQuery = (params) => {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    }

    const string = query.toString();
    return string ? `?${string}` : "";
};

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(filters = {}) {
    const data = await safeGet(`/api/products${buildQuery(filters)}`, {
        products: [],
        count: 0,
    });

    return data.products;
}

export async function getFeaturedProducts() {
    return getProducts({ featured: "true" });
}

export async function getProduct(slug) {
    try {
        const data = await apiGet(`/api/products/${slug}`);
        return data.product;
    } catch {
        return null;
    }
}

export async function compareProducts(slugs) {
    try {
        const res = await fetch(`${API_BASE}/api/products/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs }),
            cache: "no-store",
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.products;
    } catch {
        return [];
    }
}

// ─── Dealers & offers ────────────────────────────────────────────────────────

export async function getDealers(filters = {}) {
    return safeGet(`/api/dealers${buildQuery(filters)}`, {
        dealers: [],
        cities: [],
        count: 0,
    });
}

export async function getOffers(filters = {}) {
    const data = await safeGet(`/api/offers${buildQuery(filters)}`, {
        offers: [],
        count: 0,
    });

    return data.offers;
}

// ─── Product image helper ────────────────────────────────────────────────────

// Seeded placeholders are local paths under /images; uploaded imagery is served
// by the API under /uploads. Both need to resolve to something loadable.
export function productImage(product, index = 0) {
    const image = product?.images?.[index];

    if (!image) return "/images/products/placeholder.svg";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads")) return `${API_BASE}${image}`;

    return image;
}
