import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import CityPage from "@/components/CityPage";
import { PLACES, placeBySlug } from "@/lib/places";
import { NOINDEX_FOLLOW, placeHasContent } from "@/lib/thin-pages";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const place = placeBySlug(params.slug);
  if (!place)
    return {
      alternates: alternates(`/rave-party/${params.slug}`, "fr"),
      title: "Rave party - RaveRadar",
    };
  /* Une page de lieu sans une seule date à venir affiche « pas encore d'événement » :
     elle reste en ligne (son formulaire d'alerte est une captation légitime, et l'URL
     doit exister le jour où une date s'y tient) mais elle n'a rien à indexer. `follow`
     et non `nofollow` : ses liens vers les villes voisines restent utiles. Elle se
     réindexe d'elle-même au prochain build qui lui apporte une date. Voir
     `lib/thin-pages.ts`. */
  const thin = !placeHasContent(place);
  return {
    ...pageMeta({
      lang: "fr",
      path: `/rave-party/${params.slug}`,
      title: `Rave party ${place.label} - festivals & soirées techno | RaveRadar`,
      description: `Tous les festivals électro et soirées techno à ${place.label} et aux alentours. Dates, line-ups, billetterie. Active une alerte pour ne rien rater.`,
    }),
    ...(thin ? { robots: NOINDEX_FOLLOW } : {}),
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CityPage lang="fr" slug={params.slug} />;
}
