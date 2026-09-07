"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { GA_ID } from "@/lib/site";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

/**
 * Google Analytics 4, chargé **seulement après un consentement explicite**.
 *
 * Il se chargeait jusqu'ici sur chaque page, dès `afterInteractive`, sans que personne
 * n'ait rien accepté : gtag.js dépose des cookies, c'est donc l'article 82 de la loi
 * Informatique et Libertés, et le consentement y est préalable. Le composant est passé
 * client pour cette seule raison, la décision ne peut se prendre qu'au navigateur.
 *
 * Rien n'est rendu tant que le lecteur n'a pas répondu, et un refus ne charge jamais
 * rien : pas de Consent Mode en mode « denied » qui enverrait quand même des pings
 * anonymisés, on ne charge pas le script du tout. Le `consent default` reste posé avant
 * `config` par sécurité, pour le cas où un tiers appellerait `gtag` avant nous.
 *
 * La mesure d'audience interne (`components/Tracker.tsx`) n'est pas concernée : sans
 * cookie ni IP, elle relève de l'exemption, et la conditionner ici reviendrait à ne
 * plus mesurer que les visiteurs qui acceptent GA.
 */
export default function Analytics() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const sync = () => setOk(readConsent() === "granted");
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!GA_ID || !ok) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', {ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
