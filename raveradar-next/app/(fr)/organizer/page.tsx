import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import OrganizerView from "@/components/OrganizerView";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/organizer",
  title: "Organisateurs - publie ton événement | RaveRadar",
  description: "Publie ta soirée ou ton festival : fiche dédiée, line-up relié aux fiches artistes, lien billetterie. Gratuit, relu avant publication.",
});

export default function Page() {
  return <OrganizerView lang="fr" />;
}
