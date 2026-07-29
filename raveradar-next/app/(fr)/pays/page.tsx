import type { Metadata } from "next";
import CountriesHub from "@/components/CountriesHub";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/pays",
  title: "Festivals & rave parties par pays en Europe | RaveRadar",
  description:
    "Explore les événements de musique électronique pays par pays : Pays-Bas, Allemagne, Espagne, Royaume-Uni, Belgique… Dates, line-ups et billetterie.",
});

export default function Page() {
  return <CountriesHub lang="fr" />;
}
