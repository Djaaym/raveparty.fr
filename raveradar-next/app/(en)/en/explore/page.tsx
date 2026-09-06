import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ExploreView from "@/components/ExploreView";

type SP = { [k: string]: string | string[] | undefined };

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/explore",
  title: "Explore electronic events across Europe | RaveRadar",
  description: "Filter festivals, clubs and warehouses by country, genre, type and price.",
});

export default function Page({ searchParams }: { searchParams: SP }) {
  return <ExploreView lang="en" searchParams={searchParams} />;
}
