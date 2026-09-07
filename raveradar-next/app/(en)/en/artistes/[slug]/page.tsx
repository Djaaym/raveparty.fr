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
      alternates: alternates(`/artistes/${params.slug}`, "en"),
      title: "Artist - RaveRadar",
    };
  const n = eventsForArtist(a.slug).length;
  const styles = [...artistGenres(a), ...artistSubGenres(a)].join(", ");
  /* Le portrait de l'artiste comme image de partage quand il existe (336 fiches) :
     c'est la personne dont parle la page, et une carte de partage sans visage se
     confond avec toutes les autres. Sinon `pageMeta()` retombe sur l'image du site. */
  const photo = artistPhoto(a.slug);
  return pageMeta({
    lang: "en",
    path: `/artistes/${params.slug}`,
    title: seoTitle(`${a.name} - dates, line-ups & festivals | RaveRadar`),
    description: `Where does ${a.name} play? ${n} listed event(s): dates, line-ups, venues and tickets.${styles ? ` Genres: ${styles}.` : ""}`,
    image: photo ? `${SITE_URL}/artists/${photo.file}` : null,
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ArtistPage lang="en" slug={params.slug} />;
}
