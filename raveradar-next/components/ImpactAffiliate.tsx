import { IMPACT_UTT_ID } from "@/lib/site";
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_MAX_AGE_DAYS } from "@/lib/consent";

/**
 * Impact.com Universal Tracking Tag (affiliation Ticketmaster), armé au consentement.
 *
 * Deux contraintes qui tirent en sens inverse, et c'est ce qui explique la forme du
 * fichier. D'un côté le tag **doit rester lisible dans la source de la page d'accueil**,
 * c'est là qu'Impact vient vérifier le site depuis « Ajouter un site Web » : le sortir
 * du HTML casserait la vérification du compte, donc l'affiliation. De l'autre il pose
 * des cookies tiers et appelle `trackImpression()` dès l'affichage, donc il ne peut pas
 * partir avant un accord (article 82 de la loi Informatique et Libertés).
 *
 * La balise reste donc en clair, en tête de `<body>`, mais elle **ne charge plus rien
 * d'elle-même** : elle définit l'amorce et ne l'exécute que si le consentement est
 * accordé, sinon elle attend l'événement émis par la bannière. Tant que personne n'a
 * accepté, aucune requête ne part vers impactcdn.com, vérifiable dans l'onglet réseau.
 *
 * Balise `<script>` brute et non `next/script` pour la même raison qu'avant : en App
 * Router, `beforeInteractive` sérialise le snippet dans `self.__next_s` au lieu de
 * l'écrire dans le HTML, et c'est la source que lit la vérification d'Impact.
 *
 * Le format du stockage est celui de `lib/consent.ts` et les constantes en viennent :
 * ce script est du texte, il ne peut pas importer le module, mais interpoler ses
 * constantes évite qu'une clé change d'un côté sans l'autre.
 */
export default function ImpactAffiliate() {
  if (!IMPACT_UTT_ID) return null;
  const boot = `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/${IMPACT_UTT_ID}.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`;
  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `(function(){var done=false;function boot(){if(done)return;done=true;${boot}}
function ok(){try{var r=window.localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(!r)return false;var s=JSON.parse(r);return s&&s.v==='granted'&&(Date.now()-s.t)<${CONSENT_MAX_AGE_DAYS}*86400000;}catch(e){return false}}
if(ok())boot();else window.addEventListener(${JSON.stringify(CONSENT_EVENT)},function(){if(ok())boot()});})();`,
      }}
    />
  );
}
