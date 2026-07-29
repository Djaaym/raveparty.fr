import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import ExploreView from "@/components/ExploreView";

type SP = { [k: string]: string | string[] | undefined };

export const metadata: Metadata = {
  alternates: alternates("/explore", "fr"),
  title: "Explorer les événements électro en Europe | RaveRadar",
  description: "Filtre les festivals, clubs et warehouses par pays, genre, type et prix.",
};

export default function Page({ searchParams }: { searchParams: SP }) {
  return <ExploreView lang="fr" searchParams={searchParams} />;
}
