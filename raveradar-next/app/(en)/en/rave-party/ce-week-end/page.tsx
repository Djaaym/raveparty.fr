import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import WeekendView from "@/components/WeekendView";

export const metadata: Metadata = {
  alternates: alternates("/rave-party/ce-week-end", "en"),
  title: "Raves this weekend — upcoming parties & festivals | RaveRadar",
  description:
    "Upcoming electronic festivals and rave parties across Europe in the next few days. Dates, line-ups, tickets.",
};

export default function Page() {
  return <WeekendView lang="en" />;
}
