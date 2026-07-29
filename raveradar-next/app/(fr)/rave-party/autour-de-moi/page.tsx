import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import NearMeView from "@/components/NearMeView";
import { todayISO } from "@/lib/data";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/autour-de-moi", "fr"),
  title: "Rave party autour de moi — événements électro près de chez toi | RaveRadar",
  description:
    "Trouve les rave parties, free parties et festivals électro les plus proches de ta position. Géolocalisation, tri par distance.",
};

export default function Page() {
  return <NearMeView lang="fr" today={todayISO()} />;
}
