import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import OrganizerView from "@/components/OrganizerView";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/organizer",
  title: "For organizers - publish your event | RaveRadar",
  description: "Publish your party or festival: a page of its own, a line-up linked to artist pages, a ticket link. Free, checked before it goes live.",
});

export default function Page() {
  return <OrganizerView lang="en" />;
}
