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
      alternates: alternates(`/show/${params.slug}`, "fr"),
      title: "Show — RaveRadar",
    };
  return {
    alternates: alternates(`/show/${params.slug}`, "fr"),
    title: `${s.artistName} à ${s.venue}, ${s.city} — ${fmtDate(s.date, "fr")} | RaveRadar`,
    description: `${s.artistName} en concert à ${s.venue} (${s.city}) le ${fmtDate(s.date, "fr")}. Line-up, horaires, lieu et billetterie.`,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ShowPage lang="fr" slug={params.slug} />;
}
