import { alternates, pageMeta, seoTitle } from "@/lib/seo";
import { venueOgImage } from "@/lib/venues";
import type { Metadata } from "next";
import VenuePage from "@/components/VenuePage";
import { VENUES, venueBySlug } from "@/lib/venues";

export function generateStaticParams() {
  return VENUES.map((v) => ({ slug: v.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const v = venueBySlug(params.slug);
  if (!v)
    return {
      alternates: alternates(`/lieux/${params.slug}`, "en"),
      title: "Venue - RaveRadar",
    };
  /* La photo de la salle, jamais l'affiche d'une de ses soirées : `PHOTOS` mélange
     mainstage, salle et flyer d'organisateur, et un flyer partagé sous le nom d'un club
     annonce un événement qui n'est pas le sujet de la page. `venueOgImage()` applique le
     même tri que les cartes de `/lieux`. */
  return pageMeta({
    lang: "en",
    path: `/lieux/${params.slug}`,
    title: seoTitle(`${v.name}, ${v.city} - agenda, line-ups & tickets | RaveRadar`),
    description: `The full agenda for ${v.name} in ${v.city}: upcoming parties and festivals, line-ups, dates and tickets.`,
    image: venueOgImage(v),
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <VenuePage lang="en" slug={params.slug} />;
}
