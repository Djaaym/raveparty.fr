"use client";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { clearConsent } from "@/lib/consent";

/**
 * « Gérer les cookies », dans le pied de page.
 *
 * Un consentement doit être aussi facile à retirer qu'à donner : sans ce lien, un
 * lecteur qui a accepté une fois n'a plus aucun moyen de revenir dessus, ce qui vide
 * le consentement de sa portée. Effacer le choix rouvre la bannière, qui est le seul
 * endroit où il se décide, plutôt que de dupliquer les boutons ici.
 *
 * Un `<button>` et pas une ancre : ça ne navigue nulle part. Il est stylé comme les
 * liens voisins pour ne pas déséquilibrer la colonne.
 */
export default function CookieSettingsLink({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  return (
    <button
      type="button"
      onClick={clearConsent}
      style={{
        background: "none",
        border: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {t("footer.cookies")}
    </button>
  );
}
