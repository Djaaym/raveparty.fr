import type { Metadata } from "next";
import { alternates, pageMeta, seoTitle } from "@/lib/seo";
import PromoterPage from "@/components/PromoterPage";
import { PROMOTERS, promoterBySlug, promoterOgImage, promoterUpcoming } from "@/lib/promoters";
import { NOINDEX_FOLLOW } from "@/lib/thin-pages";

export function generateStaticParams() {
  return PROMOTERS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = promoterBySlug(params.slug);
  if (!p)
    return {
      alternates: alternates(`/organisateurs/${params.slug}`, "fr"),
      title: "Organisateur - RaveRadar",
    };
  const n = promoterUpcoming(p.slug).length;
  /* Une marque dont il ne reste que l'archive garde sa page (son URL est indexée et
     ses soirées passées ont leur valeur) mais ne se réclame plus d'un agenda : elle
     passe en `noindex, follow` et sort du sitemap, exactement comme une page de lieu
     sans date (cf. `lib/thin-pages.ts`). */
  return {
    ...pageMeta({
      lang: "fr",
      path: `/organisateurs/${p.slug}`,
      title: seoTitle(`${p.name} - agenda, line-ups & billetterie | RaveRadar`),
      description: `${p.name} (${p.city}) : ${n > 0 ? `${n} date${n > 1 ? "s" : ""} à venir` : "les soirées passées"}, line-ups, salles et billetterie officielle.`,
      image: promoterOgImage(p.slug),
    }),
    ...(n > 0 ? {} : { robots: NOINDEX_FOLLOW }),
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <PromoterPage lang="fr" slug={params.slug} />;
}
