"use client";

import { useSyncExternalStore } from "react";

// The cart lives in localStorage so a visitor can fill it before signing in —
// only checkout requires an account. Read through useSyncExternalStore, like
// the comparison selection, so every badge and button on the page agrees.

const KEY = "4star.cart";
export const MAX_LINES = 50;
export const MAX_QUANTITY = 999;

const EMPTY = [];

const listeners = new Set();

let current = null;

// A line is identified by product plus its specification: the same mattress in
// two sizes is two lines, but adding the same size twice bumps the quantity.
export function lineKey(item) {
    return [
        item.productId ?? item.slug ?? "custom",
        item.sizeLabel ?? "",
        item.thicknessIn ?? "",
    ].join("|");
}

function readStorage() {
    try {
        const raw = window.localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        if (!Array.isArray(parsed) || parsed.length === 0) return EMPTY;

        // Drop anything malformed rather than rendering a broken line.
        const clean = parsed
            .filter((item) => item && (item.productId || item.slug) && item.name)
            .slice(0, MAX_LINES);

        return clean.length ? clean : EMPTY;
    } catch {
        return EMPTY;
    }
}

function emit() {
    listeners.forEach((listener) => listener());
}

function setCart(items) {
    current = items.length ? items : EMPTY;

    try {
        window.localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
        // Still works for this page view even if it cannot persist.
    }

    emit();
}

function subscribe(listener) {
    listeners.add(listener);

    const onStorage = (event) => {
        if (event.key !== KEY) return;
        current = readStorage();
        emit();
    };

    window.addEventListener("storage", onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

function getSnapshot() {
    if (current === null) current = readStorage();
    return current;
}

function getServerSnapshot() {
    return EMPTY;
}

const clampQuantity = (value) =>
    Math.max(1, Math.min(MAX_QUANTITY, Number.parseInt(value, 10) || 1));

export function addToCart(item) {
    const items = getSnapshot();
    const key = lineKey(item);

    const existing = items.find((line) => lineKey(line) === key);

    if (existing) {
        setCart(
            items.map((line) =>
                lineKey(line) === key
                    ? { ...line, quantity: clampQuantity(line.quantity + (item.quantity ?? 1)) }
                    : line
            )
        );
        return { added: false, merged: true };
    }

    if (items.length >= MAX_LINES) {
        return { added: false, merged: false, full: true };
    }

    setCart([...items, { ...item, quantity: clampQuantity(item.quantity ?? 1) }]);
    return { added: true, merged: false };
}

export function updateQuantity(key, quantity) {
    setCart(
        getSnapshot().map((line) =>
            lineKey(line) === key ? { ...line, quantity: clampQuantity(quantity) } : line
        )
    );
}

export function removeFromCart(key) {
    setCart(getSnapshot().filter((line) => lineKey(line) !== key));
}

export function clearCart() {
    setCart(EMPTY);
}

export function useCart() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Total units across every line, for the header badge.
export function countUnits(items) {
    return items.reduce((total, line) => total + (Number(line.quantity) || 0), 0);
}
