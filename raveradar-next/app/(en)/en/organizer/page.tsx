import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import OrganizerView from "@/components/OrganizerView";

export const metadata: Metadata = {
  alternates: alternates("/organizer", "en"),
  title: "For organizers - publish your event | RaveRadar",
  description: "Publish your party or festival, manage the line-up and link your ticketing. Reach 180,000+ ravers.",
};

export default function Page() {
  return <OrganizerView lang="en" />;
}
