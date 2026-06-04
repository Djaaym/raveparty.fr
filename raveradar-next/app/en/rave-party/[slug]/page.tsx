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
    title: `Rave party ${place.label} — techno nights & free parties | RaveRadar`,
    description: `All rave parties, free parties and techno nights in and around ${place.label}. Dates, line-ups, tickets. Set an alert so you never miss out.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CityPage lang="en" slug={params.slug} />;
}
