"use client";
import { createContext, useContext } from "react";

/**
 * Les compteurs de fanions, posés une fois pour toute la page.
 *
 * **Pourquoi un contexte et pas une prop.** Le chiffre doit s'afficher sur *chaque* carte
 * de *chaque* grille, et les grilles sont partout : la home, `/explore`, `/map`, les
 * fiches ville, genre, lieu, artiste, pays, organisateur. Le passer en prop voudrait dire
 * le faire traverser `cardEvent()` puis une vingtaine de pages, et ça ne marcherait
 * toujours pas pour `/explore` et `/map`, qui rendent leurs cartes côté client à partir
 * d'un catalogue filtré dans le navigateur.
 *
 * **Une lecture, pas une par carte.** La table est lue **au rendu du layout**, donc une
 * fois par page et par régénération, via `countsAll()` qui est lui-même mis en cache par
 * tag : un build de vingt et un mille pages fait **un seul** aller-retour Redis. Aucune
 * carte ne déclenche de requête, ce qui était la raison de ne pas afficher le chiffre au
 * départ. Le contexte lève cette limite sans en payer le prix.
 *
 * **Ce que ça coûte vraiment, et le plafond.** La table voyage dans la charge utile de
 * chaque page. Elle ne porte **que les événements qui ont au moins un fanion**, donc elle
 * est vide au départ et grandit avec l'usage réel, à une dizaine d'octets par ligne.
 * `CAP` borne quand même le nombre de lignes : sans lui, le jour où tout le catalogue
 * serait marqué, on ajouterait une vingtaine de kilo-octets à la page dont le LCP compte
 * le plus. Les plus petits compteurs sont coupés en premier, ce sont ceux qui apportent
 * le moins (« 1 intéressé » ne convainc personne) et les événements les plus demandés,
 * eux, gardent toujours leur chiffre.
 */
export type InterestCounts = Record<number, number>;

const Ctx = createContext<InterestCounts>({});

/**
 * Le fournisseur, **et c'est bien un composant, pas `Ctx.Provider` ré-exporté**.
 *
 * Le raccourci `export const InterestCountsProvider = Ctx.Provider` paraît équivalent et
 * ne l'est pas : un layout est un composant serveur, et ce qu'il importe d'un module
 * `"use client"` traverse la frontière sous forme de *référence client*. Un objet
 * `Context.Provider` n'en est pas une, React reçoit une promesse au lieu d'un composant et
 * l'hydratation meurt sur « Element type is invalid », **après** avoir rendu un HTML
 * parfaitement correct côté serveur. C'est le pire symptôme possible, la page arrive
 * complète puis se vide : `curl` la voit juste, l'œil aussi pendant une demi-seconde, et
 * seul un navigateur qui va jusqu'à l'hydratation l'attrape. Défaut payé ici.
 */
export function InterestCountsProvider({
  value,
  children,
}: {
  value: InterestCounts;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Le compteur d'un événement, ou `undefined` quand il n'y en a pas.
 *
 * `undefined` et pas `0`, et la nuance se voit à l'écran : le bouton n'affiche rien plutôt
 * qu'un « 0 ». Une pastille à zéro sur toutes les cartes d'une grille n'informe personne,
 * elle dit juste que personne ne veut y aller, ce qui est la même erreur que la pilule de
 * ville qui promet une date inexistante, prise par l'autre bout.
 */
export function useInterestCount(id: number): number | undefined {
  return useContext(Ctx)[id];
}
