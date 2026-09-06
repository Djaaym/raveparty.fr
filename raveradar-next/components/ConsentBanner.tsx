"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";

/**
 * La bannière de consentement.
 *
 * Elle ne s'affiche que lorsqu'il n'y a pas de choix en cours, et **après
 * l'hydratation** : l'état vient de `localStorage`, donc le rendre au serveur
 * produirait un HTML différent selon le lecteur, ce qui sort les 13 000 pages de la
 * génération statique pour afficher un bandeau. Elle apparaît donc au premier rendu
 * client, ce qui ne coûte rien : rien n'est chargé tant qu'elle attend une réponse.
 *
 * Deux boutons de même poids visuel, « Refuser » et « Accepter ». Un refus mis en
 * retrait (lien gris minuscule à côté d'un gros bouton vert) est le motif que la CNIL
 * retient comme un consentement non libre : refuser doit coûter le même clic.
 */
export default function ConsentBanner({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const sync = () => setShow(readConsent() === null);
    sync();
    // Le lien « gérer les cookies » du pied de page efface le choix : la bannière doit
    // se rouvrir sur-le-champ, sans rechargement.
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!show) return null;

  return (
    <div className="consent" role="dialog" aria-modal="false" aria-label={t("consent.title")}>
      <div className="consent-box">
        <div>
          <strong className="consent-title">{t("consent.title")}</strong>
          <p className="consent-text">
            {t("consent.text")}{" "}
            <Link href={lang === "en" ? "/en/privacy" : "/confidentialite"}>{t("consent.more")}</Link>
          </p>
        </div>
        <div className="consent-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => writeConsent("denied")}>
            {t("consent.deny")}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => writeConsent("granted")}>
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
