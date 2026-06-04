import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import { EVENTS, eventSlug, eventDescL } from "@/lib/data";

export function generateStaticParams() {
  return EVENTS.filter((e) => e.type !== "Festival").map((e) => ({ slug: eventSlug(e) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!e) return { title: "Event — RaveRadar" };
  return { title: `${e.title} — ${e.city} | RaveRadar`, description: eventDescL(e, "en").slice(0, 160) };
}

export default function Page({ params }: { params: { slug: string } }) {
  const e = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!e) return notFound();
  return <EventDetail e={e} lang="en" />;
}
