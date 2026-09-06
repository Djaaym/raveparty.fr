import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import MapPageView from "@/components/MapPageView";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/map",
  title: "La carte rave de l'Europe | RaveRadar",
  description: "Tous les festivals, clubs et raves d'Europe sur une carte interactive. Filtre par genre.",
});

export default function Page() {
  return <MapPageView lang="fr" />;
}
