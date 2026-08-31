import { ADMIN, isAdminEmail } from "./admin-auth";
import { currentAccount, cookieValue } from "./promoter-session";

/**
 * Qui a le droit d'agir dans la console.
 *
 * Deux chemins, indépendants, et c'est délibéré :
 *
 * 1. **Le compte du propriétaire.** Une session promoteur dont l'adresse est déclarée
 *    dans `ADMIN_EMAILS` **et dont le compte est approuvé**. C'est le chemin normal :
 *    on se connecte comme sur le reste du site, et la console s'ouvre.
 * 2. **Le mot de passe** (`ADMIN_PASSWORD`, à défaut `TRACKING_PASSWORD`). Il reste,
 *    comme accès de secours : sans lui, perdre son mot de passe de compte ou casser le
 *    magasin fermerait la seule porte permettant de réparer.
 *
 * ## Pourquoi « approuvé » et pas seulement « la bonne adresse »
 *
 * Rien ne vérifie qu'on possède l'adresse qu'on saisit à l'inscription : il n'y a pas de
 * confirmation par mail. Ouvrir la console sur la seule foi d'une adresse reviendrait
 * donc à la donner au premier qui s'inscrit avec celle du propriétaire. Exiger un compte
 * **approuvé** referme la porte sans machinerie nouvelle : le seul moyen d'être approuvé
 * est un clic dans le mail de validation, qui part vers la boîte du propriétaire. Une
 * fausse candidature s'y voit et ne s'approuve pas.
 */

export type AdminVia = "password" | "account";

export interface AdminAccess {
  ok: boolean;
  via: AdminVia | null;
  /** L'adresse du compte, quand l'accès vient de là. La console l'affiche. */
  email: string | null;
}

const DENIED: AdminAccess = { ok: false, via: null, email: null };

export async function adminAccess(req: Request): Promise<AdminAccess> {
  if (ADMIN.verifyToken(cookieValue(req, ADMIN.cookie))) return { ok: true, via: "password", email: null };

  const account = await currentAccount(req).catch(() => null);
  if (account && account.status === "approved" && isAdminEmail(account.email)) {
    return { ok: true, via: "account", email: account.email };
  }
  return DENIED;
}

/** Le mot de passe est-il seulement configuré ? Utilisé pour dire « pas de secours
 *  possible » plutôt que de laisser croire à un formulaire qui n'ouvrira rien. */
export const passwordGateOpen = (): boolean => ADMIN.isConfigured();
