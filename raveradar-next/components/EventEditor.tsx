"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { EventEdit, PriceConfidence } from "@/lib/event-edits";
import type { Lang } from "@/lib/types";

/**
 * Le déclencheur de l'édition rapide d'une fiche.
 *
 * Trois choses se périment vite sur un événement et n'ont pas à attendre un commit : la
 * description (une faute, une précision), le line-up (un nom ajouté ou retiré la veille)
 * et le tarif (un prix estimé qui vient d'être confirmé). Ce sont les trois champs
 * ouverts par le panneau, et pas un de plus : la date, la salle et les coordonnées
 * engagent les pages ville, lieu et carte, qui sont construites au déploiement.
 *
 * ## Ce fichier existe pour ce qu'il n'importe pas
 *
 * Il est monté sur **toutes** les fiches, soit les milliers de pages qui portent le SEO
 * du site : tout ce qu'il tire, chaque lecteur le télécharge. Il ne connaît donc que des
 * types, et le panneau, lui, arrive par un `next/dynamic` déclenché au clic. C'est la
 * même règle que « un composant client ne doit jamais importer `lib/data.ts` », appliquée
 * un cran plus bas : l'éditeur tire `RichEditor`, `TagPicker` et le dictionnaire d'i18n,
 * qui n'ont rien à faire dans le chemin critique d'une page lue par un visiteur.
 *
 * Deux portes avant le moindre octet réseau. D'abord le cookie `rr_admin_on`, posé à la
 * connexion : sans lui, ce composant rend `null` et **ne fait aucune requête**. Puis
 * `/api/event-edit`, qui revérifie `adminAccess()`. Le cookie n'accorde rien, il évite
 * seulement un aller-retour à 99,99 % des visites ; qui le pose à la main dans son
 * navigateur voit un bouton, et rien de plus.
 *
 * Écrit en français seulement, comme `/admin` et `/suivi` : c'est un outil de
 * propriétaire, pas une page du site, et une trentaine de clés d'interface dans
 * `lib/i18n.ts` pour une seule personne coûteraient plus qu'elles ne serviraient.
 */

export interface EventEditorProps {
  id: number;
  title: string;
  /** Les valeurs **telles que la fiche les affiche**, correction déjà appliquée : on
   *  édite ce qu'on voit. Le serveur, lui, rediffe contre `lib/data.ts`. */
  desc: string;
  descEn: string;
  lineup: string[];
  price: number;
  currency: string;
  priceNote: PriceConfidence;
  lang: Lang;
  /** La fiche porte-t-elle un guide festival ? Sa description longue vient alors de
   *  `lib/guides.ts` et remplace `desc` à l'écran : le dire évite de réécrire un texte
   *  que la page n'affichera pas. */
  guided?: boolean;
}

export type EditGate = { can: boolean; by?: string; persistent?: boolean; edit?: EventEdit | null };

/* `ssr: false` : ce panneau n'a aucun sens rendu côté serveur, la page étant statique et
   la porte tenue par un cookie. Le chunk n'est demandé qu'au premier clic. */
const EventEditorPanel = dynamic(() => import("./EventEditorPanel"), { ssr: false });

export default function EventEditor(p: EventEditorProps) {
  const [gate, setGate] = useState<EditGate | null>(null);
  const [open, setOpen] = useState(false);

  /* Le témoin est relu à chaque montage plutôt que mémorisé : une déconnexion dans un
     autre onglet doit faire disparaître le bouton dès la navigation suivante. */
  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c.startsWith("rr_admin_on=1"))) {
      setGate({ can: false });
      return;
    }
    let stale = false;
    void fetch(`/api/event-edit?id=${p.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<EditGate>) : { can: false }))
      .then((g) => {
        if (!stale) setGate(g);
      })
      .catch(() => {
        if (!stale) setGate({ can: false });
      });
    return () => {
      stale = true;
    };
  }, [p.id]);

  if (!gate?.can) return null;
  const edited = Boolean(gate.edit);

  return (
    <>
      <button type="button" className={`edit-fab${edited ? " on" : ""}`} onClick={() => setOpen(true)} aria-expanded={open}>
        <span aria-hidden="true">✎</span> Modifier la fiche
        {edited && <i className="edit-dot" aria-hidden="true" />}
      </button>

      {open && (
        <EventEditorPanel
          p={p}
          edit={gate.edit ?? null}
          persistent={gate.persistent !== false}
          onClose={() => setOpen(false)}
          onChanged={(edit) => setGate((g) => (g ? { ...g, edit } : g))}
        />
      )}
    </>
  );
}
