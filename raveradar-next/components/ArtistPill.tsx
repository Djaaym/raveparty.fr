import Link from "next/link";
import { artistPhoto } from "@/lib/artist-photos";

/**
 * Une pilule d'annuaire qui porte le portrait de l'artiste quand on l'a.
 *
 * Le portrait vivait uniquement sur `/artistes` et sur la fiche de l'artiste, alors
 * qu'un nom seul ne distingue rien : les listes d'artistes d'une page genre, d'une
 * page lieu ou du hub des genres montraient 1 860 pilules interchangeables pendant
 * qu'on avait la photo sous la main. C'est le même fichier que partout ailleurs
 * (`public/artists/`, déjà carré et duotoné par `avatars.py`), servi en 22 px.
 *
 * `alt=""` est volontaire : le nom est écrit dans la pilule même, un alt descriptif
 * le ferait annoncer deux fois. La copie indexable reste celle de la fiche artiste,
 * avec son vrai texte alternatif et son crédit.
 *
 * Sans photo, la pilule reste du texte — coller un rond à initiale sur les milliers
 * de noms qu'on n'a pas remplirait la page de vignettes qui ne distinguent rien.
 * `lf-art` est posé dans les deux cas quand même : la ligne de flex étire toutes les
 * pilules à la hauteur de la plus haute, et sans `align-items: center` le texte des
 * voisines sans photo resterait collé en haut.
 */
export default function ArtistPill({
  href,
  name,
  slug,
  count,
}: {
  href: string;
  name: string;
  slug: string;
  count?: number;
}) {
  const photo = artistPhoto(slug);
  return (
    <Link href={href} className="lf-art">
      {photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className="lf-av"
          src={`/artists/${photo.file}`}
          alt=""
          width={22}
          height={22}
          loading="lazy"
          decoding="async"
        />
      )}
      {name}
      {count !== undefined && <b>{count}</b>}
    </Link>
  );
}
