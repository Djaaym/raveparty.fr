import type { Metadata } from "next";
import { alternatesPair } from "@/lib/seo";
import { contactBlocks, CONTACT_EMAIL } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: alternatesPair("/contact", "/en/contact", "en"),
  title: "Contact - fix a listing, get your dates listed, press",
  description:
    "Report a wrong date or a cancelled event, get your dates listed, press enquiries and ticketing partnerships.",
};

export default function Page() {
  return (
    <LegalPage
      lang="en"
      path="/contact"
      title="Contact"
      lead={`One address for everything: ${CONTACT_EMAIL}. Name the page concerned, that is what makes a correction actionable straight away.`}
      blocks={contactBlocks()}
    />
  );
}
