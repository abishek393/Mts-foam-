"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API_BASE, SESSION_COOKIE } from "@/lib/session-config";
import { getSession } from "@/lib/auth";

// Every export here is a server action, and a server action is a public POST
// endpoint — the /admin layout guard does NOT protect it. So each one starts by
// re-checking the caller's role server-side. The API re-checks again on its
// own; this layer just fails fast with a readable message.

async function requireAdmin() {
    const user = await getSession();

    if (!user || user.role !== "admin") {
        return { user: null, token: null };
    }

    const cookieStore = await cookies();
    return { user, token: cookieStore.get(SESSION_COOKIE)?.value ?? null };
}

const DENIED = { ok: false, message: "You are not signed in as an administrator." };
const UNREACHABLE = { ok: false, message: "Cannot reach the server. Please try again." };

// Normalises the API's two error shapes — a single `message`, or `errors: []`
// from a Sequelize validation failure — into one thing a form can render.
function toResult(status, data, successMessage) {
    if (status >= 200 && status < 300) {
        return { ok: true, message: data.message ?? successMessage, data };
    }

    return {
        ok: false,
        message: data.message ?? `Request failed (${status}).`,
        errors: data.errors ?? null,
    };
}

// JSON request against the API, as the signed-in admin.
async function send(path, method, body, successMessage) {
    const { token } = await requireAdmin();

    if (!token) return DENIED;

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                ...(body !== undefined && { "Content-Type": "application/json" }),
            },
            ...(body !== undefined && { body: JSON.stringify(body) }),
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        return toResult(res.status, data, successMessage);
    } catch {
        return UNREACHABLE;
    }
}

// Multipart request — used only by the product form, which carries image files.
// The FormData is forwarded as-is; fetch sets the boundary header itself, so
// Content-Type must not be set here.
async function sendMultipart(path, method, formData, successMessage) {
    const { token } = await requireAdmin();

    if (!token) return DENIED;

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            body: formData,
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        return toResult(res.status, data, successMessage);
    } catch {
        return UNREACHABLE;
    }
}

// The catalogue is fetched with `next: { revalidate: 300 }`, so without this a
// change stays invisible on the public site for up to five minutes. The slug
// form clears every product page at once, which also covers a renamed slug and
// a deleted product whose slug the action never sees.
function revalidateCatalogue() {
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/products/[slug]", "page");
    // Featured products are rendered on the home page.
    revalidatePath("/");
}

// Form values arrive as strings. These turn them into what the API expects.
const text = (formData, name) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
};

const bool = (formData, name) => formData.get(name) === "on" || formData.get(name) === "true";

const int = (formData, name, fallback = 0) => {
    const parsed = Number.parseInt(formData.get(name) ?? "", 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

// Comma or newline separated input -> array of display strings.
const list = (formData, name) =>
    (formData.get(name) ?? "")
        .toString()
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);

// ─── Products ────────────────────────────────────────────────────────────────

// Builds the multipart body the product endpoints expect. Scalar fields go in
// as strings, list fields as JSON, and the images the admin chose to keep as a
// JSON array the controller appends new uploads to.
function productFormData(formData) {
    const payload = new FormData();

    const scalars = [
        "slug",
        "name",
        "group",
        "shortDescription",
        "description",
        "firmness",
        "coreSpec",
        "density",
        "keySpec",
        "leadTime",
    ];

    for (const field of scalars) {
        payload.set(field, formData.get(field) ?? "");
    }

    for (const field of ["thicknesses", "sizes", "applications"]) {
        payload.set(field, JSON.stringify(list(formData, field)));
    }

    // Features arrive as one hidden input per ticked box. The API derives the
    // category column from the first of them, so it is not sent separately.
    payload.set("features", JSON.stringify(formData.getAll("features")));

    // Blank means "no guarantee offered", which is not zero years.
    const warranty = formData.get("warrantyYears");
    payload.set(
        "warrantyYears",
        typeof warranty === "string" && warranty.trim() !== "" ? warranty.trim() : ""
    );

    payload.set("isFeatured", String(bool(formData, "isFeatured")));
    payload.set("isActive", String(bool(formData, "isActive")));
    payload.set("sortOrder", String(int(formData, "sortOrder")));

    // Existing images the admin did not remove.
    payload.set("images", JSON.stringify(formData.getAll("keepImages")));

    // New uploads. Empty file inputs still produce a File with size 0.
    for (const file of formData.getAll("images")) {
        if (file instanceof File && file.size > 0) {
            payload.append("images", file);
        }
    }

    return payload;
}

export async function createProduct(previous, formData) {
    const result = await sendMultipart(
        "/api/products",
        "POST",
        productFormData(formData),
        "Product created."
    );

    if (!result.ok) return result;

    revalidateCatalogue();
    redirect("/admin/products?created=1");
}

export async function updateProduct(previous, formData) {
    const id = formData.get("id");

    const result = await sendMultipart(
        `/api/products/${id}`,
        "PUT",
        productFormData(formData),
        "Product updated."
    );

    if (!result.ok) return result;

    revalidateCatalogue();
    revalidatePath(`/admin/products/${id}`);
    return result;
}

export async function deleteProduct(previous, formData) {
    const result = await send(
        `/api/products/${formData.get("id")}`,
        "DELETE",
        undefined,
        "Product deleted."
    );

    if (!result.ok) return result;

    revalidateCatalogue();
    return result;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

const offerBody = (formData) => ({
    title: text(formData, "title"),
    audience: formData.get("audience") ?? "consumer",
    description: text(formData, "description"),
    validityLabel: text(formData, "validityLabel"),
    validFrom: text(formData, "validFrom"),
    validTo: text(formData, "validTo"),
    eligibleProducts: list(formData, "eligibleProducts"),
    terms: text(formData, "terms"),
    bannerImage: text(formData, "bannerImage"),
    documentUrl: text(formData, "documentUrl"),
    isActive: bool(formData, "isActive"),
    sortOrder: int(formData, "sortOrder"),
});

export async function createOffer(previous, formData) {
    const result = await send("/api/offers", "POST", offerBody(formData), "Offer created.");

    if (!result.ok) return result;

    revalidatePath("/admin/offers");
    revalidatePath("/offers");
    redirect("/admin/offers?created=1");
}

export async function updateOffer(previous, formData) {
    const id = formData.get("id");
    const result = await send(`/api/offers/${id}`, "PUT", offerBody(formData), "Offer updated.");

    if (!result.ok) return result;

    revalidatePath("/admin/offers");
    revalidatePath(`/admin/offers/${id}`);
    revalidatePath("/offers");
    return result;
}

export async function deleteOffer(previous, formData) {
    const result = await send(
        `/api/offers/${formData.get("id")}`,
        "DELETE",
        undefined,
        "Offer deleted."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/offers");
    revalidatePath("/offers");
    return result;
}

// ─── Dealers ─────────────────────────────────────────────────────────────────

const dealerBody = (formData) => ({
    businessName: text(formData, "businessName"),
    city: text(formData, "city"),
    ward: text(formData, "ward"),
    type: formData.get("type") ?? "authorised",
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    isActive: bool(formData, "isActive"),
});

export async function createDealer(previous, formData) {
    const result = await send("/api/dealers", "POST", dealerBody(formData), "Dealer added.");

    if (!result.ok) return result;

    revalidatePath("/admin/dealers");
    revalidatePath("/dealers");
    return result;
}

export async function updateDealer(previous, formData) {
    const result = await send(
        `/api/dealers/${formData.get("id")}`,
        "PUT",
        dealerBody(formData),
        "Dealer updated."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/dealers");
    revalidatePath("/dealers");
    return result;
}

export async function deleteDealer(previous, formData) {
    const result = await send(
        `/api/dealers/${formData.get("id")}`,
        "DELETE",
        undefined,
        "Dealer removed."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/dealers");
    revalidatePath("/dealers");
    return result;
}

// ─── Dealer applications ─────────────────────────────────────────────────────

// Verifying creates the dealer's login and directory entry. When a brand new
// login is made the API returns a one-time password — there is no mail service,
// so it is passed straight back to the admin to hand over.
export async function verifyApplication(previous, formData) {
    const result = await send(
        `/api/dealer-applications/${formData.get("id")}/verify`,
        "PATCH",
        {
            city: text(formData, "city"),
            ward: text(formData, "ward"),
            type: formData.get("type") ?? undefined,
            reviewNote: text(formData, "reviewNote"),
        },
        "Application verified."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/applications");
    revalidatePath("/admin/dealers");
    revalidatePath("/dealers");

    return {
        ...result,
        temporaryPassword: result.data?.temporaryPassword ?? null,
        emailed: result.data?.emailed ?? false,
    };
}

// Put on hold: not a refusal. The API emails the applicant a one-off link to
// replace the document, and the application returns to pending when they do.
export async function holdApplication(previous, formData) {
    const result = await send(
        `/api/dealer-applications/${formData.get("id")}/hold`,
        "PATCH",
        {
            holdRequirements: text(formData, "holdRequirements"),
            reviewNote: text(formData, "reviewNote"),
        },
        "Application put on hold."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/applications");

    // The link is surfaced so it can be passed on by hand if the email failed.
    return {
        ...result,
        emailed: result.data?.emailed ?? false,
        resubmitLink: result.data?.resubmitLink ?? null,
    };
}

export async function rejectApplication(previous, formData) {
    const result = await send(
        `/api/dealer-applications/${formData.get("id")}/reject`,
        "PATCH",
        { reviewNote: text(formData, "reviewNote") },
        "Application rejected."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/applications");
    return { ...result, emailed: result.data?.emailed ?? false };
}

// ─── Inquiries & orders ──────────────────────────────────────────────────────

// Only the fields present in the form are sent — both controllers treat
// `undefined` as "leave alone", so a status-only change keeps the note.
function workflowBody(formData) {
    const body = {};

    if (formData.has("status")) body.status = formData.get("status");
    if (formData.has("internalNote")) body.internalNote = text(formData, "internalNote");

    if (formData.has("assignedTo")) {
        const value = formData.get("assignedTo");
        body.assignedTo = value === "" ? null : Number.parseInt(value, 10);
    }

    return body;
}

export async function updateInquiry(previous, formData) {
    const result = await send(
        `/api/inquiries/${formData.get("id")}`,
        "PATCH",
        workflowBody(formData),
        "Inquiry updated."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    return result;
}

export async function updateOrder(previous, formData) {
    const result = await send(
        `/api/orders/${formData.get("id")}`,
        "PATCH",
        workflowBody(formData),
        "Order updated."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return result;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUser(previous, formData) {
    const result = await send(
        "/api/users",
        "POST",
        {
            firstName: text(formData, "firstName"),
            lastName: text(formData, "lastName"),
            email: text(formData, "email"),
            password: formData.get("password"),
            phone: text(formData, "phone"),
            role: formData.get("role"),
        },
        "Account created."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/users");
    return result;
}

export async function updateUser(previous, formData) {
    const body = {
        firstName: text(formData, "firstName"),
        lastName: text(formData, "lastName"),
        email: text(formData, "email"),
        phone: text(formData, "phone"),
        role: formData.get("role"),
        isActive: bool(formData, "isActive"),
    };

    // An empty password box means "leave it alone", not "blank the password".
    const password = formData.get("password");
    if (typeof password === "string" && password !== "") body.password = password;

    const result = await send(
        `/api/users/${formData.get("id")}`,
        "PUT",
        body,
        "Account updated."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/users");
    return result;
}

export async function deleteUser(previous, formData) {
    const { user } = await requireAdmin();

    if (!user) return DENIED;

    // Deleting your own admin account would lock you out mid-session.
    if (String(user.id) === String(formData.get("id"))) {
        return { ok: false, message: "You cannot delete the account you are signed in with." };
    }

    const result = await send(
        `/api/users/${formData.get("id")}`,
        "DELETE",
        undefined,
        "Account deleted."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/users");
    return result;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

// Hiding is reversible and keeps the record, so it is the default remedy; the
// author is told on their own reviews page that it happened.
export async function setReviewVisibility(previous, formData) {
    const isVisible = formData.get("isVisible") === "true";

    const result = await send(
        `/api/reviews/${formData.get("id")}/visibility`,
        "PATCH",
        { isVisible, reason: text(formData, "reason") },
        isVisible ? "Review restored." : "Review hidden."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/reviews");
    revalidateCatalogue();
    return result;
}

export async function deleteReviewAsAdmin(previous, formData) {
    const result = await send(
        `/api/reviews/${formData.get("id")}/admin`,
        "DELETE",
        undefined,
        "Review deleted."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/reviews");
    revalidateCatalogue();
    return result;
}

// ─── Order payments ──────────────────────────────────────────────────────────

// Confirming a payment screenshot against the bank. The API refuses a refusal
// with no reason, because the customer is shown it.
export async function reviewOrderPayment(previous, formData) {
    const paymentStatus = formData.get("paymentStatus");

    const result = await send(
        `/api/orders/${formData.get("id")}/payment`,
        "PATCH",
        {
            paymentStatus,
            paymentNote: text(formData, "paymentNote"),
        },
        paymentStatus === "verified" ? "Payment verified." : "Payment refused."
    );

    if (!result.ok) return result;

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/orders");
    return result;
}
