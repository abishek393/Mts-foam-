"use client";

import { useSyncExternalStore } from "react";

// Comparison selection lives in localStorage so it survives navigation and
// reloads. It is an external store, so it is read through
// useSyncExternalStore rather than copied into state inside an effect —
// that keeps every card on the page in agreement and hydrates correctly.

const KEY = "4star.compare";
export const MAX_COMPARE = 3;

// Stable empty reference: getSnapshot must return the same object when nothing
// has changed, or React re-renders forever.
const EMPTY = [];

const listeners = new Set();

// Mirrors localStorage. Null means "not read yet".
let current = null;

function readStorage() {
    try {
        const raw = window.localStorage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        return Array.isArray(parsed) && parsed.length
            ? parsed.slice(0, MAX_COMPARE)
            : EMPTY;
    } catch {
        // Private mode, cleared storage, or blocked site data.
        return EMPTY;
    }
}

function emit() {
    listeners.forEach((listener) => listener());
}

function setSelection(slugs) {
    current = slugs.length ? slugs : EMPTY;

    try {
        window.localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
        // Selection still works for this page view even if it can't persist.
    }

    emit();
}

function subscribe(listener) {
    listeners.add(listener);

    // Another tab changing the selection should be reflected here too.
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

// The server has no localStorage, so it always renders an empty selection.
function getServerSnapshot() {
    return EMPTY;
}

export function toggleCompare(slug) {
    const selection = getSnapshot();

    if (selection.includes(slug)) {
        setSelection(selection.filter((item) => item !== slug));
    } else if (selection.length < MAX_COMPARE) {
        setSelection([...selection, slug]);
    }
}

export function removeFromCompare(slug) {
    setSelection(getSnapshot().filter((item) => item !== slug));
}

export function clearCompare() {
    setSelection(EMPTY);
}

// Replaces the whole selection — used when a ?slugs= link is opened.
export function replaceCompare(slugs) {
    setSelection(slugs.filter(Boolean).slice(0, MAX_COMPARE));
}

export function useCompare() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
