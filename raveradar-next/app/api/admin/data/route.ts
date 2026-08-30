import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN } from "@/lib/admin-auth";
import { publicAccount, type AccountStatus } from "@/lib/accounts";
import {
  deleteAccount, deleteSubmission, getAccount, getSubmission,
  isConfigured, listAccounts, listAllSubmissions, ping, saveAccount, saveSubmission,
} from "@/lib/accounts-store";
import { mailStatus, ownerAddress, sendMailDetailed } from "@/lib/subscribers";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ce que la console lit et fait.
 *
 * Une seule route pour les deux, parce que les deux sont gardées par le même cookie et
 * qu'un GET et un POST suffisent : lire l'état complet, puis agir sur une ligne.
 *
 * **Rien ici ne suppose la porte franchie** : chaque appel revérifie le cookie. Une
 * console qui ne contrôlerait qu'à l'affichage laisserait ses propres routes ouvertes,
 * et ce sont elles qui suppriment.
 */

function denied(): NextResponse | null {
  if (!ADMIN.isConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  if (!ADMIN.verifyToken(cookies().get(ADMIN.cookie)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/** L'état complet : les comptes, les dépôts, et si le magasin répond. */
export async function GET() {
  const no = denied();
  if (no) return no;

  try {
    const [accounts, submissions, store] = await Promise.all([listAccounts(), listAllSubmissions(), ping()]);
    // Le nombre de dépôts par compte est affiché à côté du bouton de suppression : on le
    // compte ici plutôt que dans la page, la suppression étant en cascade.
    const counts: Record<string, number> = {};
    for (const s of submissions) counts[s.owner] = (counts[s.owner] ?? 0) + 1;

    return NextResponse.json(
      {
        store: { configured: isConfigured(), ...store },
        // L'état du transport voyage avec le reste : la console doit pouvoir dire
        // pourquoi une demande n'a prévenu personne, au même endroit qu'elle la montre.
        mail: mailStatus(),
        accounts: accounts.map((a) => ({ ...publicAccount(a), submissions: counts[a.email] ?? 0 })),
        submissions,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "store", detail: err instanceof Error ? err.message.slice(0, 200) : "" },
      { status: 502 },
    );
  }
}

const STATUSES: AccountStatus[] = ["pending", "approved", "rejected", "suspended"];

/**
 * Une action sur une ligne.
 *
 * `{ kind: "account", email, action }` avec action parmi les quatre statuts, ou `delete`.
 * `{ kind: "submission", id, action }` avec `published`, `rejected`, `pending`, ou `delete`.
 *
 * Aucun mail n'est envoyé d'ici, contrairement aux liens reçus par mail : ceux-là sont
 * la décision de première main, celle qu'on prend en découvrant la demande, et prévenir
 * est alors le geste attendu. La console sert à reprendre, corriger, faire le ménage :
 * repasser un compte de `approved` à `pending` pour vérifier une pièce ne mérite pas un
 * mail, et supprimer un compte de test encore moins.
 */
export async function POST(req: Request) {
  const no = denied();
  if (no) return no;
  if (tooManyRequests(`admin:${clientKey(req)}`, 40)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (body.kind === "account") {
      const email = typeof body.email === "string" ? body.email.toLowerCase().slice(0, 254) : "";
      if (!email) return NextResponse.json({ error: "invalid" }, { status: 400 });

      if (action === "delete") {
        const res = await deleteAccount(email);
        if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
        return NextResponse.json({ ok: true, removedSubmissions: res.submissions });
      }
      if (!STATUSES.includes(action as AccountStatus)) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      const account = await getAccount(email);
      if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
      account.status = action as AccountStatus;
      account.decidedAt = new Date().toISOString();
      await saveAccount(account);
      return NextResponse.json({ ok: true, account: publicAccount(account) });
    }

    if (body.kind === "mail" && action === "test") {
      /* Un envoi réel vers l'adresse du propriétaire, avec le message exact du
         fournisseur en retour. C'est la seule façon de distinguer « clé invalide » de
         « domaine non vérifié », et donc la seule façon de finir la configuration sans
         lire les journaux de Vercel. */
      const res = await sendMailDetailed(
        ownerAddress(),
        "RaveRadar, test d'envoi",
        `Si tu lis ce message, les alertes du site arrivent bien à cette adresse.\n\n${SITE_URL}/admin`,
      );
      return NextResponse.json({ ok: res.ok, detail: res.detail, to: ownerAddress() });
    }

    if (body.kind === "submission") {
      const id = typeof body.id === "string" ? body.id.slice(0, 60) : "";
      if (!id) return NextResponse.json({ error: "invalid" }, { status: 400 });

      if (action === "delete") {
        const ok = await deleteSubmission(id);
        return ok
          ? NextResponse.json({ ok: true })
          : NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (action !== "published" && action !== "rejected" && action !== "pending") {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      const sub = await getSubmission(id);
      if (!sub) return NextResponse.json({ error: "not_found" }, { status: 404 });
      sub.status = action;
      sub.decidedAt = new Date().toISOString();
      await saveSubmission(sub);
      return NextResponse.json({ ok: true, submission: sub });
    }

    return NextResponse.json({ error: "invalid" }, { status: 400 });
  } catch (err) {
    console.error("[admin] action impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
}
