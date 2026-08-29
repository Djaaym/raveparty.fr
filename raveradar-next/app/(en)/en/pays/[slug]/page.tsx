import type { Metadata } from "next";
import CountryPage from "@/components/CountryPage";
import { COUNTRIES_INDEX, countryBySlug, countryName, eventsForCountry } from "@/lib/countries";
import { isPast } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return COUNTRIES_INDEX.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = countryBySlug(params.slug);
  if (!c) return { title: "Country - RaveRadar" };
  const label = countryName(c.name, "en");
  const n = eventsForCountry(c.name).filter((e) => !isPast(e)).length;
  return pageMeta({
    lang: "en",
    path: `/pays/${c.slug}`,
    title: `Festivals & rave parties in ${label}, ${n} upcoming dates | RaveRadar`,
    description: `Every electronic music festival, club night and rave in ${label}: ${n} upcoming dates, line-ups, venues and official ticketing.`,
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CountryPage lang="en" slug={params.slug} />;
}
