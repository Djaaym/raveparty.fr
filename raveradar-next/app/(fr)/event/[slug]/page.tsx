import { alternates, pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import { EVENTS, eventSlug, eventDescL, imageUrl } from "@/lib/data";

export function generateStaticParams() {
  return EVENTS.filter((e) => e.type !== "Festival").map((e) => ({ slug: eventSlug(e) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!e)
    return {
      alternates: alternates(`/event/${params.slug}`, "fr"),
      title: "Événement — RaveRadar",
    };
  return pageMeta({
    lang: "fr",
    path: `/event/${params.slug}`,
    title: `${e.title} — ${e.city} | RaveRadar`,
    description: eventDescL(e, "fr").slice(0, 160),
    image: imageUrl(e),
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!e) return notFound();
  return <EventDetail e={e} lang="fr" />;
}
