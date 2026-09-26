import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "./session-config";

// Server-only reads for the admin panel.
//
// Every function here runs on the server and attaches the session cookie's JWT
// as a bearer token. The token is httpOnly, so none of this is reachable from
// the browser — admin pages are server components, and their mutations go
// through the server actions in app/admin/actions.js.

export async function adminToken() {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

// Returns parsed JSON, or `fallback` if the call fails for any reason. A
// broken listing should render as an empty table with a notice, not crash the
// whole panel.
export async function adminGet(path, fallback) {
    const token = await adminToken();

    if (!token) return fallback;

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
        });

        if (!res.ok) {
            console.error(`[admin] GET ${path} -> ${res.status}`);
            return fallback;
        }

        return await res.json();
    } catch (error) {
        console.error(`[admin] GET ${path}:`, error.message);
        return fallback;
    }
}

// Builds "?a=1&b=2" from a params object, dropping empty values.
export const query = (params = {}) => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            search.set(key, value);
        }
    }

    const string = search.toString();
    return string ? `?${string}` : "";
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

const EMPTY_STATS = {
    stats: {
        inquiries: {},
        orders: {},
        applications: {},
        users: {},
        products: { total: 0, active: 0, inactive: 0, featured: 0 },
        dealers: { total: 0, active: 0, inactive: 0 },
        offers: { total: 0, active: 0, inactive: 0 },
    },
    recentInquiries: [],
    recentOrders: [],
};

export async function getStats() {
    return adminGet("/api/admin/stats", EMPTY_STATS);
}

// Staff who can be assigned work, for the assignment dropdowns.
export async function getAssignees() {
    const data = await adminGet("/api/admin/assignees", { staff: [] });
    return data.staff ?? [];
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getAdminProducts(filters = {}) {
    const data = await adminGet(`/api/admin/products${query(filters)}`, {
        products: [],
    });

    return data.products ?? [];
}

export async function getAdminProduct(id) {
    const data = await adminGet(`/api/admin/products/${id}`, { product: null });
    return data.product ?? null;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export async function getAdminOffers(filters = {}) {
    const data = await adminGet(`/api/admin/offers${query(filters)}`, { offers: [] });
    return data.offers ?? [];
}

export async function getAdminOffer(id) {
    const data = await adminGet(`/api/admin/offers/${id}`, { offer: null });
    return data.offer ?? null;
}

// ─── Dealers ─────────────────────────────────────────────────────────────────

export async function getAdminDealers(filters = {}) {
    return adminGet(`/api/admin/dealers${query(filters)}`, {
        dealers: [],
        cities: [],
    });
}

// ─── Dealer applications ─────────────────────────────────────────────────────

export async function getApplications(filters = {}) {
    const data = await adminGet(`/api/dealer-applications${query(filters)}`, {
        applications: [],
    });

    return data.applications ?? [];
}

// ─── Inquiries & orders ──────────────────────────────────────────────────────

export async function getAllInquiries(filters = {}) {
    const data = await adminGet(`/api/inquiries${query(filters)}`, { inquiries: [] });
    return data.inquiries ?? [];
}

export async function getAllOrders(filters = {}) {
    const data = await adminGet(`/api/orders${query(filters)}`, { orders: [] });
    return data.orders ?? [];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers() {
    const data = await adminGet("/api/users", { users: [] });
    return data.users ?? [];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function getAdminReviews(filters = {}) {
    const data = await adminGet(`/api/reviews${query(filters)}`, { reviews: [] });
    return data.reviews ?? [];
}

// ─── Live chat ───────────────────────────────────────────────────────────────

export async function getConversations(filters = {}) {
    const data = await adminGet(`/api/chat/conversations${query(filters)}`, {
        conversations: [],
    });

    return data.conversations ?? [];
}

export async function getConversation(id) {
    return adminGet(`/api/chat/conversations/${id}`, {
        conversation: null,
        messages: [],
    });
}
