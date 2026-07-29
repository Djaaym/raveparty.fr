import { alternates } from "@/lib/seo";
import type { Metadata } from "next";
import ShowPage from "@/components/ShowPage";
import { SHOWS, showBySlug } from "@/lib/shows";
import { fmtDate } from "@/lib/format";

export function generateStaticParams() {
  return SHOWS.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = showBySlug(params.slug);
  if (!s)
    return {
      alternates: alternates(`/show/${params.slug}`, "en"),
      title: "Show — RaveRadar",
    };
  return {
    alternates: alternates(`/show/${params.slug}`, "en"),
    title: `${s.artistName} at ${s.venue}, ${s.city} — ${fmtDate(s.date, "en")} | RaveRadar`,
    description: `${s.artistName} live at ${s.venue} (${s.city}) on ${fmtDate(s.date, "en")}. Line-up, set times, venue and tickets.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ShowPage lang="en" slug={params.slug} />;
}
