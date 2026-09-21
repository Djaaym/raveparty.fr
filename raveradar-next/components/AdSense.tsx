import { ADSENSE_CLIENT } from "@/lib/site";

/**
 * Le tag AdSense.
 *
 * **Pourquoi le script et pas la balise meta.** Les deux méthodes de validation
 * proposées par AdSense prouvent la propriété du site, mais la balise ne fait que
 * ça : elle ne diffuse aucune annonce, donc il faudrait poser le script ensuite,
 * c'est-à-dire un second déploiement et un examen retardé d'autant. La balise est
 * quand même déclarée, dans `metadata.other` des deux layouts racines : elle ne
 * coûte pas un octet de réseau et elle tient la validation le jour où le script est
 * bloqué ou n'est pas vu.
 *
 * **Rendu au serveur, et le composant vit dans le `<body>`, pas dans le `<head>`.**
 * C'est le seul placement qui marche, et il a coûté deux vérifications : React ne
 * rend tout simplement pas un `<script>` écrit dans le `<head>` d'un composant
 * serveur, il n'apparaît que dans la charge utile RSC, donc dans rien que le robot
 * d'AdSense puisse lire. Rendu depuis le `<body>`, le même script **est hissé dans
 * le `<head>` du HTML servi** par React (mesuré, position 1 117 sur un `</head>` à
 * 3 659), ce qui est exactement ce que demande la console AdSense. Un `next/script`
 * ne répond pas au besoin non plus : `afterInteractive` injecte après l'hydratation,
 * donc hors du document, et `beforeInteractive` ne rend rien du tout depuis un
 * composant serveur (vérifié aussi). **Toujours vérifier ce placement au `curl` sur
 * le build de production**, c'est la règle des redirections du dépôt, un tag qu'on
 * croit posé ne vaut rien.
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
 * de propriété du site et qu'aucune annonce n'est diffusée tant que les Auto ads ne
 * sont pas activées dans la console. `data-npa-on-unknown-consent` demande des
 * annonces **non personnalisées** tant qu'aucun signal de consentement n'est
 * présent, ce qui est le cas de toutes les pages aujourd'hui, la bannière maison
 * n'émettant pas de signal TCF.
 *
 * Ce n'est pas une mise en conformité, et il ne faut pas le lire comme telle : une
 * annonce non personnalisée dépose quand même des cookies (plafonnement de
 * répétition, lutte contre la fraude), et Google exige depuis 2024 un CMP certifié
 * TCF v2.2 pour diffuser dans l'EEE. Avant d'activer les annonces, poser le CMP
 * gratuit de Google (AdSense, Confidentialité et messages), sinon la diffusion
 * européenne sera simplement coupée. C'est lui qui portera alors le signal, et il
 * n'y a rien à écrire ici pour ça.
 *
 * Un signal posé à la main depuis `localStorage` a été essayé puis retiré : rendu
 * dans le `<body>`, il n'est pas hissé, donc il s'exécutait **après** un loader que
 * React place, lui, en tête de `<head>`. Un garde-fou dont l'ordre n'est pas garanti
 * vaut moins que pas de garde-fou, il fait croire que la question est réglée.
 */
export default function AdSense() {
  if (!ADSENSE_CLIENT) return null;
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  return (
    <>
      <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
      {/* `fetchpriority` en minuscules : React 18 n'en connaît la forme camelCase que
          sur `<img>` et `<link>`, et la propriété DOM n'existe pas sur un script. */}
      <script async src={src} crossOrigin="anonymous" data-npa-on-unknown-consent="true" {...{ fetchpriority: "low" }} />
    </>
  );
}
