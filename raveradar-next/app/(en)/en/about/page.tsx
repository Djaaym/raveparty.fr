import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { aboutBlocks } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";
import { EVENTS } from "@/lib/data";
import { COUNTRIES_INDEX } from "@/lib/countries";

const stats = () => ({
  events: EVENTS.length,
  countries: COUNTRIES_INDEX.length,
  cities: new Set(EVENTS.map((e) => e.city)).size,
});

export const metadata: Metadata = {
  alternates: alternatesPair("/a-propos", "/en/about", "en"),
  title: "About - who publishes RaveRadar and how the data is checked",
  description:
    "Who publishes RaveRadar, how dates, line-ups and prices are verified, what gets published when something is missing, and how the site is funded.",
};

export default function Page() {
  const s = stats();
  return (
    <LegalPage
      lang="en"
      path="/about"
      title="About"
      lead={`RaveRadar is a directory of Europe's declared electronic music festivals and club nights. ${s.events} dates, ${s.countries} countries, ${s.cities} cities, each checked at source.`}
      blocks={aboutBlocks(s)}
    />
  );
}
