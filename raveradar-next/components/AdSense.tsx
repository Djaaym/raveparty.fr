import { ADSENSE_CLIENT } from "@/lib/site";
import { CONSENT_KEY } from "@/lib/consent";

/**
 * Le tag AdSense, rendu dans le `<head>` des deux layouts racines.
 *
 * **Pourquoi le script et pas la balise meta.** Les deux valident la propriété du
 * site, mais la balise ne fait que ça : elle ne diffuse aucune annonce, donc il
 * faudrait poser le script ensuite, c'est-à-dire un second déploiement et un examen
 * retardé d'autant. La balise est quand même déclarée, dans `metadata.other` des
 * deux layouts : elle ne coûte pas un octet de réseau et elle tient la validation
 * le jour où un bloqueur ou un pare-feu empêche le script d'être vu.
 *
 * **Rendu au serveur, dans le `<head>`, et pas par `next/script`.** C'est la seule
 * forme qui met le tag dans le HTML servi, donc dans ce que le robot d'AdSense lit
 * sans avoir à exécuter la page. Un `strategy="afterInteractive"` serait plus léger
 * pour le LCP mais injecterait le script après l'hydratation, c'est-à-dire pas dans
 * le document : parier la validation sur l'exécution du JavaScript par un robot
 * n'est pas un pari qu'on a besoin de prendre.
 *
 * **Le coût est borné par trois attributs.** `async` pour ne jamais bloquer le
 * rendu, `preconnect` pour que la poignée de main TLS soit déjà payée quand le
 * script se demande, et surtout `fetchpriority="low"` : Chrome donne une priorité
 * haute à un script `async` du `<head>`, donc sans lui `adsbygoogle.js` entre en
 * concurrence avec l'image du hero, qui est l'élément LCP de la page d'accueil et
 * de chaque fiche. L'abaisser rend la bande passante des premières secondes à ce
 * qui se voit.
 *
 * **Consentement.** Le script est chargé sans attendre de réponse, contrairement à
 * GA et au tag Impact (`components/Analytics.tsx`), parce qu'il est ici la preuve
 * de propriété du site et qu'aucune annonce n'est diffusée tant que les Auto ads
 * ne sont pas activées dans la console. Ce qu'on peut faire en attendant, on le
 * fait : tant que le lecteur n'a pas accepté, on demande des annonces **non
 * personnalisées** (`requestNonPersonalizedAds`, plus `data-npa-on-unknown-consent`
 * pour le cas où l'inline ne tournerait pas).
 *
 * Ce n'est pas une mise en conformité, et il ne faut pas le lire comme telle : une
 * annonce non personnalisée dépose quand même des cookies (plafonnement de
 * répétition, lutte contre la fraude), et Google exige depuis 2024 un CMP certifié
 * TCF v2.2 pour diffuser dans l'EEE. La bannière maison n'en est pas un. Avant
 * d'activer les annonces, poser le CMP gratuit de Google (AdSense, Confidentialité
 * et messages), sinon la diffusion européenne sera simplement coupée.
 */
export default function AdSense() {
  if (!ADSENSE_CLIENT) return null;
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  return (
    <>
      <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){try{var r=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});` +
            `if(!r||JSON.parse(r).v!=="granted"){(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}}catch(e){` +
            `(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}})()`,
        }}
      />
      <script async src={src} crossOrigin="anonymous" data-npa-on-unknown-consent="true" {...{ fetchpriority: "low" }} />
    </>
  );
}
