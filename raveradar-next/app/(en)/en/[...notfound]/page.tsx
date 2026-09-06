import { notFound } from "next/navigation";

/**
 * Le rattrapage des adresses qui ne correspondent à aucune route.
 *
 * Sans lui, la 404 du groupe ne se déclenche que sur un `notFound()` appelé depuis une
 * page existante (un slug de festival inconnu, par exemple) : une adresse qui ne
 * ressemble à aucune route du site n'atteint aucun groupe, donc aucun layout, et
 * retombe sur l'écran par défaut de Next. Un segment attrape-tout à la racine du groupe
 * anglais capte ce reste et le renvoie vers `app/(en)/not-found.tsx`.
 *
 * Il ne peut rien voler aux vraies routes : un segment statique (`/villes`) comme un
 * segment dynamique (`/festival/[slug]`) l'emportent toujours sur un attrape-tout, qui
 * n'est consulté que lorsque rien d'autre ne correspond.
 *
 * `notFound()` et non un rendu direct : c'est lui qui fait répondre **404**, et une
 * page d'erreur servie en 200 est bien pire qu'une page moche, elle se fait indexer.
 */
export default function CatchAll() {
  notFound();
}
