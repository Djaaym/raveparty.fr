"use client";
import { useCallback, useEffect, useState } from "react";
import type { AccountStatus, EventSubmission, PublicAccount } from "@/lib/accounts";
import { fmtDate } from "@/lib/format";
import { plainRich } from "@/lib/richtext";

/**
 * La console du propriétaire.
 *
 * Les liens reçus par mail suffisent à trancher une demande au moment où elle arrive.
 * Ce qu'ils ne permettent pas, c'est de **revenir** : suspendre un compte qui dérape,
 * supprimer un compte de test, retirer un dépôt qui n'aurait pas dû passer. Un annuaire
 * qui accepte des contributions extérieures a besoin de cette porte de sortie, sinon la
 * seule façon de défaire est d'ouvrir Redis à la main.
 *
 * Elle est délibérément austère : c'est un outil, pas une page du site. Pas de `Nav`,
 * pas de `Footer`, aucun lien vers elle nulle part, `noindex`, et le mot de passe sur
 * ses propres routes, pas seulement sur l'affichage.
 *
 * Les suppressions demandent une confirmation en deux temps, avec le compte des dépôts
 * qui partiraient avec : « supprimer ce compte » et « supprimer ce compte et ses quatre
 * dépôts » ne sont pas la même décision, et une console d'administration est exactement
 * l'endroit où un clic de trop coûte cher.
 */

type Tab = "accounts" | "submissions";

interface Data {
  store: { configured: boolean; ok: boolean; detail: string };
  mail: { provider: string | null; from: string; to: string; ready: boolean; missing: string[]; note: string };
  accounts: (PublicAccount & { submissions: number })[];
  submissions: EventSubmission[];
}

const STATUS_FR: Record<string, string> = {
  pending: "en attente", approved: "validé", rejected: "refusé", suspended: "suspendu", published: "validé",
};

export default function AdminConsole() {
  const [state, setState] = useState<"loading" | "locked" | "closed" | "open">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("accounts");
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState("");
  const [open, setOpen] = useState<string>("");
  const [mailTest, setMailTest] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (res.status === 401) return setState("locked");
    if (res.status === 501) return setState("closed");
    if (!res.ok) return setError("Le magasin n'a pas répondu.");
    setData((await res.json()) as Data);
    setState("open");
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/auth", { cache: "no-store" });
      const j = (await res.json()) as { configured: boolean; authed: boolean };
      if (!j.configured) return setState("closed");
      if (!j.authed) return setState("locked");
      await load();
    })();
  }, [load]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError(res.status === 429 ? "Trop de tentatives, attends une minute." : "Mot de passe incorrect.");
      return;
    }
    setPassword("");
    await load();
  };

  const signOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setData(null);
    setState("locked");
  };

  const act = async (payload: Record<string, unknown>, key: string) => {
    setBusy(key);
    setError("");
    const res = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy("");
    setConfirming("");
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(`Action refusée (${j.error ?? res.status}).`);
      return;
    }
    await load();
  };

  if (state === "loading") return <p className="adm-note">Chargement…</p>;

  if (state === "closed") {
    return (
      <div className="adm-lock">
        <h1 className="h-md">Console fermée</h1>
        <p>
          Pose <code>ADMIN_PASSWORD</code> (ou <code>TRACKING_PASSWORD</code>) dans les variables
          d&apos;environnement, puis redéploie. Sans mot de passe, cette page ne s&apos;ouvre pas :
          elle supprime des comptes.
        </p>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <form className="adm-lock" onSubmit={signIn}>
        <h1 className="h-md">Administration</h1>
        <p>Comptes promoteurs et dépôts d&apos;événement.</p>
        <input
          className="input" type="password" autoFocus autoComplete="current-password"
          placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary btn-block" type="submit">Entrer</button>
        {error && <p className="adm-err">{error}</p>}
      </form>
    );
  }

  const accounts = data?.accounts ?? [];
  const submissions = data?.submissions ?? [];
  const pendingAccounts = accounts.filter((a) => a.status === "pending").length;
  const pendingSubs = submissions.filter((s) => s.status === "pending").length;

  return (
    <>
      <header className="adm-head">
        <div>
          <h1 className="h-md">Administration</h1>
          <p className="adm-note">
            {accounts.length} compte(s), {submissions.length} dépôt(s).
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sortir</button>
      </header>

      {/* Les deux conditions pour que tout ceci tourne, lues au même endroit : où les
          données sont écrites, et par quel chemin l'annonce part. Une case rouge nomme
          la variable à poser, plutôt que de laisser deviner ce qui manque. */}
      <div className="adm-health">
        <div className={`adm-card ${data?.store.configured && data.store.ok ? "ok" : "bad"}`}>
          <b>Magasin</b>
          <span>
            {data?.store.configured
              ? data.store.ok
                ? "Connecté. Comptes et dépôts sont conservés."
                : `Injoignable : ${data.store.detail}`
              : "Non configuré : ce que tu vois ne survivra pas au prochain déploiement. Pose ACCOUNTS_KV_REST_API_URL et ACCOUNTS_KV_REST_API_TOKEN (ou KV_REST_API_*)."}
          </span>
        </div>

        {/* Vert tant qu'un envoi partirait, rouge dès qu'un test a échoué : afficher
            « prêt » sous le message d'erreur du fournisseur serait le pire des deux. */}
        <div className={`adm-card ${data?.mail.ready && !mailTest.startsWith("Échec") ? "ok" : "bad"}`}>
          <b>Alertes mail</b>
          <span>
            {data?.mail.provider ? `Fournisseur : ${data.mail.provider}. ` : ""}
            {data?.mail.from ? `De ${data.mail.from} vers ${data.mail.to}. ` : ""}
            {data?.mail.note}
            {data?.mail.missing.length ? ` À poser : ${data.mail.missing.join(", ")}.` : ""}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy === "mail"}
            onClick={async () => {
              setBusy("mail");
              setMailTest("");
              const res = await fetch("/api/admin/data", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ kind: "mail", action: "test" }),
              });
              const j = (await res.json().catch(() => ({}))) as { ok?: boolean; detail?: string; to?: string };
              setBusy("");
              setMailTest(j.ok ? `Envoyé à ${j.to}. Regarde ta boîte (et les indésirables).` : `Échec : ${j.detail ?? "inconnu"}`);
            }}
          >
            {busy === "mail" ? "Envoi…" : "Envoyer un test"}
          </button>
          {mailTest && <em className="adm-test">{mailTest}</em>}
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "accounts"}
          className={`tab ${tab === "accounts" ? "on" : ""}`} onClick={() => setTab("accounts")}>
          Comptes{pendingAccounts ? ` (${pendingAccounts} en attente)` : ""}
        </button>
        <button type="button" role="tab" aria-selected={tab === "submissions"}
          className={`tab ${tab === "submissions" ? "on" : ""}`} onClick={() => setTab("submissions")}>
          Dépôts{pendingSubs ? ` (${pendingSubs} à relire)` : ""}
        </button>
      </div>

      {error && <p className="adm-err">{error}</p>}

      {tab === "accounts" && (
        <ul className="adm-list">
          {accounts.length === 0 && <li className="adm-note">Aucun compte pour l&apos;instant.</li>}
          {accounts.map((a) => (
            <li className="adm-row" key={a.email}>
              <div className="adm-main">
                <b>{a.name}</b>
                <span className={`adm-state s-${a.status}`}>{STATUS_FR[a.status]}</span>
                {a.notified === false && <span className="adm-state s-quiet">non notifié</span>}
                <span className="adm-meta">
                  {a.kind} · {a.contact} · {a.email}
                  {a.phone ? ` · ${a.phone}` : ""} · {a.city}, {a.country} · {a.submissions} dépôt(s)
                </span>
                <button className="adm-toggle" onClick={() => setOpen(open === a.email ? "" : a.email)}>
                  {open === a.email ? "Masquer le dossier" : "Voir le dossier"}
                </button>
                {open === a.email && (
                  <div className="adm-detail">
                    <p>{a.about}</p>
                    <p className="adm-meta">
                      Inscrit le {fmtDate(a.createdAt.slice(0, 10), "fr")}
                      {a.website ? ` · ${a.website}` : ""}
                      {a.instagram ? ` · @${a.instagram}` : ""}
                      {a.legalId ? ` · ${a.legalId}` : ""}
                    </p>
                  </div>
                )}
              </div>

              <div className="adm-actions">
                {(["approved", "pending", "suspended", "rejected"] as AccountStatus[])
                  .filter((s) => s !== a.status)
                  .map((s) => (
                    <button key={s} className="btn btn-ghost btn-sm" disabled={busy === a.email}
                      onClick={() => act({ kind: "account", email: a.email, action: s }, a.email)}>
                      {STATUS_FR[s]}
                    </button>
                  ))}
                {confirming === `acc:${a.email}` ? (
                  <button className="btn btn-danger btn-sm" disabled={busy === a.email}
                    onClick={() => act({ kind: "account", email: a.email, action: "delete" }, a.email)}>
                    {a.submissions
                      ? `Confirmer : effacer le compte et ses ${a.submissions} dépôt(s)`
                      : "Confirmer la suppression"}
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm adm-del" onClick={() => setConfirming(`acc:${a.email}`)}>
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "submissions" && (
        <ul className="adm-list">
          {submissions.length === 0 && <li className="adm-note">Aucun dépôt pour l&apos;instant.</li>}
          {submissions.map((s) => (
            <li className="adm-row" key={s.id}>
              <div className="adm-main">
                <b>{s.title}</b>
                <span className={`adm-state s-${s.status}`}>{STATUS_FR[s.status]}</span>
                {s.notified === false && <span className="adm-state s-quiet">non notifié</span>}
                <span className="adm-meta">
                  {fmtDate(s.date, "fr")}
                  {s.endDate ? ` → ${fmtDate(s.endDate, "fr")}` : ""} · {s.venue}, {s.city}, {s.country} ·{" "}
                  {s.genre}
                  {s.subgenres.length ? ` (${s.subgenres.join(", ")})` : ""} · déposé par {s.owner}
                </span>
                <button className="adm-toggle" onClick={() => setOpen(open === s.id ? "" : s.id)}>
                  {open === s.id ? "Masquer la fiche" : "Voir la fiche"}
                </button>
                {open === s.id && (
                  <div className="adm-detail">
                    <p className="adm-meta">
                      {s.time || "horaire non communiqué"}
                      {s.endTime ? `-${s.endTime}` : ""} ·{" "}
                      {s.price ? `${s.price} ${s.currency}${s.priceNote === "estimated" ? " (estimé)" : ""}` : "tarif non communiqué"}
                      {s.ticketUrl ? ` · ${s.ticketUrl}` : ""}
                      {s.posterUrl || s.posterFile ? ` · affiche : ${s.posterUrl || s.posterFile}` : ""}
                    </p>
                    <p className="adm-meta">Line-up : {s.lineup.join(", ") || "à venir"}</p>
                    <p>{plainRich(s.desc)}</p>
                  </div>
                )}
              </div>

              <div className="adm-actions">
                {(["published", "pending", "rejected"] as const)
                  .filter((x) => x !== s.status)
                  .map((x) => (
                    <button key={x} className="btn btn-ghost btn-sm" disabled={busy === s.id}
                      onClick={() => act({ kind: "submission", id: s.id, action: x }, s.id)}>
                      {x === "published" ? "valider" : x === "pending" ? "remettre en relecture" : "écarter"}
                    </button>
                  ))}
                {confirming === `sub:${s.id}` ? (
                  <button className="btn btn-danger btn-sm" disabled={busy === s.id}
                    onClick={() => act({ kind: "submission", id: s.id, action: "delete" }, s.id)}>
                    Confirmer la suppression
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm adm-del" onClick={() => setConfirming(`sub:${s.id}`)}>
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
