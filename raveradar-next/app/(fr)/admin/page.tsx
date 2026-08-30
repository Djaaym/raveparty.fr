import type { Metadata } from "next";
import Link from "next/link";
import AdminConsole from "@/components/AdminConsole";

/**
 * `/admin`, la console du propriétaire.
 *
 * Même statut que `/suivi` : pas de `Nav`, pas de `Footer`, aucune entrée au sitemap,
 * aucun lien pointant ici depuis le site. C'est un outil servi par la même application,
 * et la seule façon d'entrer est de connaître l'URL **et** le mot de passe.
 *
 * Trois refus s'empilent, exprès. Le `robots` d'ici et le `Disallow` de `app/robots.ts`
 * la tiennent hors de l'index, politesse plus que sécurité, un robot pouvant ignorer les
 * deux. Le vrai verrou est le mot de passe sur `/api/admin/*` : sans cookie valide les
 * routes répondent 401, et la page rend un formulaire au-dessus d'une coquille vide.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration - RaveRadar",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminPage() {
  return (
    <main className="adm-page">
      <div className="wrap">
        <AdminConsole />
        <p className="adm-back">
          <Link href="/">← Retour au site</Link> · <Link href="/suivi">Suivi d&apos;audience</Link>
        </p>
      </div>
    </main>
  );
}
