import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import NearMeView from "@/components/NearMeView";
import { todayISO } from "@/lib/data";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/autour-de-moi", "fr"),
  title: "Rave party autour de moi — événements électro près de chez toi | RaveRadar",
  description:
    "Trouve les festivals électro et rave parties les plus proches de ta position. Géolocalisation, tri par distance.",
};

export default function Page() {
  return <NearMeView lang="fr" today={todayISO()} />;
}
