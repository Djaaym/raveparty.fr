import type { Metadata } from "next";
import Home from "@/components/Home";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "",
  title: "RaveRadar - Rave parties, festivals & techno nights across Europe",
  description:
    "The directory of electronic music events in Europe: techno festivals, rave parties and clubs. Dates, line-ups and tickets, updated continuously.",
});

export default function Page() {
  return <Home lang="en" />;
}
