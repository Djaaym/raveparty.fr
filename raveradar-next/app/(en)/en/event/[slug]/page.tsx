import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import { EVENTS, eventSlug, eventDescL, imageUrl, RENAMED_EVENT_SLUGS } from "@/lib/data";

export function generateStaticParams() {
  return EVENTS.filter((e) => e.type !== "Festival").map((e) => ({ slug: eventSlug(e) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!e)
    return {
      alternates: alternates(`/event/${params.slug}`, "en"),
      title: "Event — RaveRadar",
    };
  return pageMeta({
    lang: "en",
    path: `/event/${params.slug}`,
    title: `${e.title} — ${e.city} | RaveRadar`,
    description: eventDescL(e, "en").slice(0, 160),
    image: imageUrl(e),
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  // Slug renommé : 301 vers le nouveau, jamais un 404 sur une URL indexée.
  const renamed = RENAMED_EVENT_SLUGS[params.slug];
  if (renamed) permanentRedirect(`/en/event/${renamed}`);
  if (!e) return notFound();
  return <EventDetail e={e} lang="en" />;
}
