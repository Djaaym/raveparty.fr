import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import NearMeView from "@/components/NearMeView";
import { todayISO, cardEvents, upcoming } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/autour-de-moi", "en"),
  title: "Raves near me — electronic events close to you | RaveRadar",
  description:
    "Find the electronic festivals and rave parties closest to your location. Geolocation, sorted by distance.",
};

export default function Page() {
  const today = todayISO();
  /* Allégé côté serveur : la géoloc n'a besoin que des coordonnées et de ce qu'affiche
     une carte, pas des descriptions du catalogue. Voir `cardEvents()`. */
  const live = upcoming(undefined, today);
  const t = getDict("en");
  const trail: [string, string][] = [[t("near.crumb"), "/rave-party/autour-de-moi"]];
  return (
    <NearMeView
      lang="en"
      today={today}
      events={cardEvents(live)}
      places={PLACES.map((x) => ({ slug: x.slug, label: x.label }))}
      jsonLd={[breadcrumbJsonLd(trail, "en"), itemListJsonLd(live.slice(0, 30), "en", t("near.title"), today)].filter(Boolean) as object[]}
    />
  );
}
