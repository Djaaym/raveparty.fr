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
      alternates: alternates(`/rave-party/${params.slug}`, "en"),
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
      lang: "en",
      path: `/rave-party/${params.slug}`,
      title: `Rave party ${place.label} - festivals & techno nights | RaveRadar`,
      description: `Every electronic festival and techno night in and around ${place.label}. Dates, line-ups, tickets. Set an alert so you never miss out.`,
    }),
    ...(thin ? { robots: NOINDEX_FOLLOW } : {}),
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CityPage lang="en" slug={params.slug} />;
}
