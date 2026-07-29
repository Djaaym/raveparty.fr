import { alternates } from "@/lib/seo";
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
      title: "Venue — RaveRadar",
    };
  return {
    alternates: alternates(`/lieux/${params.slug}`, "en"),
    title: `${v.name}, ${v.city} — agenda, line-ups & tickets | RaveRadar`,
    description: `The full agenda for ${v.name} in ${v.city}: upcoming parties and festivals, line-ups, dates and tickets.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <VenuePage lang="en" slug={params.slug} />;
}
