"use client";
import { useFav } from "./useFavorites";

export default function FavButton({ id, className = "fav" }: { id: number; className?: string }) {
  const { on, toggle } = useFav(id);
  return (
    <button className={`${className} ${on ? "on" : ""}`} onClick={toggle} aria-label="Save">
      ♥
    </button>
  );
}
