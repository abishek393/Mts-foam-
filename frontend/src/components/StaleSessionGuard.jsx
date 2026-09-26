"use client";

import { useEffect } from "react";

// Signing out clears the cookie, but it cannot clear what the browser already
// drew. A page restored from the back/forward cache is handed back whole, from
// memory, without a request reaching the server -- so after signing out, Back
// can still show a fully rendered admin panel. Nothing on it works, since every
// action carries no cookie now, but it looks like the session is still open.
//
// Cache-Control would normally forbid that, except Next sets its own header on
// a dynamic page and overwrites anything the config or the proxy asks for. So
// the panel says so itself: when it comes back from the cache, it reloads, and
// that request meets the proxy and the layout guard like any other.
export default function StaleSessionGuard() {
    useEffect(() => {
        function onPageShow(event) {
            if (event.persisted) window.location.reload();
        }

        window.addEventListener("pageshow", onPageShow);

        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    return null;
}
