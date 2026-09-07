import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import WeekendView from "@/components/WeekendView";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/rave-party/ce-week-end",
  title: "Rave party ce week-end - soirées & festivals à venir | RaveRadar",
  description: "Les festivals électro et rave parties à venir dans les prochains jours en Europe. Dates, line-ups, billetterie.",
});

export default function Page() {
  return <WeekendView lang="fr" />;
}
