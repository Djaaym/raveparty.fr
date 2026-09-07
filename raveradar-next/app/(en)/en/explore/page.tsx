import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { countryLabel } from "@/lib/data";
import { exploreTitle, readExplore } from "@/lib/explore-params";
import ExploreView from "@/components/ExploreView";

type SP = { [k: string]: string | string[] | undefined };

/** Same as the French tree, see app/(fr)/explore/page.tsx for why the canonical stays put. */
export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const s = readExplore(searchParams);
  const what = exploreTitle(s, "en", s.country ? countryLabel(s.country, "en") : "");
  return pageMeta({
    lang: "en",
    path: "/explore",
    title: what ? `${what} - electronic events | RaveRadar` : "Explore electronic events across Europe | RaveRadar",
    description: what
      ? `Every date ${what}: festivals, clubs and warehouses, with line-ups, prices and official ticketing.`
      : "Filter festivals, clubs and warehouses by country, genre, type and price.",
  });
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <ExploreView lang="en" searchParams={searchParams} />;
}
