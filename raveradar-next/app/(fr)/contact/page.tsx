import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { contactBlocks, CONTACT_EMAIL } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/contact", "/en/contact", "fr"),
  title: "Contact - corriger une fiche, référencer un événement, presse",
  description:
    "Signaler une date fausse ou un événement annulé, faire référencer vos dates, demandes presse et partenariats billetterie.",
};

export default function Page() {
  return (
    <LegalPage
      lang="fr"
      path="/contact"
      title="Contact"
      lead={`Une seule adresse pour tout : ${CONTACT_EMAIL}. Indiquez la page concernée, c'est ce qui rend une correction applicable tout de suite.`}
      blocks={contactBlocks()}
    />
  );
}
