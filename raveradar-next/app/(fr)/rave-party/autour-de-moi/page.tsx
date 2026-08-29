import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import NearMeView from "@/components/NearMeView";
import { todayISO, cardEvents, upcoming } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/autour-de-moi", "fr"),
  title: "Rave party autour de moi - événements électro près de chez toi | RaveRadar",
  description:
    "Trouve les festivals électro et rave parties les plus proches de ta position. Géolocalisation, tri par distance.",
};

export default function Page() {
  const today = todayISO();
  /* Allégé côté serveur : la géoloc n'a besoin que des coordonnées et de ce qu'affiche
     une carte, pas des descriptions du catalogue. Voir `cardEvents()`. */
  const live = upcoming(undefined, today);
  const t = getDict("fr");
  const trail: [string, string][] = [[t("near.crumb"), "/rave-party/autour-de-moi"]];
  return (
    <NearMeView
      lang="fr"
      today={today}
      events={cardEvents(live)}
      places={PLACES.map((x) => ({ slug: x.slug, label: x.label }))}
      jsonLd={[breadcrumbJsonLd(trail, "fr"), itemListJsonLd(live.slice(0, 30), "fr", t("near.title"), today)].filter(Boolean) as object[]}
    />
  );
}
