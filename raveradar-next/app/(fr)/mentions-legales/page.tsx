import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { legalBlocks } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/mentions-legales", "/en/legal-notice", "fr"),
  title: "Mentions légales",
  description:
    "Éditeur et directeur de la publication, hébergeur, propriété intellectuelle, responsabilité et déclaration des liens affiliés du site raveparty.fr.",
};

export default function Page() {
  return (
    <LegalPage
      lang="fr"
      path="/mentions-legales"
      title="Mentions légales"
      lead="Qui édite ce site, qui l'héberge, à qui appartiennent les contenus, et ce que le site ne garantit pas."
      blocks={legalBlocks()}
      updated="2026-09-06"
    />
  );
}
