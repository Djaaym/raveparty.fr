import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import CitiesHub from "@/components/CitiesHub";

export const metadata: Metadata = {
  alternates: alternates("/villes", "fr"),
  title: "Rave party & festival par ville - Lyon, Drôme, Lozère… | RaveRadar",
  description:
    "Trouve les festivals électro et rave parties près de chez toi : Lyon, Rennes, Bordeaux, Drôme, Lozère, Aude, Hérault et plus.",
};

export default function Page() {
  return <CitiesHub lang="fr" />;
}
