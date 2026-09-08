import type { ReactNode } from "react";

/* Un bloc secondaire replié sur mobile, ouvert au-delà de 720 px.
 *
 * Sur un téléphone, une fiche artiste faisait 10 672 px de haut dont 4 198 pour ses
 * seules éditions passées, et une fiche événement 7 916 px dont 1 932 pour « Tu
 * pourrais aussi aimer » : ce sont des blocs qu'on garde parce qu'ils valent quelque
 * chose (l'archive a sa valeur SEO, le maillage relie les pages entre elles), mais
 * qu'un lecteur ne demande pas en arrivant. Il les traverse pour atteindre le reste.
 *
 * Trois choix portés ici plutôt que dans chaque appelant :
 *
 * - `<details>` et pas un état React. Tous les liens du bloc restent dans le HTML
 *   rendu au serveur, replié comme déplié, donc le maillage interne qu'un crawler
 *   suit ne bouge pas, et les pages qui portent le SEO du site ne paient pas un
 *   octet de JavaScript de plus. C'est la logique de `SearchableLinks`, dont le
 *   champ masque des lignes sans rien aller chercher.
 * - Le repli est réservé au **secondaire**. Le listing pour lequel la page existe
 *   (« Prochaines dates · Techno », « Événements · Paris ») ne passe jamais par ici :
 *   replier ce qu'on est venu lire serait un volet devant la porte d'entrée.
 * - Le titre reste un `h2` à l'intérieur du `<summary>` (le modèle de contenu de
 *   `summary` admet un élément de titre), donc la hiérarchie h1 → h2 de la page est
 *   exactement celle d'avant.
 */
export default function Fold({
  title,
  count,
  card = false,
  className = "",
  children,
}: {
  title: ReactNode;
  count?: ReactNode;
  /** Le bloc est une carte (`.info-card`) et non une section de la colonne. */
  card?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = ["foldbox", card ? "info-card foldbox-card" : "foldbox-sec", className]
    .filter(Boolean)
    .join(" ");
  return (
    <details className={cls}>
      <summary className="foldbox-sum">
        <h2 className="h-md">{title}</h2>
        {count != null && <span className="foldbox-count">{count}</span>}
      </summary>
      {children}
    </details>
  );
}
