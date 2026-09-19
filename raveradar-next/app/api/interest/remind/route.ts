import { NextResponse } from "next/server";
import { EVENTS } from "@/lib/data";
import { todayISO } from "@/lib/display";
import { REMIND_DAYS, remindTarget } from "@/lib/interest";
import { reminderMail } from "@/lib/interest-mail";
import { isConfigured, markReminded, memoryOnlyAllowed, remindList } from "@/lib/interest-store";
import { mailProvider, sendMailDetailed } from "@/lib/subscribers";

/* `nodemailer` n'a pas de socket sur le runtime edge, et cette route envoie du mail :
   même déclaration que les autres routes qui expédient. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* Un envoi par destinataire, et une journée peut en porter plusieurs dizaines : le
   budget par défaut d'une fonction Vercel ne suffit pas. */
export const maxDuration = 60;

/**
 * Le rappel J-7 : un mail à qui a posé un fanion sur un événement qui a lieu dans une
 * semaine.
 *
 * **Déclenché par une planification, pas par un lecteur.** `vercel.json` l'appelle une
 * fois par jour ; Vercel pose alors `Authorization: Bearer $CRON_SECRET`, et c'est la
 * seule porte. Sans `CRON_SECRET`, la route répond 501 au lieu de s'ouvrir : un point
 * d'accès public qui envoie du mail en masse est le genre de chose qu'on ne laisse pas
 * entrouverte « en attendant », et le repli permissif se serait oublié.
 *
 * **La fenêtre est un jour exact, pas « moins de sept jours ».** Le cron passe tous les
 * jours : une condition « à moins de sept jours » réenverrait le message chaque matin
 * jusqu'à l'événement. On vise donc le jour `today + 7` et lui seul, et le drapeau
 * `sent` posé sur chaque ligne ferme la porte restante, celle d'une exécution relancée
 * à la main ou d'un cron qui se déclenche deux fois. Les deux gardes sont nécessaires :
 * la fenêtre évite l'envoi répété, le drapeau évite l'envoi double.
 *
 * **Le jour de référence est fixé une fois** et passé à tout ce qui en dépend, jusqu'à
 * `hotelStay()` qui date la recherche d'hôtels du mail. C'est la même raison que dans
 * les trois portes de mise en avant de `lib/data.ts` : deux appels à `todayISO()` dans
 * la même exécution peuvent tomber de part et d'autre de minuit.
 *
 * **Une ligne qui échoue n'arrête pas les autres**, et elle n'est pas marquée comme
 * envoyée, donc la prochaine exécution la reprend, tant que la fenêtre du jour tient.
 * Un rappel perdu est un désagrément ; une exécution qui s'arrête à la troisième adresse
 * priverait tous les suivants du leur.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "not_configured", detail: "pose CRON_SECRET, sinon cette route reste fermée" },
      { status: 501 },
    );
  }
  const url = new URL(req.url);
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";
  if (given !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  /* Le repli mémoire vaut ici exactement ce qu'il vaut à l'écriture : utilisable en
     `next dev`, refusé en production, où une file de rappels qui vit dans la mémoire
     d'une lambda aurait disparu au premier redéploiement. */
  if (!isConfigured() && !memoryOnlyAllowed()) return NextResponse.json({ error: "no_store" }, { status: 501 });

  /* `--dry` du pauvre, même intention que partout ailleurs dans le dépôt : voir ce qui
     partirait avant que ça parte, message rendu compris. Le secret est exigé pour ça
     aussi, la liste des adresses intéressées n'est pas publique. */
  const dry = url.searchParams.has("dry");

  /* Le transport n'est exigé que pour un envoi réel : refuser un essai à blanc faute de
     clé d'API empêcherait justement de vérifier le message avant d'ouvrir le robinet. */
  if (!dry && !mailProvider()) return NextResponse.json({ error: "no_mail" }, { status: 501 });

  const today = todayISO();
  const target = remindTarget(today, REMIND_DAYS);
  /* `date` et pas `lastDay()` : le rappel prépare une arrivée, donc il se cale sur le
     premier jour. Un festival de huit jours n'a pas à être annoncé sept jours avant sa
     clôture, il serait déjà en cours. */
  const due = EVENTS.filter((e) => e.date === target);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let sample: { event: number; to: string; subject: string; text: string; html?: string } | undefined;
  const report: string[] = [];

  for (const e of due) {
    const list = await remindList(e.id).catch(() => []);
    if (!list.length) continue;
    let s = 0;
    for (const { key, rec } of list) {
      if (rec.sent) {
        skipped += 1;
        continue;
      }
      if (dry) {
        s += 1;
        /* Le premier message est rendu et renvoyé en clair. Un essai à blanc qui ne
           montre que des compteurs ne prouve pas grand-chose : ce qu'on veut vérifier
           avant d'ouvrir le robinet, c'est le texte, la date, le tarif et surtout le lien
           d'hôtel, qui dépend de la salle et du jour de référence. Rien n'est envoyé, et
           la route est déjà derrière le secret. */
        sample ??= (({ subject, text, html }) => ({
          event: e.id,
          to: rec.email,
          subject,
          text,
          /* La version HTML sur demande seulement : elle pèse plusieurs kilo-octets et
             n'intéresse qu'au moment où on relit la mise en page. `?dry=1&html=1`. */
          ...(url.searchParams.has("html") ? { html } : {}),
        }))(reminderMail(e, rec.lang, today));
        continue;
      }
      const mail = reminderMail(e, rec.lang, today);
      const res = await sendMailDetailed(rec.email, mail.subject, mail.text, [], mail.html);
      if (!res.ok) {
        failed += 1;
        console.error(`[rappel] ${e.id} → ${rec.email} : ${res.detail}`);
        continue;
      }
      await markReminded(e.id, key, rec, today).catch((err) =>
        /* Le mail est parti ; ne pas pouvoir écrire le drapeau est le cas où un doublon
           est possible demain. On le journalise plutôt que de le taire. */
        console.error(`[rappel] marquage impossible ${e.id}/${key}:`, err instanceof Error ? err.message : err),
      );
      s += 1;
      sent += 1;
    }
    if (s) report.push(`${e.id} ${e.title} (${e.city}) : ${s}`);
  }

  return NextResponse.json({ ok: true, today, target, events: due.length, sent, failed, skipped, dry, report, sample });
}
