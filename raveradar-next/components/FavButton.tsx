"use client";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { useFav } from "./useFavorites";

/**
 * Le bouton favori.
 *
 * Trois défauts corrigés d'un coup, tous relevés par l'audit d'interface. Son libellé
 * était **« Save », écrit en dur en anglais** sur un site français par défaut. Son état
 * n'était porté que par une classe CSS, donc un lecteur d'écran annonçait le même
 * bouton qu'on ait déjà mis la date en favori ou non : `aria-pressed` est ce qui
 * distingue un interrupteur d'un bouton d'action. Et `type="button"` manquait, ce qui
 * en fait un bouton de soumission dès qu'il se trouve dans un formulaire.
 *
 * `lang` est optionnel pour ne pas avoir à le passer depuis les grilles qui n'en ont
 * pas la valeur sous la main ; le français est le défaut du site.
 */
export default function FavButton({ id, className = "fav", lang = "fr" }: { id: number; className?: string; lang?: Lang }) {
  const { on, toggle } = useFav(id);
  const t = getDict(lang);
  return (
    <button
      type="button"
      className={`${className} ${on ? "on" : ""}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? t("a11y.unfav") : t("a11y.fav")}
    >
      ♥
    </button>
  );
}
