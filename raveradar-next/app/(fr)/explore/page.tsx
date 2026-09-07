import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { countryLabel } from "@/lib/data";
import { exploreTitle, readExplore } from "@/lib/explore-params";
import ExploreView from "@/components/ExploreView";

type SP = { [k: string]: string | string[] | undefined };

/**
 * Le titre suit ce que la page montre.
 *
 * Il annonçait « Explorer les événements électro en Europe » quels que soient les
 * filtres : une adresse partagée sur `?country=Germany&genre=Hard%20Techno` promettait
 * l'Europe entière, et son aperçu de partage ne disait rien de ce qu'elle affiche.
 *
 * **La canonique reste `/explore`**, et c'est délibéré : les combinaisons de filtres
 * sont en nombre illimité, les laisser s'indexer fabriquerait des milliers de pages
 * quasi identiques, exactement les pages satellites que le projet évite partout
 * ailleurs. `pageMeta()` la pose déjà. Ce qui change ici, c'est le titre, la
 * description et l'aperçu de partage, qui ne dépendent pas de l'indexation.
 */
export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const s = readExplore(searchParams);
  const what = exploreTitle(s, "fr", s.country ? countryLabel(s.country, "fr") : "");
  return pageMeta({
    lang: "fr",
    path: "/explore",
    title: what
      ? `${what} - événements électro | RaveRadar`
      : "Explorer les événements électro en Europe | RaveRadar",
    description: what
      ? `Toutes les dates ${what} : festivals, clubs et warehouses, avec les line-ups, les tarifs et la billetterie officielle.`
      : "Filtre les festivals, clubs et warehouses par pays, genre, type et prix.",
  });
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return <ExploreView lang="fr" searchParams={searchParams} />;
}
