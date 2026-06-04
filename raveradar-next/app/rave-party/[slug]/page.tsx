import type { Metadata } from "next";
import CityPage from "@/components/CityPage";
import { PLACES, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const place = placeBySlug(params.slug);
  if (!place) return { title: "Rave party — RaveRadar" };
  return {
    title: `Rave party ${place.label} — soirées techno & free parties | RaveRadar`,
    description: `Toutes les rave parties, free parties et soirées techno à ${place.label} et aux alentours. Dates, line-ups, billetterie. Active une alerte pour ne rien rater.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CityPage lang="fr" slug={params.slug} />;
}
