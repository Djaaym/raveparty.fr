import { NextResponse } from "next/server";
import { parseInterest } from "@/lib/interest";
import { isConfigured, memoryOnlyAllowed, ownedBy, setInterest } from "@/lib/interest-store";
import { currentAccount } from "@/lib/promoter-session";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

/* Écriture pure, et la lecture porte un compteur qui bouge : rien n'est cacheable ici,
   et les layouts qui englobent exportent `revalidate`. */
export const dynamic = "force-dynamic";

/**
 * Le fanion « ça m'intéresse ».
 *
 * Trois choses se passent sur un clic, dans cet ordre, et l'ordre compte : on compte,
 * on mémorise, et **seulement si une adresse est connue** on promet un rappel. Un
 * visiteur sans compte et sans adresse voit donc son clic pris en compte de bout en
 * bout, ce qui est le point de départ de la fonctionnalité : mesurer ce que les gens
 * veulent voir, pas seulement ce que les inscrits veulent voir.
 *
 * **L'adresse du compte l'emporte sur celle du formulaire.** Quelqu'un de connecté n'a
 * rien à saisir, et son fanion va dans les favoris de son compte, c'est-à-dire dans la
 * même ligne du magasin, indexée par son adresse. Le navigateur garde de son côté sa
 * copie en `localStorage`, exactement comme les alertes : sans compte, la mémoire du
 * navigateur est la seule réponse honnête à « qu'est-ce que j'ai marqué ».
 *
 * Codes de réponse : 200 pris en compte · 400 corps inutilisable · 429 trop vite ·
 * 501 pas de magasin. Le 501 compte autant qu'ailleurs sur ce site : sans magasin, un
 * 200 annoncerait un rappel que personne n'enverrait, et c'est précisément le faux
 * succès que `/api/alerts` refuse déjà de rendre.
 */
export async function POST(req: Request) {
  /* Budget plus large que celui d'un formulaire : poser puis retirer un fanion en
     parcourant une grille est un geste normal, un envoi de formulaire ne l'est pas.
     Bucket à part, comme le recommande `tooManyRequests`, pour que les deux budgets
     ne se partagent pas un compteur. */
  if (tooManyRequests(`int:${clientKey(req)}`, 30)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const input = parseInterest(body);
  if (!input) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (!isConfigured() && !memoryOnlyAllowed()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  /* Le compte est lu, pas exigé. S'il existe, son adresse remplace celle du corps :
     c'est la seule dont on soit sûr, elle a été confirmée à l'inscription. */
  const account = await currentAccount(req).catch(() => null);
  const email = account?.email ?? input.email;

  try {
    const count = await setInterest(
      input.eventId,
      { email, visitor: input.visitor },
      input.on,
      { email, lang: input.lang, at: new Date().toISOString() },
    );
    return NextResponse.json({ ok: true, on: input.on, count, remind: Boolean(email && input.on) });
  } catch (err) {
    console.error("[interest] écriture impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
}

/**
 * Les fanions du compte connecté.
 *
 * **Il n'y a pas de lecture de compteur ici**, et c'est volontaire : toutes les pages
 * reçoivent la table entière au rendu de leur layout (`countsForPages()`, distribuée par
 * `components/InterestCounts.tsx`), donc aucun bouton n'a jamais besoin de demander son
 * chiffre. Un point d'accès que plus rien n'appelle est un lien mort, même règle que les
 * maps indexées par id : il a été retiré plutôt que gardé « au cas où ».
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  /* Les fanions du compte connecté, tous appareils confondus. C'est ce que
     `localStorage` ne peut pas faire : un fanion posé dans le métro doit se retrouver
     dans « Mes favoris » sur un ordinateur. Jamais mis en cache (la réponse dépend du
     cookie de session) et vide pour un visiteur anonyme, dont la liste est déjà dans son
     navigateur. */
  if (params.has("mine")) {
    const account = await currentAccount(req).catch(() => null);
    if (!account) {
      return NextResponse.json({ ids: [] }, { headers: { "cache-control": "no-store" } });
    }
    return NextResponse.json(
      { ids: await ownedBy(account.email).catch(() => [] as number[]) },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
