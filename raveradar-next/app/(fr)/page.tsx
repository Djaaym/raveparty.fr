import type { Metadata } from "next";
import Home from "@/components/Home";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "",
  title: "RaveRadar — Rave parties, festivals & soirées techno en Europe",
  description:
    "L'annuaire des événements de musique électronique en Europe : rave parties, festivals techno, free parties et clubs. Dates, line-ups et billetterie, mis à jour en continu.",
});

export default function Page() {
  return <Home lang="fr" />;
}
