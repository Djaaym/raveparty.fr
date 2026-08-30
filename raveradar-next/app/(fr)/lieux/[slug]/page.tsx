import { alternates, seoTitle } from "@/lib/seo";
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
  return {
    alternates: alternates(`/lieux/${params.slug}`, "fr"),
    title: seoTitle(`${v.name}, ${v.city} - agenda, line-ups & billetterie | RaveRadar`),
    description: `Tout l'agenda de ${v.name} à ${v.city} : prochaines soirées et festivals, line-ups, dates et billets.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <VenuePage lang="fr" slug={params.slug} />;
}
