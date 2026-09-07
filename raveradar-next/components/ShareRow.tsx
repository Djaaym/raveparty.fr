"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";

/**
 * Partager la fiche, et l'ajouter à son agenda.
 *
 * Les deux gestes qui suivent « j'ai trouvé la soirée que je cherchais » n'existaient
 * pas : ni bouton de partage, ni fichier calendrier, ni lien Google Agenda. Sur un
 * annuaire d'événementiel, où une sortie se décide à plusieurs et se note des semaines
 * à l'avance, c'est une fuite d'acquisition (le partage est le canal naturel du
 * secteur) et une perte d'intention (on note, donc on revient).
 *
 * **Le lien calendrier est une ancre, pas un bouton** : il pointe sur `/api/ics`, donc
 * il marche sans JavaScript, au clic droit et au clic milieu. Seul le partage a besoin
 * d'un script, puisqu'il appelle une API du navigateur.
 *
 * `navigator.share` quand il existe (tous les mobiles, où se fait l'essentiel du
 * partage), sinon copie du lien dans le presse-papiers, avec un retour visible : un
 * bouton qui ne dit pas ce qu'il a fait laisse croire qu'il n'a rien fait. Et si les
 * deux manquent, le composant ne rend rien plutôt qu'un bouton mort.
 */
export default function ShareRow({ lang, id, title }: { lang: Lang; id: number; title: string }) {
  const t = getDict(lang);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* L'utilisateur a fermé la feuille de partage : ce n'est pas une erreur, et
           retomber sur la copie du lien lui ferait un presse-papiers qu'il n'a pas
           demandé. */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Presse-papiers refusé (contexte non sécurisé, permission) : on ne fait rien
         de visible plutôt que d'annoncer une copie qui n'a pas eu lieu. */
    }
  };

  return (
    <div className="share-row">
      <a
        className="btn btn-ghost btn-sm"
        href={`/api/ics?id=${id}&lang=${lang}`}
        // `download` pour que le fichier arrive dans les téléchargements plutôt que de
        // s'ouvrir dans l'onglet sur les navigateurs qui savent afficher le text/calendar.
        download
      >
        {t("event.addcal")}
      </a>
      <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
        {copied ? t("event.copied") : t("event.share")}
      </button>
    </div>
  );
}
