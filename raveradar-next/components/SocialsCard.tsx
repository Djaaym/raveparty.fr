import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import {
  NETWORK_LABEL,
  NETWORK_LABEL_EN,
  socialLinks,
  socialUrl,
  type Socials,
} from "@/lib/socials";
import InstagramFeed from "./InstagramFeed";

/** Le glyphe Instagram, en SVG inline, un fichier de moins à charger pour une icône. */
function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Le bloc « Réseaux sociaux » d'une fiche.
 *
 * Il remplace l'ancienne « Galerie » : huit dégradés générés à la volée qui n'apprenaient
 * rien à personne. Ce qu'un lecteur veut à cet endroit de la page, c'est l'affiche, le
 * line-up complet et les stories de la veille, c'est-à-dire le compte de l'organisateur.
 * On l'envoie donc à la source au lieu de meubler.
 *
 * `owner` dit à qui appartient le compte affiché. Sur une soirée de club, on retombe
 * volontairement sur le compte de la salle, mais la fiche l'annonce : laisser croire à un
 * compte de marque qui n'existe pas serait exactement le genre de demi-mensonge que la
 * galerie de dégradés racontait déjà.
 */
export default function SocialsCard({
  s,
  lang,
  owner,
  ownerName,
}: {
  s: Socials;
  lang: Lang;
  owner?: "venue" | "artist" | "event";
  ownerName?: string;
}) {
  const t = getDict(lang);
  const labels = lang === "en" ? NETWORK_LABEL_EN : NETWORK_LABEL;
  const links = socialLinks(s);
  if (links.length === 0) return null;

  const ig = s.instagram;
  const others = links.filter((l) => l.net !== "instagram");

  return (
    <div className="info-card">
      <h2 className="h-md">{t("social.title")}</h2>

      {owner === "venue" && ownerName && (
        <p className="social-owner">{t("social.venuenote").replace("{name}", ownerName)}</p>
      )}

      {ig && (
        <a
          className="social-ig"
          href={socialUrl("instagram", ig)}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <span className="social-ig-mark">
            <InstagramMark />
          </span>
          <span className="social-ig-text">
            <b>@{ig}</b>
            <span>{t("social.follow")}</span>
          </span>
          <span className="social-ig-go" aria-hidden="true">
            ↗
          </span>
        </a>
      )}

      {others.length > 0 && (
        <div className="linkfarm social-others">
          {others.map((l) => (
            <a key={l.net} href={l.url} target="_blank" rel="noopener noreferrer nofollow">
              {labels[l.net]}
              {l.handle && ` · ${l.handle}`}
            </a>
          ))}
        </div>
      )}

      {ig && s.posts && s.posts.length > 0 && (
        <>
          <h3 className="social-sub">{t("social.posts")}</h3>
          <InstagramFeed
            handle={ig}
            posts={s.posts}
            labels={{
              load: t("social.load"),
              note: t("social.loadnote"),
              open: t("social.openpost"),
              postnum: t("social.postnum"),
            }}
          />
        </>
      )}
    </div>
  );
}
