import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "./session-config";

// Server-side session read. Returns the signed-in user, or null.
// Never cached — a stale session would show the wrong person's name.
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.user ?? null;
    } catch {
        return null;
    }
}

// The customer's own inquiries, for /account.
export async function getMyInquiries() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${API_BASE}/api/inquiries/mine`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.inquiries ?? [];
    } catch {
        return [];
    }
}

// Saved products for the signed-in customer. Returns slugs and ids so the
// heart on each card can render correctly on the server.
export async function getMyFavourites() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return { products: [], ids: [] };

    try {
        const res = await fetch(`${API_BASE}/api/favourites`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) return { products: [], ids: [] };

        const data = await res.json();
        const products = data.products ?? [];

        return { products, ids: products.map((product) => product.id) };
    } catch {
        return { products: [], ids: [] };
    }
}

// The customer's order requests, for /account and /orders.
export async function getMyOrders() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${API_BASE}/api/orders/mine`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.orders ?? [];
    } catch {
        return [];
    }
}
