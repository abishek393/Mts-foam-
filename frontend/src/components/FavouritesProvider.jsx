"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const FavouritesContext = createContext(null);

export function useFavourites() {
    const context = useContext(FavouritesContext);

    if (!context) {
        throw new Error("useFavourites must be used inside <FavouritesProvider>");
    }

    return context;
}

// Favourites are stored against the account, not the browser, so they follow
// the customer between devices. The server passes the current ids in, and this
// provider keeps them up to date as hearts are toggled.
export default function FavouritesProvider({ initialIds = [], signedIn, children }) {
    const router = useRouter();
    const [ids, setIds] = useState(initialIds);
    const [pending, setPending] = useState([]);

    const toggle = useCallback(
        async (productId) => {
            if (!signedIn) {
                // Saving requires an account, so send them to sign in first.
                router.push("/login?next=/favourites");
                return;
            }

            const saved = ids.includes(productId);

            // Optimistic: the heart fills immediately, and rolls back on failure.
            setIds((current) =>
                saved ? current.filter((id) => id !== productId) : [...current, productId]
            );
            setPending((current) => [...current, productId]);

            try {
                const res = await fetch(
                    saved ? `/api/proxy/api/favourites/${productId}` : "/api/proxy/api/favourites",
                    {
                        method: saved ? "DELETE" : "POST",
                        headers: saved ? undefined : { "Content-Type": "application/json" },
                        body: saved ? undefined : JSON.stringify({ productId }),
                    }
                );

                if (!res.ok) throw new Error("request failed");

                router.refresh();
            } catch {
                setIds((current) =>
                    saved ? [...current, productId] : current.filter((id) => id !== productId)
                );
            } finally {
                setPending((current) => current.filter((id) => id !== productId));
            }
        },
        [ids, signedIn, router]
    );

    const value = useMemo(
        () => ({
            ids,
            signedIn,
            toggle,
            isFavourite: (productId) => ids.includes(productId),
            isPending: (productId) => pending.includes(productId),
        }),
        [ids, pending, signedIn, toggle]
    );

    return (
        <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
    );
}
