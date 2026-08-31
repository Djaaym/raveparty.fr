import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminAccess } from "@/lib/admin-access";
import { EVENTS, eventPath } from "@/lib/data";
import { isEmptyEdit, parseEdit, type EditInput } from "@/lib/event-edits";
import { deleteEdit, editFor, isConfigured, memoryOnlyAllowed, saveEdit } from "@/lib/event-edits-store";
import { clientKey, tooManyRequests } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Corriger une fiche depuis la fiche elle-même.
 *
 * Trois verbes, une seule porte : `adminAccess()`, exactement celle de `/admin`. Le
 * drapeau lisible qui décide d'afficher le bouton (`rr_admin_on`) n'accorde rien, il ne
 * fait qu'éviter un appel réseau aux 99,99 % de visiteurs anonymes ; **c'est ici que
 * l'autorisation est vérifiée**, à chaque appel, comme sur les routes de la console.
 *
 * ## La revalidation fait partie de l'écriture
 *
 * Les fiches sont générées statiquement. Sans `revalidatePath()`, une correction
 * n'apparaîtrait qu'au prochain passage du `revalidate = 3600` des layouts, donc jusqu'à
 * une heure plus tard : on croirait avoir perdu sa saisie et on la referait. Les deux
 * langues sont revalidées ensemble, ce sont deux pages distinctes pour un même
 * événement.
 */

/** Les chemins que porte un événement, FR et EN. `eventPath()` sait déjà si la fiche
 *  vit sous `/festival` ou sous `/event`, et quelle édition porte le slug nu. */
const pathsFor = (id: number): string[] => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return [];
  const path = eventPath(e);
  return [path, `/en${path}`];
};

/** L'état de la porte et la correction en cours. Le client n'appelle ce GET que si le
 *  drapeau lisible est posé : pour tout le monde d'autre, la fiche ne fait aucun appel. */
export async function GET(req: Request) {
  const access = await adminAccess(req);
  if (!access.ok) return NextResponse.json({ can: false }, { headers: { "cache-control": "no-store" } });

  const id = Number(new URL(req.url).searchParams.get("id"));
  const edit = Number.isFinite(id) ? await editFor(id).catch(() => null) : null;
  return NextResponse.json(
    {
      can: true,
      by: access.email ?? "mot de passe",
      // Sans magasin, l'éditeur le dit avant qu'on écrive dix lignes : même règle que le
      // formulaire d'alertes, un faux succès coûte plus cher qu'un refus clair.
      open: isConfigured() || memoryOnlyAllowed(),
      persistent: isConfigured(),
      edit,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Enregistre la correction. Le corps porte les champs tels qu'ils sont à l'écran ;
 *  `parseEdit()` ne garde que ceux qui diffèrent vraiment du catalogue. */
export async function PUT(req: Request) {
  const access = await adminAccess(req);
  if (!access.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (tooManyRequests(`edit:${clientKey(req)}`, 30)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (!isConfigured() && !memoryOnlyAllowed()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const base = EVENTS.find((x) => x.id === Number(body.id));
  if (!base) return NextResponse.json({ error: "unknown_event" }, { status: 404 });

  const parsed = parseEdit(body as EditInput, base, access.email ?? "mot de passe");
  if ("errors" in parsed) return NextResponse.json({ error: "invalid", fields: parsed.errors }, { status: 400 });

  try {
    // Une correction vidée de sa substance (tout ramené à la valeur du catalogue) est un
    // retour à l'original, pas une ligne vide à garder dans la file de `/admin`.
    if (isEmptyEdit(parsed.edit)) await deleteEdit(base.id);
    else await saveEdit(parsed.edit);
  } catch (err) {
    console.error("[edits] écriture impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  for (const p of pathsFor(base.id)) revalidatePath(p);
  return NextResponse.json({ ok: true, edit: isEmptyEdit(parsed.edit) ? null : parsed.edit });
}

/** Revient au catalogue. Sert deux fois : annuler une correction, et la retirer une fois
 *  qu'elle a été saisie dans `lib/data.ts`. */
export async function DELETE(req: Request) {
  const access = await adminAccess(req);
  if (!access.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  try {
    await deleteEdit(id);
  } catch (err) {
    console.error("[edits] suppression impossible:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  for (const p of pathsFor(id)) revalidatePath(p);
  return NextResponse.json({ ok: true });
}
