import type { MetadataRoute } from "next";
import { ALL_GENRES, genreSlug, FESTIVALS, eventSlug } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { SHOWS } from "@/lib/shows";
import { VENUES } from "@/lib/venues";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set<string>(["", "/explore", "/map", "/organizer", "/account", "/genres", "/villes", "/artistes", "/lieux"]);
  ALL_GENRES.forEach((g) => paths.add(`/genres/${genreSlug(g)}`));
  PLACES.forEach((p) => {
    paths.add(`/rave-party/${p.slug}`);
    paths.add(`/festival/${p.slug}`);
  });
  FESTIVALS.forEach((e) => paths.add(`/festival/${eventSlug(e)}`));
  ARTISTS.forEach((a) => paths.add(`/artistes/${a.slug}`));
  VENUES.forEach((v) => paths.add(`/lieux/${v.slug}`));
  SHOWS.forEach((s) => paths.add(`/show/${s.slug}`));

  const now = new Date();
  const langs = ["", "/en"];
  const out: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    for (const l of langs) {
      out.push({
        url: `${SITE_URL}${l}${path}` || SITE_URL,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : path.includes("/") ? 0.7 : 0.8,
      });
    }
  }
  return out;
}
