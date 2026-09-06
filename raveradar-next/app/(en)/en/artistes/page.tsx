import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import ArtistsHub from "@/components/ArtistsHub";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/artistes",
  title: "All techno, hardstyle & trance artists | RaveRadar",
  description: "The electronic music artist directory and every festival they play. Charlotte de Witte, Amelie Lens, I Hate Models and more.",
});

export default function Page() {
  return <ArtistsHub lang="en" />;
}
