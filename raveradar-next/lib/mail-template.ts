/**
 * Le gabarit des messages que le site envoie.
 *
 * ## Pourquoi un module, et pas du HTML écrit dans chaque route
 *
 * Six messages partent d'ici (demande de compte, dépôt d'événement, validation ou refus
 * d'un compte, validation ou refus d'un dépôt, rappel J-7, test d'envoi) et cinq
 * n'étaient que du texte brut : un pavé en chasse fixe, sans nom, sans couleur, sans un
 * seul lien lisible. C'est pourtant le seul endroit où le site parle à quelqu'un hors de
 * son domaine, et le premier que voit un organisateur à qui on demande sa confiance. Une
 * fiche soignée derrière un mail qui ressemble à une sortie de `cron` dit exactement
 * l'inverse de ce qu'on veut faire croire.
 *
 * ## Une seule structure, deux rendus
 *
 * L'appelant décrit son message en blocs (`MailDoc`), jamais en HTML, et `renderMail()`
 * en tire **les deux versions à la fois**. C'est la règle qui vaut déjà pour
 * `placeTally()` / `eventsForPlace()` et pour `lib/catalog-export.ts` : deux rendus
 * écrits séparément divergent toujours, et ici la version texte est celle que lisent les
 * clients en mode texte, les lecteurs d'écran et les filtres anti-spam. Un message qui
 * n'a qu'une partie HTML se note mal, et une partie texte qui aurait vieilli à part
 * serait pire encore, personne ne la relit jamais.
 *
 * ## Ce qu'un client mail n'est pas
 *
 * Ce n'est pas un navigateur, et la mise en page se limite donc à ce qui tient partout :
 * tableaux `role="presentation"`, styles **en ligne** (Gmail jette `<style>` sur mobile),
 * aucune image de fond, aucune fonte distante (Syne et Inter n'arriveront jamais, on
 * déclare Helvetica et on s'en tient là), largeur bornée à 600 px. Les deux endroits qui
 * dégradent proprement sont assumés : Outlook sous Windows ignore `border-radius` (les
 * boutons y sont carrés, ils restent cliquables) et ignore `linear-gradient`, d'où le
 * `bgcolor` posé **en plus** sur chaque cellule qui en porte un, sinon la barre de marque
 * s'y rendrait transparente.
 *
 * ## Module feuille, exprès
 *
 * Il n'importe rien du catalogue : `lib/interest-mail.ts` en dépend et tire déjà
 * `lib/data.ts`, mais les routes de compte, elles, n'ont aucune raison de payer 830 Ko
 * pour envoyer une notification. Même raison que `lib/display.ts` et `lib/hotels.ts`.
 */

/** La palette du site, celle de `globals.css`, en valeurs littérales.
 *  Les variables CSS ne traversent pas un client mail, donc chaque couleur est écrite en
 *  clair : c'est le seul endroit du dépôt où la duplication est la bonne réponse. */
export const MAIL_COLORS = {
  bg: "#050608",
  card: "#12131B",
  cardSoft: "#181A24",
  line: "#23252F",
  white: "#F3F3F8",
  grey: "#A7A9B8",
  greyDim: "#7D7F8E",
  blue: "#2F7BFF",
  violet: "#8B5CFF",
  magenta: "#FF2D9B",
  cyan: "#19E7FF",
  acid: "#C6FF3D",
} as const;

const FONT = "Helvetica,Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";

export type MailTone = "primary" | "ghost" | "ok" | "danger";

export interface MailAction {
  href: string;
  label: string;
  /** `primary` = dégradé de marque, `ok` = vert acide, `danger` = magenta, `ghost` = contour. */
  tone?: MailTone;
}

export interface MailRow {
  k: string;
  /** Texte nu, échappé au rendu. */
  v: string;
  /** Rend la valeur cliquable. Un lien dans un tableau reste un lien dans la version texte. */
  href?: string;
}

export type MailBlock =
  /** Un paragraphe. C'est le **seul** bloc qui admette du HTML (`<b>`, `<a>`), parce
   *  qu'il est rédigé par nous : ce qu'on y interpole s'échappe avec `escapeMail()`. */
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "rows"; rows: MailRow[] }
  | { kind: "actions"; actions: MailAction[] }
  | { kind: "panel"; title?: string; accent?: string; blocks: MailBlock[] }
  /** Un texte qu'on cite sans le réécrire (présentation d'un organisateur, description
   *  d'un dépôt) : encadré, pour qu'on voie où il commence et où il finit. */
  | { kind: "quote"; title?: string; text: string }
  | { kind: "note"; text: string }
  | { kind: "divider" };

export interface MailDoc {
  lang?: "fr" | "en";
  /** Le kicker au-dessus du titre, en capitales espacées. Deux ou trois mots. */
  kicker?: string;
  title: string;
  /** La ligne que les clients mail affichent à côté de l'objet, dans la liste des
   *  messages. Sans elle, ils y recopient le premier texte venu, souvent « RaveRadar ». */
  preheader?: string;
  blocks: MailBlock[];
  /** Le pied de page, sous le trait. Pourquoi ce message arrive, et rien d'autre. */
  footnote?: string;
}

export interface RenderedMail {
  html: string;
  text: string;
}

export const escapeMail = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------------------------------------------------------------------------
   HTML
--------------------------------------------------------------------------- */

const TONES: Record<MailTone, { bg: string; fallback: string; color: string; border: string }> = {
  // Le dégradé de marque (`--grad-main`), avec le violet médian en `bgcolor` : c'est lui
  // que voit Outlook, et c'est la couleur qui reste la plus proche de l'ensemble.
  primary: {
    bg: "linear-gradient(115deg,#2F7BFF 0%,#8B5CFF 48%,#FF2D9B 100%)",
    fallback: "#8B5CFF",
    color: "#FFFFFF",
    border: "#8B5CFF",
  },
  ok: { bg: "", fallback: "#C6FF3D", color: "#050608", border: "#C6FF3D" },
  // Le refus est **en contour**, jamais plein : posé côte à côte avec l'approbation, un
  // bouton magenta plein appelle le doigt autant qu'elle, et ces deux liens sont à sens
  // unique. La couleur les distingue, la matière dit lequel est l'action attendue.
  danger: { bg: "", fallback: "#181A24", color: "#FF2D9B", border: "#FF2D9B" },
  ghost: { bg: "", fallback: "#181A24", color: "#F3F3F8", border: "#23252F" },
};

function button(a: MailAction): string {
  const t = TONES[a.tone ?? "primary"];
  const bg = t.bg ? `background-color:${t.fallback};background-image:${t.bg};` : `background-color:${t.fallback};`;
  return (
    `<a href="${escapeMail(a.href)}" style="display:inline-block;${bg}border:1px solid ${t.border};` +
    `border-radius:999px;color:${t.color};font-family:${FONT};font-size:15px;font-weight:bold;` +
    `line-height:1.2;padding:13px 24px;text-decoration:none;mso-line-height-rule:exactly;max-width:100%">` +
    `${escapeMail(a.label)}</a>`
  );
}

/** `gap` est l'espace sous le bloc. Il se passe en paramètre plutôt que d'être retouché
 *  après coup sur la chaîne rendue : une substitution sur du HTML déjà construit finit
 *  toujours par attraper autre chose que ce qu'elle visait, c'est le piège du motif
 *  `lineup: \[[^\]]*\]` qui avait poussé un `data.ts` qui ne compilait pas. */
function blockHtml(b: MailBlock, gap = 20): string {
  switch (b.kind) {
    case "text":
      return `<p style="margin:0 0 ${gap - 4}px;color:${b.muted ? MAIL_COLORS.grey : MAIL_COLORS.white};font-family:${FONT};font-size:15px;line-height:1.6">${b.text}</p>`;

    case "rows":
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 ${gap}px">` +
        b.rows
          .map((r, i) => {
            const border = i === b.rows.length - 1 ? "none" : `1px solid ${MAIL_COLORS.line}`;
            // La valeur est **toujours échappée** : une ligne de tableau porte de la
            // saisie (nom de structure, titre d'événement, adresse), et c'est le seul
            // endroit du message où une chaîne arrive sans être relue. Seul `text` admet
            // du HTML, parce qu'il est écrit par nous, et son appelant échappe ce qu'il
            // y interpole. La règle est celle de `lib/richtext.ts` : on échappe d'abord,
            // on reconnaît ses propres motifs ensuite, dans ce sens-là il n'y a pas de
            // liste noire à tenir.
            const safe = escapeMail(r.v);
            const value = r.href
              ? `<a href="${escapeMail(r.href)}" style="color:${MAIL_COLORS.cyan};text-decoration:underline;word-break:break-word">${safe}</a>`
              : safe;
            return (
              `<tr>` +
              `<td style="padding:9px 12px 9px 0;border-bottom:${border};color:${MAIL_COLORS.grey};font-family:${FONT};font-size:13px;line-height:1.45;vertical-align:top;white-space:nowrap">${escapeMail(r.k)}</td>` +
              `<td style="padding:9px 0;border-bottom:${border};color:${MAIL_COLORS.white};font-family:${FONT};font-size:14px;line-height:1.45;vertical-align:top;text-align:right;font-weight:bold;word-break:break-word;overflow-wrap:anywhere">${value}</td>` +
              `</tr>`
            );
          })
          .join("") +
        `</table>`
      );

    case "actions":
      /* Les boutons sont des `inline-block` dans **une seule cellule**, pas une cellule
         chacun : une rangée de tableau ne se replie pas, donc deux boutons côte à côte
         fixaient la largeur minimale du message entier. Mesuré dans une iframe de 320 px,
         le message débordait de 29 px (349 de large pour 320 de viewport) et le coupable
         n'était ni les URL ni les tableaux de valeurs, qui se replient très bien, mais
         cette paire « Valider / Écarter ». Des `inline-block` passent à la ligne quand la
         place manque, et l'espace vient d'une enveloppe (`padding`) plutôt que d'une
         marge, que plusieurs clients mail jettent sur une ancre.

         Il faut vraiment mesurer, et dans un vrai viewport étroit : Chromium refuse une
         fenêtre de moins de 485 px, donc `--window-size=380` rogne la capture sans
         rétrécir la page, ce qui *montre* un débordement là où il n'y en a pas et en
         cacherait un vrai. L'iframe est ce qui donne un viewport honnête. */
      return (
        `<div style="margin:0 0 ${gap - 12}px">` +
        b.actions
          .map((a) => `<span style="display:inline-block;padding:0 10px 10px 0">${button(a)}</span>`)
          .join("") +
        `</div>`
      );

    case "panel":
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;margin:0 0 ${gap}px">` +
        `<tr><td bgcolor="${MAIL_COLORS.cardSoft}" style="background-color:${MAIL_COLORS.cardSoft};border:1px solid ${b.accent ?? MAIL_COLORS.line};border-radius:16px;padding:18px 20px">` +
        (b.title
          ? `<p style="margin:0 0 10px;color:${MAIL_COLORS.white};font-family:${FONT};font-size:15px;font-weight:bold;line-height:1.3">${escapeMail(b.title)}</p>`
          : "") +
        b.blocks.map((x) => blockHtml(x, 14)).join("") +
        `</td></tr></table>`
      );

    case "quote":
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;margin:0 0 ${gap}px">` +
        `<tr><td bgcolor="${MAIL_COLORS.bg}" style="background-color:${MAIL_COLORS.bg};border:1px solid ${MAIL_COLORS.line};border-left:3px solid ${MAIL_COLORS.cyan};border-radius:12px;padding:16px 18px">` +
        (b.title
          ? `<p style="margin:0 0 8px;color:${MAIL_COLORS.greyDim};font-family:${MONO};font-size:11px;letter-spacing:.12em;text-transform:uppercase">${escapeMail(b.title)}</p>`
          : "") +
        // Un texte cité garde ses retours à la ligne : le recoller d'un seul tenant
        // transformerait une liste de trois points en une phrase bancale, le défaut déjà
        // payé sur l'aplatissement des descriptions dans `lib/catalog-export.ts`.
        `<div style="color:${MAIL_COLORS.white};font-family:${FONT};font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeMail(b.text)}</div>` +
        `</td></tr></table>`
      );

    case "note":
      return `<p style="margin:0 0 ${gap - 6}px;color:${MAIL_COLORS.greyDim};font-family:${FONT};font-size:12px;line-height:1.55">${escapeMail(b.text)}</p>`;

    case "divider":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:0 0 ${gap}px"><tr><td height="1" bgcolor="${MAIL_COLORS.line}" style="background-color:${MAIL_COLORS.line};height:1px;line-height:1px;font-size:0">&nbsp;</td></tr></table>`;
  }
}

/* ---------------------------------------------------------------------------
   Texte
--------------------------------------------------------------------------- */

/** Le HTML admis dans un `text` de bloc est le nôtre (gras, liens), jamais de la saisie :
 *  la version texte le retire, plutôt que de laisser passer des balises en clair. */
const stripTags = (s: string): string =>
  s
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m, href: string, label: string) => `${label} (${href})`)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

function blockText(b: MailBlock, lang: "fr" | "en"): string[] {
  const c = lang === "fr" ? " : " : ": ";
  switch (b.kind) {
    case "text":
      return [stripTags(b.text), ""];
    case "rows": {
      // Les clés alignées sur la plus longue : lu dans un terminal ou un client en mode
      // texte, c'est ce qui rend un tableau lisible sans tableau.
      const pad = Math.max(...b.rows.map((r) => r.k.length));
      return [
        ...b.rows.map((r) => {
          // Le lien n'est répété que s'il dit autre chose que la valeur : « Site :
          // https://fornap.fr/ https://fornap.fr/ » et « info@x.fr mailto:info@x.fr »
          // sont ce que donne la règle naïve, et ça se voit dans la version texte, pas
          // dans le gabarit.
          const extra = r.href && r.href !== r.v && r.href !== `mailto:${r.v}` ? ` ${r.href}` : "";
          return `${r.k.padEnd(pad)}${c}${r.v}${extra}`;
        }),
        "",
      ];
    }
    case "actions":
      return [...b.actions.map((a) => `${a.label}${c}${a.href}`), ""];
    case "panel":
      return [...(b.title ? [b.title.toUpperCase(), ""] : []), ...b.blocks.flatMap((x) => blockText(x, lang))];
    case "quote":
      return [...(b.title ? [`${b.title} :`] : []), b.text, ""];
    case "note":
      return [b.text, ""];
    case "divider":
      return ["----", ""];
  }
}

/* ---------------------------------------------------------------------------
   Rendu
--------------------------------------------------------------------------- */

const SITE_HOST = "raveparty.fr";

/**
 * Construit le message complet.
 *
 * `siteUrl` est un paramètre et non un import de `lib/site.ts` pour garder le module
 * feuille : tous les appelants l'ont déjà sous la main.
 */
export function renderMail(doc: MailDoc, siteUrl: string): RenderedMail {
  const lang = doc.lang ?? "fr";
  const body = doc.blocks.map((b) => blockHtml(b)).join("\n");
  const pre = doc.preheader ?? "";

  const html = `<!doctype html>
<html lang="${lang}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeMail(doc.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${MAIL_COLORS.bg};color:${MAIL_COLORS.white};-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;color:${MAIL_COLORS.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeMail(pre)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${MAIL_COLORS.bg}" style="background-color:${MAIL_COLORS.bg};width:100%;border-collapse:collapse">
<tr><td align="center" style="padding:28px 16px 40px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse">

<tr><td style="padding:0 4px 18px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:10px" valign="middle"><img src="${siteUrl}/icon-96.png" width="30" height="30" alt="" style="display:block;border:0;width:30px;height:30px;border-radius:8px"></td>
    <td valign="middle" style="font-family:${FONT};font-size:19px;font-weight:bold;letter-spacing:-.01em;color:${MAIL_COLORS.white}">RaveRadar</td>
  </tr></table>
</td></tr>

<tr><td bgcolor="${MAIL_COLORS.violet}" style="background-color:${MAIL_COLORS.violet};background-image:linear-gradient(90deg,${MAIL_COLORS.blue} 0%,${MAIL_COLORS.violet} 50%,${MAIL_COLORS.magenta} 100%);height:4px;line-height:4px;font-size:0;border-radius:4px 4px 0 0">&nbsp;</td></tr>

<tr><td bgcolor="${MAIL_COLORS.card}" style="background-color:${MAIL_COLORS.card};border:1px solid ${MAIL_COLORS.line};border-top:none;border-radius:0 0 20px 20px;padding:28px 26px 24px">
${doc.kicker ? `<p style="margin:0 0 8px;color:${MAIL_COLORS.cyan};font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase">${escapeMail(doc.kicker)}</p>` : ""}
<h1 style="margin:0 0 18px;color:${MAIL_COLORS.white};font-family:${FONT};font-size:23px;font-weight:bold;line-height:1.25">${escapeMail(doc.title)}</h1>
${body}
</td></tr>

<tr><td style="padding:20px 6px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MAIL_COLORS.greyDim}">
${doc.footnote ? `<p style="margin:0 0 8px;color:${MAIL_COLORS.greyDim}">${escapeMail(doc.footnote)}</p>` : ""}
<p style="margin:0"><a href="${siteUrl}/" style="color:${MAIL_COLORS.greyDim};text-decoration:underline">${SITE_HOST}</a> &nbsp;·&nbsp; ${lang === "fr" ? "L'annuaire des raves et festivals techno en Europe" : "The directory of raves and techno festivals in Europe"}</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const lines = [
    "RAVERADAR",
    "",
    ...(doc.kicker ? [doc.kicker.toUpperCase(), ""] : []),
    doc.title,
    "",
    ...doc.blocks.flatMap((b) => blockText(b, lang)),
    "----",
    ...(doc.footnote ? [doc.footnote] : []),
    `${siteUrl}/`,
  ];

  // Deux lignes vides d'affilée viennent du bloc qui se termine par une, suivi d'un autre
  // qui commence par la sienne. Une seule suffit à séparer, et un texte troué se lit mal.
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return { html, text };
}
