import type { Lang, RaveEvent } from "@/lib/types";
import { cardBg, imageFull, photoCredit, isPhotoOf } from "@/lib/data";
import { imageAlt } from "@/lib/format";
import { getDict } from "@/lib/i18n";

/**
 * The full-bleed poster behind an event or show hero. Shared by `EventDetail` and
 * `ShowPage` because both used to paint the card's 560×700 crop as a CSS background,
 * a 2.5× upscale of a thumbnail, invisible to image search, and an LCP the preload
 * scanner could never find. Falls back to the genre gradient when there is no file.
 *
 * Le crédit sous l'image n'est pas une signature de politesse : une photo prise sur
 * Wikimedia Commons n'est réutilisable qu'à la condition de nommer l'auteur, sa licence
 * et de renvoyer vers la page du fichier. Les affiches d'organisateurs n'en portent pas,
 * c'est l'organisateur qui les diffuse pour annoncer sa propre soirée, donc
 * `photoCredit()` ne rend quelque chose que là où l'obligation existe.
 */
export default function HeroImage({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const src = imageFull(e);
  if (!src) return <div className="bg" style={{ backgroundImage: cardBg(e) }} />;
  const credit = photoCredit(e);
  const t = getDict(lang);
  return (
    <>
      <img
        className="bg"
        src={src}
        alt={imageAlt(e, lang, isPhotoOf(e))}
        decoding="async"
        /* Lowercased on purpose: react-dom 18 doesn't know `fetchPriority` and would pass
           the camelCase spelling through as an unknown prop, with a dev warning. */
        {...{ fetchpriority: "high" }}
      />
      {credit && (
        <p className="photo-credit">
          {t("photo.credit").replace("{author}", credit.author).replace("{license}", credit.license)}{" "}
          {credit.page ? (
            <a href={credit.page} target="_blank" rel="noopener noreferrer nofollow">
              Wikimedia Commons
            </a>
          ) : (
            "Wikimedia Commons"
          )}
        </p>
      )}
    </>
  );
}
