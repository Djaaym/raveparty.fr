"use client";
import { useEffect, useState } from "react";

const KEY = "raveradar:favs";
const read = (): number[] =>
  typeof window !== "undefined" ? JSON.parse(localStorage.getItem(KEY) || "[]") : [];

export function readFavs(): number[] {
  return read();
}

/** Reactive favourite state for a single event, synced across the app. */
export function useFav(id: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(read().includes(id));
    sync();
    window.addEventListener("favs", sync);
    return () => window.removeEventListener("favs", sync);
  }, [id]);

  const toggle = () => {
    const f = read();
    const i = f.indexOf(id);
    i === -1 ? f.push(id) : f.splice(i, 1);
    localStorage.setItem(KEY, JSON.stringify(f));
    window.dispatchEvent(new Event("favs"));
  };
  return { on, toggle };
}
