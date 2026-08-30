import { permanentRedirect } from "next/navigation";
import { showRedirect } from "@/lib/shows";

/**
 * `/show/{artiste}-{lieu}-{date}` ne rend plus de page : ~1 850 URLs qui
 * répétaient le line-up et la billetterie de l'événement, c'est du contenu
 * quasi dupliqué à l'échelle d'un annuaire. La route reste pour renvoyer un
 * 301 vers l'événement (ou vers l'artiste si le slug ne correspond plus à
 * aucune date connue) : les URLs déjà indexées gardent leur valeur.
 *
 * Rendu à la demande, plus de `generateStaticParams`, donc plus de 1 850
 * pages au build et plus une seule entrée au sitemap.
 */
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { slug: string } }) {
  permanentRedirect(showRedirect(params.slug));
}
