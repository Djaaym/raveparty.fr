import type { MetadataRoute } from "next";
import { EVENTS, ALL_GENRES, genreSlug, eventPath, isPast } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { VENUES } from "@/lib/venues";
import { COUNTRIES_INDEX } from "@/lib/countries";
import { SITE_URL } from "@/lib/site";

type Entry = { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] };

/**
 * One entry per language-agnostic path; both language variants are emitted, each
 * declaring the other via `alternates.languages` so the FR and EN trees don't
 * compete. Priority follows how much the page moves: dated listings change
 * weekly, a finished edition never does.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/explore", priority: 0.9, changeFrequency: "daily" },
    { path: "/rave-party/ce-week-end", priority: 0.9, changeFrequency: "daily" },
    { path: "/rave-party/autour-de-moi", priority: 0.8, changeFrequency: "daily" },
    { path: "/villes", priority: 0.8, changeFrequency: "weekly" },
    { path: "/pays", priority: 0.8, changeFrequency: "weekly" },
    { path: "/genres", priority: 0.8, changeFrequency: "weekly" },
    { path: "/artistes", priority: 0.7, changeFrequency: "weekly" },
    { path: "/lieux", priority: 0.7, changeFrequency: "weekly" },
    { path: "/map", priority: 0.6, changeFrequency: "weekly" },
    { path: "/organizer", priority: 0.5, changeFrequency: "monthly" },
    { path: "/account", priority: 0.3, changeFrequency: "monthly" },
  ];

  ALL_GENRES.forEach((g) => entries.push({ path: `/genres/${genreSlug(g)}`, priority: 0.8, changeFrequency: "weekly" }));
  PLACES.forEach((p) => {
    entries.push({ path: `/rave-party/${p.slug}`, priority: 0.9, changeFrequency: "weekly" });
    entries.push({ path: `/festival/${p.slug}`, priority: 0.8, changeFrequency: "weekly" });
  });
  EVENTS.forEach((e) => {
    const done = isPast(e);
    entries.push({
      path: eventPath(e),
      priority: done ? 0.4 : e.type === "Festival" ? 0.9 : 0.7,
      changeFrequency: done ? "yearly" : "weekly",
    });
  });
  COUNTRIES_INDEX.forEach((c) => entries.push({ path: `/pays/${c.slug}`, priority: 0.8, changeFrequency: "weekly" }));
  ARTISTS.forEach((a) => entries.push({ path: `/artistes/${a.slug}`, priority: 0.6, changeFrequency: "weekly" }));
  VENUES.forEach((v) => entries.push({ path: `/lieux/${v.slug}`, priority: 0.6, changeFrequency: "weekly" }));
  // No `/show/` entries: those URLs are 301 forwarders now, not pages.

  const now = new Date();
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, priority, changeFrequency } of entries) {
    if (seen.has(path)) continue;
    seen.add(path);
    const fr = `${SITE_URL}${path}`;
    const en = `${SITE_URL}/en${path}`;
    const languages = { "fr-FR": fr, "en-GB": en, "x-default": fr };
    out.push({ url: fr, lastModified: now, changeFrequency, priority, alternates: { languages } });
    out.push({ url: en, lastModified: now, changeFrequency, priority: priority * 0.9, alternates: { languages } });
  }
  return out;
}
