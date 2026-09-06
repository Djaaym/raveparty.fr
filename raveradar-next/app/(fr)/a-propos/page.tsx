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
  alternates: alternatesPair("/a-propos", "/en/about", "fr"),
  title: "À propos - qui édite RaveRadar et comment la donnée est vérifiée",
  description:
    "Qui édite RaveRadar, comment les dates, line-ups et tarifs sont vérifiés, ce qui est publié quand une information manque, et comment le site est financé.",
};

export default function Page() {
  const s = stats();
  return (
    <LegalPage
      lang="fr"
      path="/a-propos"
      title="À propos"
      lead={`RaveRadar est un annuaire des festivals et des soirées déclarées de musique électronique en Europe. ${s.events} dates, ${s.countries} pays, ${s.cities} villes, vérifiées une par une à leur source.`}
      blocks={aboutBlocks(s)}
    />
  );
}
