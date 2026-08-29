import { IMPACT_UTT_ID } from "@/lib/site";

/**
 * Impact.com Universal Tracking Tag (affiliation Ticketmaster).
 *
 * Snippet fourni par Impact, gardé tel quel à l'identifiant près :
 * - `transformLinks` réécrit les liens billetterie partenaires en liens affiliés ;
 * - `trackImpression` remonte la vue de page au réseau.
 *
 * Balise `<script>` brute et non `next/script` : en App Router, `beforeInteractive`
 * n'écrit pas le snippet dans le HTML, il le sérialise en JSON dans `self.__next_s`
 * pour l'exécuter au chargement. Ça marche pour le tracking, mais la vérification
 * de site côté Impact lit la source de la page d'accueil, le tag doit y être lisible.
 * Rendue en tête de `<body>` (et non entre `</head>` et `<body>`, que le parseur
 * remonterait dans le `<head>`, ce qui désynchroniserait l'hydratation React).
 */
export default function ImpactAffiliate() {
  if (!IMPACT_UTT_ID) return null;
  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/${IMPACT_UTT_ID}.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`,
      }}
    />
  );
}
