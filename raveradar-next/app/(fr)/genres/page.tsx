import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import GenresHub from "@/components/GenresHub";

export const metadata: Metadata = {
  alternates: alternates("/genres", "fr"),
  title: "Genres de musique électronique — Techno, Hardstyle, DnB… | RaveRadar",
  description:
    "Explore les événements par genre : techno, hard techno, hardstyle, drum & bass, psytrance, trance, house, free party et plus.",
};

export default function Page() {
  return <GenresHub lang="fr" />;
}
