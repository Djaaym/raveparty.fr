import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import CitiesHub from "@/components/CitiesHub";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/villes",
  title: "Rave party & festival par ville - Paris, Lyon, Nantes… | RaveRadar",
  description: "Trouve les festivals électro et rave parties près de chez toi : Paris, Lyon, Nantes, Toulouse, Rennes, Bordeaux, Lille et plus.",
});

export default function Page() {
  return <CitiesHub lang="fr" />;
}
