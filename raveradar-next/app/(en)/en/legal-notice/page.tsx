import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { legalBlocks } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/mentions-legales", "/en/legal-notice", "en"),
  title: "Legal notice",
  description:
    "Publisher and publication director, host, intellectual property, liability and affiliate link disclosure for raveparty.fr.",
};

export default function Page() {
  return (
    <LegalPage
      lang="en"
      path="/legal-notice"
      title="Legal notice"
      lead="Who publishes this site, who hosts it, who owns the content, and what the site does not guarantee."
      blocks={legalBlocks()}
      updated="2026-09-06"
    />
  );
}
