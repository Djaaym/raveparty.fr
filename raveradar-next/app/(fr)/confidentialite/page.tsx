import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { privacyBlocks } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/confidentialite", "/en/privacy", "fr"),
  title: "Politique de confidentialité - données, cookies et mesure d'audience",
  description:
    "Ce que RaveRadar collecte exactement, pourquoi, combien de temps, quels cookies attendent votre accord, et comment exercer vos droits.",
};

export default function Page() {
  return (
    <LegalPage
      lang="fr"
      path="/confidentialite"
      title="Politique de confidentialité"
      lead="Ce site ne demande pas de compte pour être lu, ne construit pas de profil publicitaire et ne revend rien. Voici ce qui est collecté, exactement."
      blocks={privacyBlocks()}
      updated="2026-09-06"
    />
  );
}
