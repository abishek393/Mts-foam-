// Shared between the session route handler, the API proxy and the server-side
// session reader. Kept separate so importing it never pulls in next/headers.

export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const SESSION_COOKIE = "4star_session";

// Matches the 7-day expiry the API signs its tokens with.
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
