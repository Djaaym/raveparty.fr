import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import FestivalCityPage from "@/components/FestivalCityPage";
import { FESTIVALS, eventSlug, eventFromSlug, eventDescL, imageUrl, RENAMED_EVENT_SLUGS } from "@/lib/data";
import { guideFor, pick } from "@/lib/guides";
import { PLACES, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return [...FESTIVALS.map((e) => ({ slug: eventSlug(e) })), ...PLACES.map((p) => ({ slug: p.slug }))];
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const fest = eventFromSlug(params.slug);
  if (fest && fest.type === "Festival") {
    // A guided edition writes its own title/description — the generic template
    // can't say "five days, 1,200 events, no single ticket" in 160 characters.
    const guide = guideFor(fest);
    return pageMeta({
      lang: "fr",
      path: `/festival/${params.slug}`,
      title: guide
        ? `${pick(guide.metaTitle, "fr")} | RaveRadar`
        : `${fest.title} ${new Date(fest.date).getFullYear()} — dates, line-up, billets | RaveRadar`,
      description: guide ? pick(guide.metaDesc, "fr") : eventDescL(fest, "fr").slice(0, 160),
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
  // Slug renommé : 301 vers le nouveau, jamais un 404 sur une URL indexée.
  const renamed = RENAMED_EVENT_SLUGS[params.slug];
  if (renamed) permanentRedirect(`/festival/${renamed}`);
  return notFound();
}
