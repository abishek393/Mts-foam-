import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "./session-config";

// Server-side reads for the marketer panel and the admin's view of it.

async function get(path, fallback) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return fallback;

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
        });

        if (!res.ok) {
            console.error(`[marketer] GET ${path} -> ${res.status}`);
            return fallback;
        }

        return await res.json();
    } catch (error) {
        console.error(`[marketer] GET ${path}:`, error.message);
        return fallback;
    }
}

export async function getMyFieldOrders() {
    const data = await get("/api/marketer/orders", { orders: [] });
    return data.orders ?? [];
}

export async function getMyReports() {
    const data = await get("/api/marketer/reports", { reports: [], today: null });
    return data;
}

export async function getAllReports(filters = {}) {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) search.set(key, value);
    }

    const query = search.toString();

    return get(`/api/marketer/admin/reports${query ? `?${query}` : ""}`, {
        reports: [],
        marketers: [],
    });
}
