import type { Lang, RaveEvent } from "@/lib/types";
import { outboundRel } from "@/lib/display";
import { fmtDate } from "@/lib/format";
import { hotelStay } from "@/lib/hotels";
import { getDict } from "@/lib/i18n";

/**
 * Le bloc « où dormir » d'une fiche événement.
 *
 * Il vient après la carte du lieu, parce que c'est la question qui suit « c'est où ».
 * Il ne liste aucun hôtel et n'en recommande aucun : il ouvre la recherche du
 * partenaire **sur les coordonnées de la salle**, aux dates de l'événement, classée
 * par distance (voir `lib/hotels.ts`, qui dit pourquoi une liste figée serait de la
 * donnée inventée).
 *
 * La carte annonce ce que le lien fait vraiment, d'où les deux jeux de libellés :
 * `hotel.*venue` quand `stay.near` nomme la salle, `hotel.*` quand il retombe sur la
 * ville parce que le libellé n'était pas citable. Promettre « près du Rex Club » une
 * recherche qu'on n'a pas su centrer serait le défaut que ce bloc existe pour éviter.
 *
 * Trois points non négociables sur ce lien :
 * - `rel="sponsored"`, comme le lien billetterie affilié. C'est un lien rémunéré,
 *   et un lien rémunéré non déclaré est une infraction aux règles de Google sur les
 *   liens, ce qu'un site dont toute la valeur est le SEO ne peut pas se permettre.
 * - la mention d'affiliation est **visible**, pas en pied de page : le lecteur doit
 *   savoir avant de cliquer que la réservation nous rapporte.
 * - `data-goal` en fait un objectif compté sur /suivi, à côté de « billetterie »,
 *   sinon la deuxième source de revenus du site n'a aucune ligne à elle.
 *
 * Ne se rend pas si aucun partenaire n'est configuré, et l'appelant ne le rend pas
 * sur une édition terminée.
 */
export default function HotelsCard({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const stay = hotelStay(e, lang);
  if (!stay) return null;

  const t = getDict(lang);
  const nights = `${stay.nights} ${t(stay.nights > 1 ? "hotel.nights" : "hotel.night")}`;
  /* `near` vaut la ville quand la salle n'était pas citable : on bascule alors sur les
     libellés « à {city} », sinon la carte dirait « près de Paris » à Paris. */
  const atVenue = stay.near !== e.city;
  const key = (k: string) => t(atVenue ? `hotel.${k}venue` : `hotel.${k}`);
  /* Remplacement par fonction, jamais par chaîne : `String.replace` interprète `$&`
     et `$'` dans un remplacement littéral, et les libellés de salle viennent du champ
     libre de Shotgun. Aucun n'en porte aujourd'hui, c'est bien pour ça qu'un tel bug
     passerait inaperçu le jour où l'un en portera. */
  const fill = (s: string) =>
    s.replace(/\{(near|city|nights)\}/g, (_, k: string) =>
      k === "near" ? stay.near : k === "city" ? e.city : nights,
    );

  return (
    <div className="info-card hotel-card">
      <span className="eyebrow">{t("hotel.eyebrow")}</span>
      <h2 className="h-md">{fill(key("title"))}</h2>
      <p className="hotel-lead">{fill(key("lead"))}</p>
      <div className="hotel-facts">
        <div>
          <em>{t("hotel.checkin")}</em>
          <b>{fmtDate(stay.checkin, lang)}</b>
        </div>
        <div>
          <em>{t("hotel.checkout")}</em>
          <b>{fmtDate(stay.checkout, lang)}</b>
        </div>
        <div>
          <em>{t("hotel.stay")}</em>
          <b>{nights}</b>
        </div>
      </div>
      <a
        href={stay.url}
        target="_blank"
        rel={outboundRel(true)}
        className="btn btn-primary btn-block hotel-cta"
        data-goal="hotel"
      >
        {fill(key("cta"))}
      </a>
      <p className="hotel-note">
        {t("hotel.disclosure").replace("{brand}", stay.brand || t("hotel.partner"))}
      </p>
    </div>
  );
}
