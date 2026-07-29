import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import MapPageView from "@/components/MapPageView";

export const metadata: Metadata = {
  alternates: alternates("/map", "en"),
  title: "The rave map of Europe | RaveRadar",
  description: "Every festival, club and rave in Europe on one interactive map. Filter by genre.",
};

export default function Page() {
  return <MapPageView lang="en" />;
}
