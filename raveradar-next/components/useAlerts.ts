"use client";
import { useEffect, useState } from "react";
import type { AlertKind, StoredAlert } from "@/lib/alerts";
import { alertKey } from "@/lib/alerts";

/**
 * Mirrors the visitor's subscriptions in localStorage, the same way favourites already
 * work. There is no account behind `/account`, so this browser's memory is the only
 * honest answer to "what am I subscribed to" — the authoritative copy lives with the
 * email provider, keyed by address, and only the provider can list it.
 */
const KEY = "raveradar:alerts";

const read = (): StoredAlert[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export function readAlerts(): StoredAlert[] {
  return read();
}

export function removeAlert(kind: AlertKind, value: string) {
  const next = read().filter((a) => alertKey(a.kind, a.value) !== alertKey(kind, value));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("alerts"));
}

export function rememberAlert(a: Omit<StoredAlert, "at">) {
  const kept = read().filter((x) => alertKey(x.kind, x.value) !== alertKey(a.kind, a.value));
  kept.push({ ...a, at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(kept));
  window.dispatchEvent(new Event("alerts"));
}

/** Reactive list for `/account`, synced across components like `useFav`. */
export function useAlerts() {
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  useEffect(() => {
    const sync = () => setAlerts(read());
    sync();
    window.addEventListener("alerts", sync);
    return () => window.removeEventListener("alerts", sync);
  }, []);
  return alerts;
}

/** Whether this browser already set an alert on one specific thing. */
export function useHasAlert(kind: AlertKind, value: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(read().some((a) => alertKey(a.kind, a.value) === alertKey(kind, value)));
    sync();
    window.addEventListener("alerts", sync);
    return () => window.removeEventListener("alerts", sync);
  }, [kind, value]);
  return on;
}

/** Remembers the address so a second alert doesn't mean typing it again. */
export const readEmail = () => (typeof window === "undefined" ? "" : localStorage.getItem("raveradar:email") || "");
export const rememberEmail = (email: string) => localStorage.setItem("raveradar:email", email);
