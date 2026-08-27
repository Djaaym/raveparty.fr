import { alternates } from "@/lib/seo";
import type { Metadata } from "next";
import GenrePage from "@/components/GenrePage";
import { ALL_GENRES, genreSlug, genreFromSlug, genreDescL } from "@/lib/data";
import { genreProfile, pickL } from "@/lib/genres";

export function generateStaticParams() {
  return ALL_GENRES.map((g) => ({ slug: genreSlug(g) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = genreFromSlug(params.slug);
  if (!g)
    return {
      alternates: alternates(`/genres/${params.slug}`, "en"),
      title: "Genre — RaveRadar",
    };
  const prof = genreProfile(g);
  return {
    alternates: alternates(`/genres/${params.slug}`, "en"),
    title: `${g} — events & parties across Europe | RaveRadar`,
    description: prof
      ? `${pickL(prof.hook, "en")} ${prof.bpm} BPM, ${pickL(prof.origin, "en")}. Every upcoming ${g} date in Europe.`
      : `${genreDescL(g, "en")}. Discover the best ${g} events in Europe: festivals, clubs and warehouses.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <GenrePage lang="en" slug={params.slug} />;
}
