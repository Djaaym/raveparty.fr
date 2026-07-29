import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import FestivalCityPage from "@/components/FestivalCityPage";
import { FESTIVALS, eventSlug, eventFromSlug, eventDescL, imageUrl } from "@/lib/data";
import { PLACES, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return [...FESTIVALS.map((e) => ({ slug: eventSlug(e) })), ...PLACES.map((p) => ({ slug: p.slug }))];
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const fest = eventFromSlug(params.slug);
  if (fest && fest.type === "Festival") {
    return pageMeta({
      lang: "fr",
      path: `/festival/${params.slug}`,
      title: `${fest.title} ${new Date(fest.date).getFullYear()} — dates, line-up, billets | RaveRadar`,
      description: eventDescL(fest, "fr").slice(0, 160),
      image: imageUrl(fest),
    });
  }
  const place = placeBySlug(params.slug);
  if (place)
    return {
      alternates: alternates(`/festival/${params.slug}`, "fr"),
      title: `Festival ${place.label} — line-ups, dates & billetterie | RaveRadar`,
      description: `Tous les festivals de musique électronique à ${place.label} et aux alentours. Dates, line-ups, billetterie.`,
    };
  return {
    alternates: alternates(`/festival/${params.slug}`, "fr"),
    title: "Festival — RaveRadar",
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const fest = eventFromSlug(params.slug);
  if (fest && fest.type === "Festival") return <EventDetail e={fest} lang="fr" />;
  if (placeBySlug(params.slug)) return <FestivalCityPage lang="fr" slug={params.slug} />;
  return notFound();
}
