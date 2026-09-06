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
      alternates: alternates(`/lieux/${params.slug}`, "fr"),
      title: "Lieu - RaveRadar",
    };
  /* La photo de la salle, jamais l'affiche d'une de ses soirées : `PHOTOS` mélange
     mainstage, salle et flyer d'organisateur, et un flyer partagé sous le nom d'un club
     annonce un événement qui n'est pas le sujet de la page. `venueOgImage()` applique le
     même tri que les cartes de `/lieux`. */
  return pageMeta({
    lang: "fr",
    path: `/lieux/${params.slug}`,
    title: seoTitle(`${v.name}, ${v.city} - agenda, line-ups & billetterie | RaveRadar`),
    description: `Tout l'agenda de ${v.name} à ${v.city} : prochaines soirées et festivals, line-ups, dates et billets.`,
    image: venueOgImage(v),
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <VenuePage lang="fr" slug={params.slug} />;
}
