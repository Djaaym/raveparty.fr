"use client";
import { useCallback, useEffect, useState } from "react";
import type { EventSubmission, FieldErrors, PublicAccount } from "@/lib/accounts";

/**
 * La session promoteur, côté navigateur.
 *
 * Deux pages en dépendent, `/account` (se connecter, s'inscrire, suivre ses dépôts) et
 * `/organizer` (déposer un événement), et elles doivent dire exactement la même chose
 * d'un même état. D'où un seul hook, et surtout **un seul appel réseau partagé** : la
 * promesse en cours est mémorisée au niveau du module, donc deux composants montés dans
 * la même page interrogent `/api/promoteur/me` une fois, pas deux.
 *
 * Le cookie de session est `HttpOnly` : le JavaScript ne le voit pas, ne peut pas le
 * lire, et c'est voulu. La seule façon de savoir qui est connecté est donc de le
 * demander au serveur, et c'est aussi ce qui garde les deux pages **statiques** : elles
 * se rendent sans session au build, l'état arrive après l'hydratation. Une page rendue
 * dynamiquement pour afficher un nom coûterait la génération statique de tout le reste.
 */

export interface Session {
  /** Le service est-il ouvert ? Faux quand aucun magasin n'est configuré, la page le
   *  dit alors au lieu de proposer un formulaire qui échouerait à la validation. */
  open: boolean;
  account: PublicAccount | null;
  submissions: EventSubmission[];
}

export type ApiError = { error: string; fields?: FieldErrors; status?: string };

const EMPTY: Session = { open: true, account: null, submissions: [] };

let cache: Session | null = null;
let inflight: Promise<Session> | null = null;
const listeners = new Set<(s: Session) => void>();

/** Événement émis à chaque changement de session, sur le modèle de `"favs"` : la nav
 *  écoute celui-là pour relire son témoin, plutôt que d'interroger l'API. Sans lui,
 *  elle continuait d'afficher « Connexion » à quelqu'un qui venait de s'inscrire. */
export const SESSION_EVENT = "rr-session";

function publish(next: Session) {
  cache = next;
  for (const fn of listeners) fn(next);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

async function load(force = false): Promise<Session> {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = fetch("/api/promoteur/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? (r.json() as Promise<Session>) : EMPTY))
    .catch(() => EMPTY)
    .then((s) => {
      publish(s);
      inflight = null;
      return s;
    });
  return inflight;
}

/** Poste du JSON et rend soit la charge utile, soit l'erreur nommée par la route. */
export async function post<T>(url: string, body: unknown, method = "POST"): Promise<T | ApiError> {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { error: String(data.error ?? "error"), fields: data.fields as FieldErrors, status: data.status as string };
    return data as T;
  } catch {
    return { error: "network" };
  }
}

export const isError = (v: unknown): v is ApiError =>
  Boolean(v) && typeof v === "object" && typeof (v as ApiError).error === "string";

export function usePromoter() {
  const [session, setSession] = useState<Session | null>(cache);

  useEffect(() => {
    listeners.add(setSession);
    void load();
    return () => {
      listeners.delete(setSession);
    };
  }, []);

  /** Remplace la session connue sans repasser par le réseau : la route de connexion
   *  renvoie déjà le compte, et un aller-retour de plus ferait clignoter la page. */
  const adopt = useCallback((account: PublicAccount | null, submissions?: EventSubmission[]) => {
    publish({ open: cache?.open ?? true, account, submissions: submissions ?? (account ? cache?.submissions ?? [] : []) });
    if (account) void load(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/promoteur/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    publish({ open: cache?.open ?? true, account: null, submissions: [] });
  }, []);

  return {
    /** `null` tant que la première réponse n'est pas arrivée : « on ne sait pas encore »
     *  et « personne n'est connecté » ne s'affichent pas pareil. */
    session,
    loading: session === null,
    adopt,
    logout,
    refresh: () => load(true),
  };
}
