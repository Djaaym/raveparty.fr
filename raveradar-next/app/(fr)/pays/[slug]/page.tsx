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
  if (!c) return { title: "Pays — RaveRadar" };
  const label = countryName(c.name, "fr");
  const n = eventsForCountry(c.name).filter((e) => !isPast(e)).length;
  return pageMeta({
    lang: "fr",
    path: `/pays/${c.slug}`,
    title: `Festival & rave party ${label} — ${n} dates à venir | RaveRadar`,
    description: `Tous les festivals, clubs et rave parties de musique électronique en ${label} : ${n} dates à venir, line-ups, lieux et billetterie officielle.`,
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return <CountryPage lang="fr" slug={params.slug} />;
}
