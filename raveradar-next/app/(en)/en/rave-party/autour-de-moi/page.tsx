import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import NearMeView from "@/components/NearMeView";
import { todayISO } from "@/lib/data";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/autour-de-moi", "en"),
  title: "Raves near me — electronic events close to you | RaveRadar",
  description:
    "Find the rave parties, free parties and electronic festivals closest to your location. Geolocation, sorted by distance.",
};

export default function Page() {
  return <NearMeView lang="en" today={todayISO()} />;
}
