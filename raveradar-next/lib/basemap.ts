/** Le fond de carte, déclaré à un seul endroit.
 *
 *  CARTO a fermé ses tuiles publiques : `basemaps.cartocdn.com` répond toujours
 *  200 avec une vraie image, mais peint « API KEY REQUIRED » en travers de
 *  chaque tuile. Rien côté client ne pouvait le voir, ni un statut, ni une
 *  erreur réseau, seulement l'œil sur la carte, et c'est bien comme ça que le
 *  défaut est arrivé jusqu'en production.
 *
 *  OpenFreeMap sert le même Dark Matter (même fond `rgb(12,12,12)`, même eau
 *  `rgb(27,27,29)` que le `dark_all` d'avant) en tuiles vectorielles : pas de
 *  clé, pas de compte, pas de quota, usage commercial explicitement autorisé.
 *  C'est ce dernier point qui l'emporte sur les tuiles d'openstreetmap.org,
 *  dont la politique d'usage réserve les serveurs de la fondation aux petits
 *  volumes et exclut les services commerciaux : un site qui porte des liens
 *  d'affiliation n'y a pas sa place.
 *
 *  Une carte vectorielle se rend avec MapLibre, pas avec Leaflet. Aucun style
 *  matriciel sombre équivalent n'est servi sans clé aujourd'hui, c'est le prix
 *  du changement, et il se paie en octets : d'où le montage différé du bloc
 *  carte d'une fiche (voir `MiniMap`), qui ne charge le moteur que si le
 *  lecteur descend jusqu'à lui.
 */
export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

/** OSM exige l'attribution, OpenMapTiles aussi (le schéma des tuiles). */
export const BASEMAP_ATTRIB =
  '<a href="https://openfreemap.org" target="_blank" rel="nofollow noopener noreferrer">OpenFreeMap</a> · ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="nofollow noopener noreferrer">OpenMapTiles</a> · ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="nofollow noopener noreferrer">OpenStreetMap</a>';

/** MapLibre rend des tuiles de 512 px : à échelle égale, son zoom vaut celui de
 *  Leaflet moins un. Les niveaux du site sont écrits en « zoom Leaflet » depuis
 *  le départ, on convertit ici plutôt que de les réécrire à cinq endroits. */
export const z = (leafletZoom: number) => leafletZoom - 1;

/** L'épingle, dans son enveloppe, et l'enveloppe n'est pas décorative.
 *
 *  MapLibre positionne un marqueur en écrivant un `transform` **en style inline
 *  sur l'élément qu'on lui passe**. Or `.map-pin` porte `animation: pulse`, et
 *  une animation CSS l'emporte sur le style inline : les 685 épingles se
 *  retrouvaient empilées à l'origine de la carte, un gros point magenta dans le
 *  coin, pendant que le calcul de position, lui, était juste. Leaflet ne montrait
 *  pas le défaut parce qu'un `divIcon` enveloppe déjà le HTML fourni : c'est ce
 *  qui manquait, et pas autre chose. L'enveloppe reste donc, quelle que soit la
 *  bibliothèque : ce que MapLibre déplace et ce que le CSS anime doivent être
 *  deux éléments distincts. */
export function mapPin(): HTMLElement {
  const wrap = document.createElement("div");
  const pin = document.createElement("div");
  pin.className = "map-pin";
  wrap.appendChild(pin);
  return wrap;
}
