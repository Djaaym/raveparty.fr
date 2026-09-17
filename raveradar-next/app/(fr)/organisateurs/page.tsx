import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PromotersHub from "@/components/PromotersHub";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/organisateurs",
  title: "Organisateurs & collectifs techno en Europe | RaveRadar",
  description:
    "L'annuaire des marques qui font la nuit : collectifs, promoteurs de festivals et clubs hors les murs, avec leur agenda complet et les salles où ils programment.",
});

export default function Page() {
  return <PromotersHub lang="fr" />;
}
