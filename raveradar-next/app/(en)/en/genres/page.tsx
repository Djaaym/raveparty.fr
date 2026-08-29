import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import GenresHub from "@/components/GenresHub";

export const metadata: Metadata = {
  alternates: alternates("/genres", "en"),
  title: "Electronic music genres - Techno, Hardstyle, DnB… | RaveRadar",
  description:
    "Browse events by genre: techno, hard techno, hardstyle, drum & bass, psytrance, trance, house, warehouse and more.",
};

export default function Page() {
  return <GenresHub lang="en" />;
}
