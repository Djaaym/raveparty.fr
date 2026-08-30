import type { Lang, RaveEvent } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { hotelStay } from "@/lib/hotels";
import { getDict } from "@/lib/i18n";

/**
 * Le bloc « où dormir » d'une fiche événement.
 *
 * Il vient après la carte du lieu, parce que c'est la question qui suit « c'est où ».
 * Il ne liste aucun hôtel et n'en recommande aucun : il ouvre la recherche du
 * partenaire sur la ville, aux dates de l'événement (voir `lib/hotels.ts`, qui dit
 * pourquoi une liste figée serait de la donnée inventée).
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

  return (
    <div className="info-card hotel-card">
      <span className="eyebrow">{t("hotel.eyebrow")}</span>
      <h2 className="h-md">{t("hotel.title").replace("{city}", e.city)}</h2>
      <p className="hotel-lead">
        {t("hotel.lead").replace("{city}", e.city).replace("{nights}", nights)}
      </p>
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
        rel="sponsored noopener noreferrer"
        className="btn btn-primary btn-block hotel-cta"
        data-goal="hotel"
      >
        {t("hotel.cta").replace("{city}", e.city)}
      </a>
      <p className="hotel-note">
        {t("hotel.disclosure").replace("{brand}", stay.brand || t("hotel.partner"))}
      </p>
    </div>
  );
}
