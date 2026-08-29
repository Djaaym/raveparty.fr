import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import OrganizerView from "@/components/OrganizerView";

export const metadata: Metadata = {
  alternates: alternates("/organizer", "fr"),
  title: "Organisateurs - publie ton événement | RaveRadar",
  description: "Publie ta soirée ou ton festival, gère le line-up et relie ta billetterie. Touche 180 000+ ravers.",
};

export default function Page() {
  return <OrganizerView lang="fr" />;
}
