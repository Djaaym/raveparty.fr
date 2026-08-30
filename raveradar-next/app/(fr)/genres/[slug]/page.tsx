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
      alternates: alternates(`/genres/${params.slug}`, "fr"),
      title: "Genre - RaveRadar",
    };
  /* La description reprend l'accroche de la fiche du style : « Un kick, une pièce noire,
     et huit heures devant soi. 125–150 BPM, Detroit… » dit ce qu'est le genre, là où la
     punchline de cinq mots ne disait rien de plus que le titre. */
  const prof = genreProfile(g);
  return {
    alternates: alternates(`/genres/${params.slug}`, "fr"),
    title: `${g} - événements & soirées en Europe | RaveRadar`,
    description: prof
      ? `${pickL(prof.hook, "fr")} ${prof.bpm} BPM, ${pickL(prof.origin, "fr")}. Toutes les dates ${g} à venir en Europe.`
      : `${genreDescL(g, "fr")}. Découvre les meilleurs événements ${g} en Europe : festivals, clubs et warehouses.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <GenrePage lang="fr" slug={params.slug} />;
}
