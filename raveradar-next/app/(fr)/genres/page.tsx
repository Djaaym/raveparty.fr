import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import GenresHub from "@/components/GenresHub";

export const metadata: Metadata = pageMeta({
  lang: "fr",
  path: "/genres",
  title: "Genres de musique électronique - Techno, Hardstyle, DnB… | RaveRadar",
  description: "Explore les événements par genre : techno, hard techno, hardstyle, drum & bass, psytrance, trance, house, warehouse et plus.",
});

export default function Page() {
  return <GenresHub lang="fr" />;
}
