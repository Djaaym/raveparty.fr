import type { Metadata } from "next";
import CountriesHub from "@/components/CountriesHub";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/pays",
  title: "Festivals & rave parties by country in Europe | RaveRadar",
  description:
    "Browse electronic music events country by country: Netherlands, Germany, Spain, UK, Belgium… Dates, line-ups and tickets.",
});

export default function Page() {
  return <CountriesHub lang="en" />;
}
