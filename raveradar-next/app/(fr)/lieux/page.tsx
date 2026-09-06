import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import VenuesHub from "@/components/VenuesHub";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/lieux",
  title: "Tous les lieux - clubs, entrepôts & festivals | RaveRadar",
  description: "L'agenda de chaque club, entrepôt et site de festival : Berghain, Rex Club, Le Sucre, Tresor, fabric et plus.",
});

export default function Page() {
  return <VenuesHub lang="fr" />;
}
