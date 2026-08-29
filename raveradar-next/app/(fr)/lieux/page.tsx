import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import VenuesHub from "@/components/VenuesHub";

export const metadata: Metadata = {
  alternates: alternates("/lieux", "fr"),
  title: "Tous les lieux - clubs, entrepôts & festivals | RaveRadar",
  description:
    "L'agenda de chaque club, entrepôt et site de festival : Berghain, Rex Club, Le Sucre, Tresor, fabric et plus.",
};

export default function Page() {
  return <VenuesHub lang="fr" />;
}
