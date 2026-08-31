import type { AlertInput } from "./alerts";
import { alertSummary } from "./alerts";

/**
 * Where a subscription actually goes.
 *
 * The site has no database, so the contact list *is* the store: the provider keeps the
 * address, the consent trail and the unsubscribe link, which is also what makes this
 * defensible under the GDPR without building any of it ourselves. Brevo is the default
 * because it takes arbitrary attributes per contact (so an alert can say *what* it
 * watches) and runs double opt-in natively; Resend is supported as a fallback but its
 * audiences only hold an address, so the detail is mirrored into a notification mail.
 *
 * Configure exactly one, in Vercel's environment:
 *   BREVO_API_KEY + BREVO_LIST_ID
 *   RESEND_API_KEY + RESEND_AUDIENCE_ID (+ ALERTS_NOTIFY_TO to receive the detail)
 *
 * With neither set, `providerName()` returns null and the API answers 501 rather than
 * telling a visitor they're subscribed when nothing stored their address.
 */
export type ProviderName = "brevo" | "resend";

export type SubscribeResult =
  | { ok: true; alreadyKnown: boolean }
  | { ok: false; status: number; reason: string };

export function providerName(): ProviderName | null {
  if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) return "brevo";
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) return "resend";
  return null;
}

/** Attributes carried alongside the address, readable in the provider's back office. */
function attributesFor(a: AlertInput) {
  return {
    ALERT_KIND: a.kind,
    ALERT_VALUE: a.value,
    ALERT_LABEL: a.label,
    ALERT_SUMMARY: alertSummary(a),
    LANG: a.lang.toUpperCase(),
  };
}

function brevoPost(a: AlertInput, withAttributes: boolean) {
  return fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      email: a.email,
      ...(withAttributes ? { attributes: attributesFor(a) } : {}),
      listIds: [Number(process.env.BREVO_LIST_ID)],
      // Without this, re-subscribing an address Brevo already knows is a hard 400,
      // and someone setting a second alert is the normal case, not an error.
      updateEnabled: true,
    }),
  });
}

async function brevo(a: AlertInput): Promise<SubscribeResult> {
  let res = await brevoPost(a, true);
  if (!res.ok && res.status !== 204) {
    const detail = await res.text().catch(() => "");
    // Brevo refuses an attribute that was never declared in the account, and the whole
    // subscription dies with it. Losing the *detail* of an alert is recoverable; losing
    // the address is not, so save the contact anyway and make the omission loud.
    if (/attribute/i.test(detail)) {
      console.error("[alerts] Brevo rejected the custom attributes, run scripts/brevo-setup.mjs. " + detail.slice(0, 200));
      res = await brevoPost(a, false);
      if (res.ok || res.status === 204) return { ok: true, alreadyKnown: res.status === 204 };
      const second = await res.text().catch(() => "");
      return { ok: false, status: res.status, reason: second.slice(0, 300) || res.statusText };
    }
    return { ok: false, status: res.status, reason: detail.slice(0, 300) || res.statusText };
  }
  return { ok: true, alreadyKnown: res.status === 204 };
}

async function resend(a: AlertInput): Promise<SubscribeResult> {
  const res = await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ email: a.email, unsubscribed: false }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, reason: detail.slice(0, 300) || res.statusText };
  }
  // A Resend audience stores an address and nothing else, so the only place the
  // subscription's subject can live is a mail to the owner. Best-effort on purpose:
  // the contact is already saved, and failing the request here would be a lie.
  await notifyOwner(`Alerte, ${alertSummary(a)}`, `${a.email}\n${alertSummary(a)}\nLangue : ${a.lang}`).catch(
    () => undefined,
  );
  return { ok: true, alreadyKnown: false };
}

export async function subscribe(a: AlertInput): Promise<SubscribeResult> {
  const p = providerName();
  if (!p) return { ok: false, status: 501, reason: "no_provider" };
  try {
    return p === "brevo" ? await brevo(a) : await resend(a);
  } catch (err) {
    return { ok: false, status: 502, reason: err instanceof Error ? err.message : "network" };
  }
}

/* ---------------------------------------------------------------------------
   Mail transactionnel
--------------------------------------------------------------------------- */

/** Une pièce jointe. `content` est le fichier en base64, sans préfixe `data:`. */
export interface MailAttachment {
  filename: string;
  content: string;
}

/**
 * Plafond d'une pièce jointe, en octets décodés. L'affiche d'un événement pèse quelques
 * centaines de kilo-octets ; au-delà de trois mégaoctets, l'API du fournisseur refuse le
 * message entier, et perdre la soumission pour une image serait le mauvais échange.
 * L'appelant retombe alors sur le nom du fichier.
 */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

/**
 * L'adresse qui reçoit les demandes de compte et les dépôts d'événement.
 *
 * Elle a une valeur par défaut, et ce n'est pas de la complaisance : sans elle, la
 * fonctionnalité entière tenait à une variable que personne ne pense à poser, et une
 * demande de compte arrivait dans un journal serveur que personne ne lit. Le
 * propriétaire du site est connu, son adresse n'est pas un secret, et `ALERTS_NOTIFY_TO`
 * reste là pour en mettre une autre.
 *
 * **Serveur uniquement.** Ce module n'est importé que par des routes d'API, et il doit
 * le rester : une adresse mail dans un bundle de navigateur se fait ramasser par les
 * robots à spam dans la semaine. C'est la même règle que pour `HOTEL_AID` dans
 * `lib/site.ts`, pour une raison différente.
 */
export const ownerAddress = (): string => process.env.ALERTS_NOTIFY_TO ?? "djaym.info@gmail.com";

/**
 * L'expéditeur.
 *
 * `ALERTS_NOTIFY_FROM` d'abord. À défaut, et **seulement avec Resend**,
 * `onboarding@resend.dev` : c'est l'expéditeur de démarrage de Resend, qui fonctionne
 * sans domaine vérifié mais **n'écrit qu'à l'adresse du compte Resend**. Ça suffit
 * exactement pour ce dont on a besoin ici, se prévenir soi-même, et ça ramène la mise en
 * route à une seule variable, la clé d'API. Pour écrire à un promoteur (validation,
 * refus), il faut un domaine vérifié et un `ALERTS_NOTIFY_FROM` dessus.
 *
 * Brevo n'a pas d'équivalent : il exige un expéditeur vérifié dans le compte, donc pas
 * de défaut possible, et `mailStatus()` le dit au lieu de laisser deviner.
 */
export const senderAddress = (): string =>
  process.env.ALERTS_NOTIFY_FROM ??
  // En SMTP, l'expéditeur est la boîte authentifiée : la plupart des serveurs refusent
  // un `MAIL FROM` qui ne lui correspond pas, et le déduire évite une variable de plus.
  process.env.SMTP_USER ??
  (process.env.RESEND_API_KEY ? "onboarding@resend.dev" : "");

export type MailProvider = "smtp" | "resend" | "brevo";

/**
 * Le fournisseur retenu, dans l'ordre de préférence.
 *
 * SMTP d'abord : quand une boîte du domaine est configurée, c'est elle qui doit écrire,
 * un promoteur reçoit alors sa validation depuis `raveparty.fr` et non depuis l'adresse
 * de démarrage d'un tiers. Resend ensuite, parce qu'il marche sans domaine vérifié.
 * Brevo en dernier, il ne sert de transport que s'il est seul.
 */
export function mailProvider(): MailProvider | null {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.BREVO_API_KEY) return "brevo";
  return null;
}

export interface MailStatus {
  provider: MailProvider | null;
  from: string;
  to: string;
  /** Un envoi partirait-il ? Faux dès qu'il manque une pièce. */
  ready: boolean;
  /** Les variables à poser, nommées, dans l'ordre où les poser. */
  missing: string[];
  /** Ce qu'il faut savoir de la configuration courante, en une phrase. */
  note: string;
}

/**
 * L'état du transport, tel que la console l'affiche.
 *
 * Il existe parce que « ça ne marche pas » est la pire des réponses : ici chaque pièce
 * manquante est nommée, et une configuration qui marche à moitié (Resend en mode
 * démarrage, qui n'écrit qu'au propriétaire) est annoncée comme telle plutôt que
 * découverte le jour où un promoteur ne reçoit pas sa validation.
 */
export function mailStatus(): MailStatus {
  const provider = mailProvider();
  const from = senderAddress();
  const to = ownerAddress();
  const missing: string[] = [];

  if (!provider) {
    // Les trois du SMTP d'abord : c'est la mise en route recommandée, et une variable
    // à moitié posée (l'hôte sans le mot de passe) doit se voir comme telle.
    const smtp = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !process.env[k]);
    missing.push(smtp.length === 3 ? "SMTP_HOST + SMTP_USER + SMTP_PASS (ou RESEND_API_KEY)" : smtp.join(" + "));
  }
  if (!from) missing.push("ALERTS_NOTIFY_FROM");

  const note = !provider
    ? "Aucun fournisseur : rien ne part, le détail des demandes va dans le journal serveur."
    : provider === "smtp"
      ? `Boîte ${process.env.SMTP_HOST} sur le port ${smtpPort()}. Utilise une boîte dédiée (noreply@), son mot de passe ouvre aussi la lecture du courrier.`
      : provider === "resend" && from === "onboarding@resend.dev"
        ? "Expéditeur de démarrage Resend : il n'écrit qu'à l'adresse du compte Resend. Pour prévenir un promoteur, vérifie un domaine et pose ALERTS_NOTIFY_FROM."
        : provider === "brevo" && !process.env.ALERTS_NOTIFY_FROM
          ? "Brevo exige un expéditeur vérifié dans le compte : pose ALERTS_NOTIFY_FROM."
          : "Transport configuré.";

  return { provider, from, to, ready: Boolean(provider && from && to), missing, note };
}

/** 465 par défaut (TLS implicite), 587 pour STARTTLS. C'est le port qui décide du mode,
 *  et pas un drapeau à part : sur 465 la session est chiffrée avant le premier octet. */
export const smtpPort = (): number => Number(process.env.SMTP_PORT ?? 465);

export interface MailResult {
  ok: boolean;
  /** Ce que le fournisseur a répondu, tronqué. Vide quand tout va bien. */
  detail: string;
}

/**
 * Mail transactionnel, avec le détail de l'échec.
 *
 * `sendMail()` en dessous n'en garde que le booléen, parce qu'aucun appelant ne doit
 * voir sa réussite dépendre de l'acheminement d'une copie. Mais le bouton de test de la
 * console, lui, a besoin du message exact du fournisseur : « domaine non vérifié » et
 * « clé invalide » se corrigent différemment, et un simple « échec » oblige à deviner.
 */
export async function sendMailDetailed(
  to: string,
  subject: string,
  text: string,
  attachments: MailAttachment[] = [],
): Promise<MailResult> {
  const from = senderAddress();
  if (!to) return { ok: false, detail: "aucun destinataire (ALERTS_NOTIFY_TO)" };
  if (!from) return { ok: false, detail: "aucun expéditeur (ALERTS_NOTIFY_FROM)" };

  try {
    if (mailProvider() === "smtp") return await sendSmtp(from, to, subject, text, attachments);

    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from, to: [to], subject, text,
          ...(attachments.length ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })) } : {}),
        }),
      });
      if (res.ok) return { ok: true, detail: "" };
      return { ok: false, detail: `Resend ${res.status} ${(await res.text().catch(() => "")).slice(0, 220)}` };
    }
    if (process.env.BREVO_API_KEY) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          sender: { email: from }, to: [{ email: to }], subject, textContent: text,
          ...(attachments.length ? { attachment: attachments.map((a) => ({ name: a.filename, content: a.content })) } : {}),
        }),
      });
      if (res.ok) return { ok: true, detail: "" };
      return { ok: false, detail: `Brevo ${res.status} ${(await res.text().catch(() => "")).slice(0, 220)}` };
    }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message.slice(0, 220) : "réseau" };
  }
  return { ok: false, detail: "aucun fournisseur configuré (SMTP_HOST + SMTP_USER + SMTP_PASS, ou RESEND_API_KEY)" };
}

/**
 * Mail transactionnel. Utilisé pour la soumission d'un événement, la validation d'un
 * compte promoteur, et le chemin Resend des alertes.
 *
 * Renvoie false au lieu de lever : aucun appelant ne doit voir sa réussite dépendre de
 * l'acheminement d'une copie. L'échec n'est pas perdu pour autant, il part dans le
 * journal serveur, et la console le montre à côté de ce qui n'a pas été notifié.
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  attachments: MailAttachment[] = [],
): Promise<boolean> {
  const res = await sendMailDetailed(to, subject, text, attachments);
  if (!res.ok) console.error(`[mail] échec vers ${to} : ${res.detail}`);
  return res.ok;
}

/** Le mail au propriétaire, cas particulier de `sendMail` avec son destinataire. */
export const notifyOwner = (subject: string, text: string, attachments: MailAttachment[] = []): Promise<boolean> =>
  sendMail(ownerAddress(), subject, text, attachments);

/* ---------------------------------------------------------------------------
   SMTP
--------------------------------------------------------------------------- */

/**
 * L'envoi par une boîte du domaine (Hostinger, ou n'importe quel serveur SMTP).
 *
 * ## Pourquoi c'est le chemin recommandé
 *
 * La boîte est rattachée à `raveparty.fr`, donc SPF et DKIM sont déjà posés par
 * l'hébergeur : un promoteur reçoit sa validation depuis une adresse du site, et non
 * depuis l'adresse de démarrage d'un tiers. C'est aussi un compte de moins à tenir.
 *
 * ## Ce qu'il faut savoir avant de poser les variables
 *
 * **Une boîte dédiée, jamais la boîte personnelle.** Une clé d'API ne sait qu'envoyer ;
 * le mot de passe d'une boîte ouvre aussi sa **lecture** en IMAP. Mettre celui de sa
 * boîte principale dans les variables d'un déploiement, c'est y mettre l'accès complet à
 * son courrier alors que le site n'a besoin que d'expédier. Une boîte `noreply@` rend la
 * fuite sans intérêt, et c'est ce que `mailStatus()` rappelle à l'écran.
 *
 * **Les quotas d'un hébergeur ne sont pas ceux d'un service d'envoi** (quelques
 * centaines de messages par jour, parfois par heure). Sans importance pour prévenir le
 * propriétaire et répondre à des promoteurs ; le jour où une vraie newsletter part à
 * toute la liste, c'est Brevo qui la portera, pas cette boîte.
 *
 * ## Choix d'implémentation
 *
 * Un transporteur **par envoi**, sans pool : sur des fonctions serverless, une connexion
 * gardée entre deux invocations est le plus souvent une socket morte que le serveur a
 * fermée entre-temps, et le coût d'une poignée de main TLS est sans commune mesure avec
 * celui d'un envoi manqué. Le volume attendu se compte en messages par jour.
 *
 * Les délais d'attente sont **bornés et courts**. Une fonction Vercel a un budget de
 * quelques secondes ; un serveur SMTP qui ne répond pas doit rendre la main bien avant,
 * sinon c'est l'inscription du promoteur qui expire, alors qu'elle est déjà enregistrée
 * et que seule la copie du propriétaire est en jeu.
 */
async function sendSmtp(
  from: string,
  to: string,
  subject: string,
  text: string,
  attachments: MailAttachment[],
): Promise<MailResult> {
  // Import dynamique : `nodemailer` est la seule dépendance serveur du projet, et rien
  // ne doit la charger quand le transport configuré est une API REST.
  const { createTransport } = await import("nodemailer");
  const port = smtpPort();

  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 chiffre dès la connexion, 587 négocie avec STARTTLS. Le port décide, donc il
    // n'y a pas de troisième réglage à se tromper.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text,
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, encoding: "base64" })),
    });
    // Un serveur peut accepter le message pour certains destinataires et pas pour
    // d'autres : `rejected` non vide est un échec, même si l'appel n'a pas levé.
    if (info.rejected?.length) return { ok: false, detail: `destinataire refusé : ${info.rejected.join(", ")}` };
    return { ok: true, detail: "" };
  } catch (err) {
    // Le message du serveur tel quel : « Invalid login » et « Connection timeout » ne se
    // corrigent pas de la même façon, et c'est ce que la console affiche.
    return { ok: false, detail: `SMTP ${err instanceof Error ? err.message.slice(0, 220) : "erreur"}` };
  } finally {
    transport.close();
  }
}
