import { alternates, pageMeta } from "@/lib/seo";
import { applyEdit } from "@/lib/event-edits";
import { editFor } from "@/lib/event-edits-store";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/EventDetail";
import FestivalCityPage from "@/components/FestivalCityPage";
import { FESTIVALS, eventSlug, eventFromSlug, eventDescL, imageUrl} from "@/lib/data";
import { guideFor, pick } from "@/lib/guides";
import { PLACES, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return [...FESTIVALS.map((e) => ({ slug: eventSlug(e) })), ...PLACES.map((p) => ({ slug: p.slug }))];
}

/* La correction en direct est appliquée avant la meta : une description réécrite depuis
   la fiche doit aussi partir dans l'OG et la meta description, sinon la page se
   contredit d'un onglet à l'autre. `editFor()` est mis en cache par tag, donc le build
   n'y fait qu'un aller-retour pour les ~1 600 fiches. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const found = eventFromSlug(params.slug);
  const fest = found && applyEdit(found, await editFor(found.id));
  if (fest && fest.type === "Festival") {
    // A guided edition writes its own title/description, the generic template
    // can't say "five days, 1,200 events, no single ticket" in 160 characters.
    const guide = guideFor(fest);
    return pageMeta({
      lang: "fr",
      path: `/festival/${params.slug}`,
      title: guide
        ? `${pick(guide.metaTitle, "fr")} | RaveRadar`
        : `${fest.title} ${new Date(fest.date).getFullYear()}, dates, line-up, billets | RaveRadar`,
      description: guide ? pick(guide.metaDesc, "fr") : eventDescL(fest, "fr").slice(0, 160),
      image: imageUrl(fest),
    });
  }
  const place = placeBySlug(params.slug);
  if (place)
    return {
      alternates: alternates(`/festival/${params.slug}`, "fr"),
      title: `Festival ${place.label} - line-ups, dates & billetterie | RaveRadar`,
      description: `Tous les festivals de musique électronique à ${place.label} et aux alentours. Dates, line-ups, billetterie.`,
    };
  return {
    alternates: alternates(`/festival/${params.slug}`, "fr"),
    title: "Festival - RaveRadar",
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const fest = eventFromSlug(params.slug);
  if (fest && fest.type === "Festival")
    return <EventDetail e={applyEdit(fest, await editFor(fest.id))} lang="fr" />;
  if (placeBySlug(params.slug)) return <FestivalCityPage lang="fr" slug={params.slug} />;
  return notFound();
}
