import { alternates, eventMetaDesc, pageMeta } from "@/lib/seo";
import { applyEdit } from "@/lib/event-edits";
import { editFor } from "@/lib/event-edits-store";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import { EVENTS, eventSlug, imageUrl} from "@/lib/data";

export function generateStaticParams() {
  return EVENTS.filter((e) => e.type !== "Festival").map((e) => ({ slug: eventSlug(e) }));
}

/* La correction en direct est appliquée avant la meta : une description réécrite depuis
   la fiche doit aussi partir dans l'OG et la meta description, sinon la page se
   contredit d'un onglet à l'autre. `editFor()` est mis en cache par tag, donc le build
   n'y fait qu'un aller-retour pour les ~1 600 fiches. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const base = EVENTS.find((x) => eventSlug(x) === params.slug);
  const e = base && applyEdit(base, await editFor(base.id));
  if (!e)
    return {
      alternates: alternates(`/event/${params.slug}`, "fr"),
      title: "Événement - RaveRadar",
    };
  return pageMeta({
    lang: "fr",
    path: `/event/${params.slug}`,
    title: `${e.title} - ${e.city} | RaveRadar`,
    description: eventMetaDesc(e, "fr"),
    image: imageUrl(e),
  });
}

export default async function Page({ params }: { params: { slug: string } }) {
  const base = EVENTS.find((x) => eventSlug(x) === params.slug);
  if (!base) return notFound();
  return <EventDetail e={applyEdit(base, await editFor(base.id))} lang="fr" />;
}
