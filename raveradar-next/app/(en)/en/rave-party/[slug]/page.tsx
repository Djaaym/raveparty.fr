import { alternates } from "@/lib/seo";
import type { Metadata } from "next";
import CityPage from "@/components/CityPage";
import { PLACES, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const place = placeBySlug(params.slug);
  if (!place)
    return {
      alternates: alternates(`/rave-party/${params.slug}`, "en"),
      title: "Rave party — RaveRadar",
    };
  return {
    alternates: alternates(`/rave-party/${params.slug}`, "en"),
    title: `Rave party ${place.label} — festivals & techno nights | RaveRadar`,
    description: `Every electronic festival and techno night in and around ${place.label}. Dates, line-ups, tickets. Set an alert so you never miss out.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CityPage lang="en" slug={params.slug} />;
}
