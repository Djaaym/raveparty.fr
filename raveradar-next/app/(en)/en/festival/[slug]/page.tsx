import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import FestivalCityPage from "@/components/FestivalCityPage";
import { FESTIVALS, eventSlug, eventFromSlug, eventDescL, imageUrl } from "@/lib/data";
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
      lang: "en",
      path: `/festival/${params.slug}`,
      title: guide
        ? `${pick(guide.metaTitle, "en")} | RaveRadar`
        : `${fest.title} ${new Date(fest.date).getFullYear()} — dates, line-up, tickets | RaveRadar`,
      description: guide ? pick(guide.metaDesc, "en") : eventDescL(fest, "en").slice(0, 160),
      image: imageUrl(fest),
    });
  }
  const place = placeBySlug(params.slug);
  if (place)
    return {
      alternates: alternates(`/festival/${params.slug}`, "en"),
      title: `Festivals in ${place.label} — line-ups, dates & tickets | RaveRadar`,
      description: `Every electronic music festival in and around ${place.label}. Dates, line-ups, tickets.`,
    };
  return {
    alternates: alternates(`/festival/${params.slug}`, "en"),
    title: "Festival — RaveRadar",
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const fest = eventFromSlug(params.slug);
  if (fest && fest.type === "Festival") return <EventDetail e={fest} lang="en" />;
  if (placeBySlug(params.slug)) return <FestivalCityPage lang="en" slug={params.slug} />;
  return notFound();
}
