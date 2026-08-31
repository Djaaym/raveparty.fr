import type { Lang } from "./types";

/**
 * Ce qu'est un compte promoteur, et ce qui fait qu'une inscription est recevable.
 *
 * Module **feuille** au sens de `lib/display.ts` : il n'importe que des types, aucune
 * I/O, aucun accès au catalogue. Le formulaire d'inscription est un composant client, et
 * il valide la saisie avec exactement les mêmes fonctions que la route qui l'enregistre.
 * Deux validations écrites séparément divergent toujours, et c'est celle du serveur qui
 * a raison : autant qu'il n'y en ait qu'une.
 *
 * ## Pourquoi une modération, et pas une publication directe
 *
 * La règle de contenu du projet est qu'aucune donnée n'est inventée : dates, line-ups,
 * lieux et prix sont vérifiés avant publication. Un compte promoteur ne lève pas cette
 * règle, il donne juste un canal propre à ceux qui ont l'information de première main.
 * D'où deux portes successives, `status` sur le compte (le propriétaire approuve la
 * structure une fois) et `status` sur chaque dépôt (il relit l'événement avant qu'il
 * entre au catalogue). Un compte approuvé accélère la relecture, il ne la remplace pas.
 */

/* ---------------------------------------------------------------------------
   Types
--------------------------------------------------------------------------- */

/** Où en est un compte. `pending` tant que le propriétaire n'a pas tranché. */
export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

/** Ce que la structure est, ce qui change la lecture qu'on fait de sa demande. */
export const PROMOTER_KINDS = ["collectif", "organisateur", "salle", "label", "agence", "autre"] as const;
export type PromoterKind = (typeof PROMOTER_KINDS)[number];

/** Le profil, la partie qu'un promoteur voit et modifie. */
export interface PromoterProfile {
  /** Le nom qui s'affichera à côté d'un événement : la structure, pas la personne. */
  name: string;
  kind: PromoterKind;
  /** La personne qu'on aura au téléphone. Un dossier se traite avec quelqu'un. */
  contact: string;
  phone: string;
  city: string;
  country: string;
  website: string;
  instagram: string;
  soundcloud: string;
  /** SIRET, numéro d'entreprise, licence d'entrepreneur de spectacles. Facultatif, mais
   *  c'est la pièce qui fait passer un dossier de « plausible » à « vérifiable ». */
  legalId: string;
  /** Quelques phrases sur la structure : c'est le texte que le propriétaire lit pour
   *  décider, donc un minimum de longueur est exigé à l'inscription. */
  about: string;
  lang: Lang;
}

/** Le compte entier, tel qu'il est stocké. Le mot de passe n'y figure jamais en clair. */
export interface PromoterAccount extends PromoterProfile {
  email: string;
  /** Empreinte scrypt, format documenté dans `lib/promoter-auth.ts`. */
  password: string;
  status: AccountStatus;
  /** ISO. `decidedAt` porte l'approbation ou le refus, `note` la raison d'un refus. */
  createdAt: string;
  decidedAt?: string;
  note?: string;
  /**
   * Le propriétaire a-t-il reçu le mail annonçant cette demande ?
   *
   * Faux quand le transport n'était pas configuré ou qu'il a refusé. La console
   * l'affiche, sinon une demande arrivée un jour où le mail était cassé attendrait
   * indéfiniment sans que rien ne le signale : c'est précisément le genre de silence
   * qui fait perdre un contributeur.
   */
  notified?: boolean;
}

/** Ce qu'on renvoie au navigateur : tout le profil sauf l'empreinte. */
export type PublicAccount = Omit<PromoterAccount, "password">;

export const publicAccount = (a: PromoterAccount): PublicAccount => {
  const { password: _password, ...rest } = a;
  return rest;
};

/* ---------------------------------------------------------------------------
   Dépôts d'événement
--------------------------------------------------------------------------- */

export type SubmissionStatus = "pending" | "published" | "rejected";

export interface EventSubmission {
  id: string;
  /** L'e-mail du compte qui a déposé, c'est la clé du compte. */
  owner: string;
  status: SubmissionStatus;
  createdAt: string;
  decidedAt?: string;
  note?: string;
  /** Même rôle que sur un compte : le mail est-il parti ? Voir `PromoterAccount`. */
  notified?: boolean;

  title: string;
  type: string;
  /** Clé de `GENRES`, une seule : c'est elle qui donne la couleur et la page du genre. */
  genre: string;
  /** Libellés libres (« Hard Groove », « Neurofunk »). Ils n'ont pas de page, cf. la
   *  règle sur `ARTIST_STYLES.s` : ils décrivent, ils ne cliquent pas. */
  subgenres: string[];
  city: string;
  country: string;
  venue: string;
  address: string;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  lineup: string[];
  /** Description en français, source de vérité du catalogue. Mise en forme légère,
   *  format décrit dans `lib/richtext.ts`. */
  desc: string;
  /** Traduction anglaise, facultative : sans elle, `/en` reprend le texte français. */
  descEn: string;
  price: string;
  currency: string;
  priceNote: "" | "estimated" | "unknown";
  ticketUrl: string;
  posterUrl: string;
  /** Nom du fichier déposé, quand une affiche est jointe au mail du propriétaire. */
  posterFile: string;
  contactEmail: string;
  lang: Lang;

  /**
   * Coordonnées de la salle, résolues **au moment de la vérification**.
   *
   * Le formulaire ne les demande pas (un promoteur tape « Le Sucre, Lyon »), mais le
   * catalogue les exige : sans elles, pas de point sur la carte ni de distance pour
   * « autour de moi ». On géocode donc une salle à la fois, quand le dépôt passe en
   * `published`, plutôt qu'un lot entier depuis une fonction serverless qui a quelques
   * secondes de budget et un service tiers limité à une requête par seconde.
   *
   * Absentes quand le géocodage n'a rien trouvé : on ne pose jamais un point approximatif,
   * l'export le signale et la fiche attend une saisie à la main.
   */
  lat?: number;
  lng?: number;
  /** La requête qui a répondu, pour que la relecture sache sur quoi le point est tombé. */
  geocodeQuery?: string;
}

/* ---------------------------------------------------------------------------
   Validation
--------------------------------------------------------------------------- */

/** Une erreur par champ, la clé étant le `name` de l'input. Le formulaire les affiche
 *  sous le champ concerné plutôt qu'en un seul message qui ne dit pas où regarder. */
export type FieldErrors = Record<string, string>;

export const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Même tolérance que `lib/alerts.ts` : on refuse le déchet, pas les adresses exotiques. */
export function isEmail(raw: string): boolean {
  const v = raw.trim();
  if (v.length < 6 || v.length > 254) return false;
  if (/\s/.test(v)) return false;
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1) return false;
  const d = v.slice(at + 1);
  return d.includes(".") && !d.startsWith(".") && !d.endsWith(".") && !d.includes("..");
}

export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

/**
 * Une URL qu'on acceptera d'afficher. `http`/`https` seulement, et c'est le point :
 * un champ libre rendu en `<a href>` accepte sinon `javascript:`, et le lien sortant
 * d'une fiche est exactement l'endroit où ça ne doit pas arriver.
 */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Un handle Instagram, avec ou sans arobase, ou l'URL complète. Rendu sans arobase. */
export function normalizeHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  const m = v.match(/(?:instagram\.com|soundcloud\.com)\/([^/?#]+)/i);
  if (m) v = m[1];
  return v.replace(/^@+/, "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 40);
}

/**
 * Ce qu'on exige d'un mot de passe.
 *
 * Dix caractères et deux familles de signes. Volontairement modeste : les règles de
 * composition agressives poussent surtout à écrire `Motdepasse1!`, alors que la longueur
 * est la seule chose qui fasse vraiment travailler une attaque. Ce qu'on refuse en plus,
 * c'est le mot de passe qui *est* l'adresse ou le nom de la structure, parce que celui-là
 * est deviné du premier coup.
 */
export function passwordIssue(pw: string, email = "", name = ""): string | null {
  if (pw.length < 10) return "short";
  if (pw.length > 200) return "long";
  const families = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (families < 2) return "weak";
  const low = pw.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length > 2 && low.includes(local)) return "obvious";
  if (name.length > 3 && low.includes(name.toLowerCase())) return "obvious";
  return null;
}

const MIN_ABOUT = 80;

/** L'inscription, telle qu'elle arrive sur le fil. */
export interface SignupInput {
  email: string;
  password: string;
  profile: PromoterProfile;
}

export function parseSignup(body: unknown): { input: SignupInput } | { errors: FieldErrors } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const email = normalizeEmail(str(b.email, 254));
  if (!isEmail(email)) errors.email = "email";

  const password = typeof b.password === "string" ? b.password : "";
  const name = str(b.name, 120);
  const pwIssue = passwordIssue(password, email, name);
  if (pwIssue) errors.password = pwIssue;

  if (name.length < 2) errors.name = "required";
  const kind = PROMOTER_KINDS.includes(b.kind as PromoterKind) ? (b.kind as PromoterKind) : "collectif";
  const contact = str(b.contact, 120);
  if (contact.length < 2) errors.contact = "required";
  const city = str(b.city, 80);
  if (!city) errors.city = "required";
  const country = str(b.country, 80);
  if (!country) errors.country = "required";

  const about = str(b.about, 1200);
  if (about.length < MIN_ABOUT) errors.about = "about";

  // Une URL invalide est signalée, une URL vide ne l'est pas : ces champs sont facultatifs.
  const website = normalizeUrl(str(b.website, 300));
  if (website === null) errors.website = "url";

  if (b.terms !== true) errors.terms = "required";

  if (Object.keys(errors).length) return { errors };

  return {
    input: {
      email,
      password,
      profile: {
        name,
        kind,
        contact,
        phone: str(b.phone, 40),
        city,
        country,
        website: website ?? "",
        instagram: normalizeHandle(str(b.instagram, 120)),
        soundcloud: normalizeHandle(str(b.soundcloud, 120)),
        legalId: str(b.legalId, 60),
        about,
        lang: b.lang === "en" ? "en" : "fr",
      },
    },
  };
}

/** La mise à jour d'un profil : mêmes règles, sans l'e-mail ni le mot de passe, qui ont
 *  chacun leur propre chemin (l'un est la clé du compte, l'autre demande l'ancien). */
export function parseProfile(body: unknown, current: PromoterProfile): { profile: PromoterProfile } | { errors: FieldErrors } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = str(b.name, 120);
  if (name.length < 2) errors.name = "required";
  const contact = str(b.contact, 120);
  if (contact.length < 2) errors.contact = "required";
  const city = str(b.city, 80);
  if (!city) errors.city = "required";
  const country = str(b.country, 80);
  if (!country) errors.country = "required";
  const about = str(b.about, 1200);
  if (about.length < MIN_ABOUT) errors.about = "about";
  const website = normalizeUrl(str(b.website, 300));
  if (website === null) errors.website = "url";

  if (Object.keys(errors).length) return { errors };

  return {
    profile: {
      ...current,
      name,
      kind: PROMOTER_KINDS.includes(b.kind as PromoterKind) ? (b.kind as PromoterKind) : current.kind,
      contact,
      phone: str(b.phone, 40),
      city,
      country,
      website: website ?? "",
      instagram: normalizeHandle(str(b.instagram, 120)),
      soundcloud: normalizeHandle(str(b.soundcloud, 120)),
      legalId: str(b.legalId, 60),
      about,
      lang: b.lang === "en" ? "en" : b.lang === "fr" ? "fr" : current.lang,
    },
  };
}
