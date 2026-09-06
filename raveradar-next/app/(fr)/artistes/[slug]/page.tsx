import { alternates, pageMeta, seoTitle } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { artistPhoto } from "@/lib/artist-photos";
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
      title: "Artiste - RaveRadar",
    };
  const n = eventsForArtist(a.slug).length;
  // Les genres attribués, pas l'union brute : la description reprenait tous les styles
  // de toutes les affiches où l'artiste apparaît.
  // Vide pour les artistes qu'aucune des onze catégories ne décrit (Sting, Pulp, le
  // Trio Xenakis, programmés sur des festivals multi-genres) : la phrase disparaît
  // alors entièrement, au lieu de finir sur un « Genres : . » creux.
  const styles = [...artistGenres(a), ...artistSubGenres(a)].join(", ");
  /* Le portrait de l'artiste comme image de partage quand il existe (336 fiches) :
     c'est la personne dont parle la page, et une carte de partage sans visage se
     confond avec toutes les autres. Sinon `pageMeta()` retombe sur l'image du site. */
  const photo = artistPhoto(a.slug);
  return pageMeta({
    lang: "fr",
    path: `/artistes/${params.slug}`,
    title: seoTitle(`${a.name} - dates, line-ups & festivals | RaveRadar`),
    description: `Où joue ${a.name} ? ${n} événement(s) référencé(s) : dates, line-ups, lieux et billetterie.${styles ? ` Genres : ${styles}.` : ""}`,
    image: photo ? `${SITE_URL}/artists/${photo.file}` : null,
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ArtistPage lang="fr" slug={params.slug} />;
}
