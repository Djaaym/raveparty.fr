"use client";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

/**
 * Les fanions « ça m'intéresse », côté navigateur.
 *
 * La mémoire locale reste la source de vérité de l'**affichage** : elle répond
 * instantanément, elle marche sans compte, et elle marche même si le magasin serveur ne
 * répond pas. Le serveur, lui, porte la **mesure** (combien de personnes veulent voir cet
 * événement) et la **promesse** (le rappel J-7). Les deux ne servent pas à la même chose,
 * d'où deux écritures, et l'ordre compte : on écrit en local puis on prévient le serveur,
 * jamais l'inverse. Un bouton qui attendrait une réponse réseau pour changer d'état
 * donnerait l'impression de ne pas fonctionner sur une connexion de festival.
 *
 * **L'identifiant de navigateur est ce qui rend le compte honnête.** Sans lui on
 * compterait des clics, et le premier rechargement de page ferait doubler le chiffre.
 * C'est un identifiant aléatoire en `localStorage`, la forme que `components/Tracker.tsx`
 * emploie déjà et que la CNIL exempte de consentement : pas un cookie, pas d'adresse IP
 * conservée, rien qui remonte à une personne. Il ne quitte le navigateur que dans le
 * corps de la requête qui pose le fanion.
 */

const KEY = "raveradar:favs";
const VISITOR = "raveradar:vid";
const EMAIL = "raveradar:email";

const read = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
};

export function readFavs(): number[] {
  return read();
}

/**
 * L'identifiant de ce navigateur, créé au premier besoin.
 *
 * Borné à `[a-z0-9]{16,64}`, la forme que `VISITOR_RE` accepte côté serveur : un
 * `randomUUID()` porte des tirets, donc on les retire ici plutôt que d'élargir la
 * validation, un point d'accès ouvert n'accepte que ce qu'il reconnaît. Le repli couvre
 * les navigateurs sans `crypto.randomUUID` et les contextes non sécurisés, où il n'est
 * pas exposé.
 */
export function visitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const kept = localStorage.getItem(VISITOR);
    if (kept && /^[a-z0-9]{16,64}$/.test(kept)) return kept;
    const made = (
      globalThis.crypto?.randomUUID?.().replace(/-/g, "") ??
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 32)
      .padEnd(16, "0");
    localStorage.setItem(VISITOR, made);
    return made;
  } catch {
    /* Navigation privée avec le stockage refusé : on ne compte pas, et le bouton
       continue de fonctionner pour le reste de la session. */
    return "";
  }
}

/** L'adresse déjà donnée au site (alertes, newsletter, rappel), pour ne pas la resaisir. */
export const readEmail = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(EMAIL) || "";
  } catch {
    return "";
  }
};

export const rememberEmail = (email: string) => {
  try {
    localStorage.setItem(EMAIL, email);
  } catch {
    /* Sans stockage, l'adresse est quand même partie au serveur : c'est la resaisie
       qu'on perd, pas l'inscription. */
  }
};

/**
 * Prévient le serveur. **Ne lève jamais et n'est jamais attendu par l'affichage** : le
 * fanion vaut d'abord pour son propriétaire, et un magasin indisponible ne doit pas
 * rendre le bouton inutilisable. L'appelant lit le compte rendu s'il en veut un.
 */
export async function pushInterest(input: {
  eventId: number;
  on: boolean;
  email?: string;
  lang?: Lang;
}): Promise<{ ok: boolean; count?: number; remind?: boolean }> {
  const visitor = visitorId();
  const email = input.email ?? "";
  if (!visitor && !email) return { ok: false };
  try {
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: input.eventId, on: input.on, visitor, email, lang: input.lang ?? "fr" }),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; count?: number; remind?: boolean };
  } catch {
    return { ok: false };
  }
}

/** L'état d'un fanion, synchronisé entre toutes les cartes de la page. */
export function useFav(id: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(read().includes(id));
    sync();
    window.addEventListener("favs", sync);
    return () => window.removeEventListener("favs", sync);
  }, [id]);

  /* Rend le nouvel état plutôt que rien : l'appelant doit savoir s'il vient de poser ou
     de retirer le fanion pour décider d'ouvrir le panneau de rappel, et relire l'état
     juste après l'événement serait une course avec le rendu de React. */
  const toggle = useCallback((): boolean => {
    const f = read();
    const i = f.indexOf(id);
    const next = i === -1;
    if (next) f.push(id);
    else f.splice(i, 1);
    try {
      localStorage.setItem(KEY, JSON.stringify(f));
    } catch {
      /* Sans stockage, l'état ne survit pas au rechargement, mais le clic compte quand
         même côté serveur. Mieux vaut ça que rien. */
    }
    setOn(next);
    window.dispatchEvent(new Event("favs"));
    return next;
  }, [id]);

  return { on, toggle };
}
