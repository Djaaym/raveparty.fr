import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PromotersHub from "@/components/PromotersHub";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/organisateurs",
  title: "Techno promoters & collectives across Europe | RaveRadar",
  description:
    "The directory of the brands behind the night: collectives, festival promoters and clubs booking outside their own room, each with a full agenda.",
});

export default function Page() {
  return <PromotersHub lang="en" />;
}
