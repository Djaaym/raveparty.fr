import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import WeekendView from "@/components/WeekendView";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/rave-party/ce-week-end",
  title: "Raves this weekend - upcoming parties & festivals | RaveRadar",
  description: "Upcoming electronic festivals and rave parties across Europe in the next few days. Dates, line-ups, tickets.",
});

export default function Page() {
  return <WeekendView lang="en" />;
}
