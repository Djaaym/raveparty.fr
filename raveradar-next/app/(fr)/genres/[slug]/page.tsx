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
      alternates: alternates(`/genres/${params.slug}`, "fr"),
      title: "Genre — RaveRadar",
    };
  return {
    alternates: alternates(`/genres/${params.slug}`, "fr"),
    title: `${g} — événements & soirées en Europe | RaveRadar`,
    description: `${genreDescL(g, "fr")}. Découvre les meilleurs événements ${g} en Europe : festivals, clubs et warehouses.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <GenrePage lang="fr" slug={params.slug} />;
}
