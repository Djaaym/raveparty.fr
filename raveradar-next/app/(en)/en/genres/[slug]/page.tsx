import { alternates } from "@/lib/seo";
import type { Metadata } from "next";
import GenrePage from "@/components/GenrePage";
import { ALL_GENRES, genreSlug, genreFromSlug, genreDescL } from "@/lib/data";

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
  return {
    alternates: alternates(`/genres/${params.slug}`, "en"),
    title: `${g} — events & parties across Europe | RaveRadar`,
    description: `${genreDescL(g, "en")}. Discover the best ${g} events in Europe: festivals, clubs and warehouses.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <GenrePage lang="en" slug={params.slug} />;
}
