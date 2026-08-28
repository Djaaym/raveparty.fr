import { alternates } from "@/lib/seo";
import type { Metadata } from "next";
import ArtistPage from "@/components/ArtistPage";
import { ARTISTS, artistBySlug, artistGenres, artistSubGenres, eventsForArtist } from "@/lib/artists";

export function generateStaticParams() {
  return ARTISTS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = artistBySlug(params.slug);
  if (!a)
    return {
      alternates: alternates(`/artistes/${params.slug}`, "fr"),
      title: "Artiste — RaveRadar",
    };
  const n = eventsForArtist(a.slug).length;
  // Les genres attribués, pas l'union brute : la description reprenait tous les styles
  // de toutes les affiches où l'artiste apparaît.
  const styles = [...artistGenres(a), ...artistSubGenres(a)].join(", ");
  return {
    alternates: alternates(`/artistes/${params.slug}`, "fr"),
    title: `${a.name} — dates, line-ups & festivals | RaveRadar`,
    description: `Où joue ${a.name} ? ${n} événement(s) référencé(s) : dates, line-ups, lieux et billetterie. Genres : ${styles}.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ArtistPage lang="fr" slug={params.slug} />;
}
