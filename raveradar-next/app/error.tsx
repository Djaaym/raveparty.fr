"use client";
import { useEffect } from "react";

/**
 * La frontière d'erreur du site.
 *
 * Sans elle, une exception dans un composant serveur rendait l'écran d'erreur brut de
 * Next : fond blanc, message anglais, aucune issue. Sur 13 000 pages engendrées à
 * partir d'une donnée hétérogène, c'est une lacune qui finit par se voir en production.
 *
 * `reset()` est proposé parce que la plupart des pages sont statiques et régénérées à
 * l'heure : un nouvel essai retombe souvent sur une version saine, et c'est moins
 * coûteux pour le lecteur qu'un rechargement complet.
 *
 * Le composant est volontairement **sans dépendance** : ni nav, ni pied de page, ni
 * dictionnaire. Il se rend quand quelque chose a déjà échoué, donc il ne doit rien
 * appeler qui puisse échouer à son tour, et les styles sont en ligne pour tenir même
 * si la feuille de styles est ce qui manque.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Le digest est ce qui permet de retrouver la trace côté serveur : sans lui, un
    // rapport de lecteur ne désigne rien d'identifiable dans les journaux.
    console.error("Unhandled error", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "60px 20px",
        textAlign: "center",
        color: "#F3F3F8",
        background: "#050608",
      }}
    >
      <p style={{ fontFamily: "monospace", color: "#8A8C9B", letterSpacing: ".2em", margin: 0 }}>ERREUR</p>
      <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Quelque chose a cassé de notre côté</h1>
      <p style={{ color: "#8A8C9B", maxWidth: 520, margin: 0 }}>
        La page n&apos;a pas pu s&apos;afficher. Réessaie, la plupart des pages sont régénérées automatiquement.
      </p>
      <p style={{ color: "#6E7081", maxWidth: 520, margin: 0, fontSize: ".9rem" }}>
        Something broke on our side. Try again, most pages regenerate automatically.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "11px 20px",
            borderRadius: 999,
            border: 0,
            cursor: "pointer",
            background: "linear-gradient(90deg,#7B5CFF,#00E0C6)",
            color: "#050608",
            fontWeight: 700,
          }}
        >
          Réessayer
        </button>
        <a
          href="/"
          style={{
            padding: "11px 20px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.16)",
            color: "#F3F3F8",
            textDecoration: "none",
          }}
        >
          Accueil
        </a>
      </div>
      {error.digest && (
        <p style={{ color: "#44464F", fontFamily: "monospace", fontSize: ".75rem", marginTop: 18 }}>
          {error.digest}
        </p>
      )}
    </main>
  );
}
