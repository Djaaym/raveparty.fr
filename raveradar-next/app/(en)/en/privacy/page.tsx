import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { privacyBlocks } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/confidentialite", "/en/privacy", "en"),
  title: "Privacy policy - data, cookies and audience measurement",
  description:
    "Exactly what RaveRadar collects, why, for how long, which cookies wait for your consent, and how to exercise your rights.",
};

export default function Page() {
  return (
    <LegalPage
      lang="en"
      path="/privacy"
      title="Privacy policy"
      lead="This site needs no account to be read, builds no advertising profile and sells nothing. Here is exactly what is collected."
      blocks={privacyBlocks()}
      updated="2026-09-06"
    />
  );
}
