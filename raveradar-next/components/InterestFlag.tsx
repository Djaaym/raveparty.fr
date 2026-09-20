"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { useInterestCount } from "./InterestCounts";
import { pushInterest, readEmail, rememberEmail, useFav } from "./useFavorites";

/**
 * Le fanion « ça m'intéresse ».
 *
 * Il remplace le cœur, et ce n'est pas qu'un changement d'icône. Le cœur ne parlait qu'au
 * navigateur : il rangeait la date dans une liste locale et personne, nous compris, n'en
 * savait rien. Le fanion fait trois choses d'un même clic, dans cet ordre :
 *
 * 1. il se souvient, localement, comme avant, donc sans compte et sans adresse ;
 * 2. il se **compte**, ce qui répond enfin à « à quel point cet événement est recherché »,
 *    la question qu'aucune page du site ne savait poser ;
 * 3. il propose un **rappel une semaine avant**, avec la fiche et une recherche d'hôtels
 *    déjà datée autour de la salle.
 *
 * **Le rappel est proposé, jamais exigé.** Le panneau d'adresse ne s'ouvre qu'en posant
 * un fanion, une seule fois par navigateur tant qu'aucune adresse n'est connue, et le
 * fanion est déjà posé quand il s'ouvre : le fermer ne le retire pas. Exiger l'adresse
 * pour un clic d'intérêt échangerait la mesure, que tout le monde donne, contre
 * l'inscription, que peu donnent, et on perdrait les deux. Quelqu'un de connecté ne voit
 * jamais ce panneau, son adresse est déjà là.
 *
 * **Le panneau est rendu dans un portail, et ce n'est pas un raffinement.** `.card` porte
 * `overflow: hidden` (son dégradé et sa photo en dépendent), donc un panneau ancré au
 * bouton y serait **coupé net**, exactement comme l'`overflow: hidden` de `.hero` coupait
 * le menu de la recherche et comme celui de `<body>` tuait `position: sticky`. Le
 * corriger sur la carte voudrait dire lui retirer son clip, c'est-à-dire casser ce que le
 * clip sert. Le panneau sort donc du flux, positionné en `fixed` d'après la position
 * mesurée du bouton, et il se ferme au défilement plutôt que de suivre : un panneau qui
 * poursuit son bouton pendant qu'on fait défiler une grille est plus gênant qu'utile.
 *
 * **Le composant ne fait aucune requête au chargement**, et c'est ce qui permet d'afficher
 * le chiffre partout. Il est monté sur chaque carte de chaque grille du site : un appel au
 * compteur par carte ferait des dizaines de requêtes sur la page d'accueil. La table est
 * donc lue **une fois par page, au rendu du layout**, et distribuée par contexte (voir
 * `components/InterestCounts.tsx`). Le chiffre n'est ensuite rafraîchi qu'après un clic,
 * avec la réponse que la route renvoie déjà.
 */

/**
 * Le fanion lui-même. Un drapeau planté, dessiné en deux traits : la hampe tient la ligne
 * de base quel que soit l'état, et seule la toile change, vide au repos, pleine une fois
 * posée. Un `♥` ou un `🚩` auraient été rendus par la police du système, donc différents
 * sur chaque plateforme et impossibles à animer.
 */
function Pennant({ on }: { on: boolean }) {
  return (
    <svg className="flag-ico" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
      <path className="flag-pole" d="M6 3.2v17.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        className="flag-cloth"
        d="M6 4.2h11.6l-3.1 4 3.1 4H6z"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InterestFlag({
  id,
  lang = "fr",
  className = "flag",
}: {
  id: number;
  lang?: Lang;
  className?: string;
}) {
  const { on, toggle } = useFav(id);
  const t = getDict(lang);
  /* Le compte lu au rendu du layout, `undefined` quand cet événement n'a pas encore de
     fanion : le bouton n'affiche alors rien plutôt qu'un « 0 ». */
  const count = useInterestCount(id);

  const [n, setN] = useState<number | undefined>(count);
  const [ask, setAsk] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  /** Position du panneau, en coordonnées de fenêtre. `null` tant qu'il est fermé. */
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => setN(count), [count]);

  /**
   * Mesure le bouton et cale le panneau dessous. Rend `false` quand le bouton a quitté la
   * fenêtre, ce que l'appelant traduit par « ferme ».
   *
   * Aligné à droite du bouton : il est lui-même en haut à droite d'une carte, donc le
   * panneau rentre vers l'intérieur de la grille au lieu de déborder. La marge de 8 px le
   * garde décollé du bord sur un écran étroit.
   */
  const place = useCallback((): boolean => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return false;
    if (r.bottom < 0 || r.top > window.innerHeight) return false;
    setAt({ top: Math.round(r.bottom + 8), right: Math.max(8, Math.round(window.innerWidth - r.right)) });
    return true;
  }, []);

  /* Fermer au clic à côté et à Échap. Un panneau qui ne se ferme qu'au bouton reste
     ouvert derrière le doigt sur une grille tactile.

     **Le défilement replace le panneau, il ne le ferme pas**, et la nuance vient d'un cas
     mobile : mettre le champ au premier plan ouvre le clavier virtuel, ce qui fait défiler
     la page, donc fermer au défilement ferait disparaître le panneau au moment exact où on
     s'apprête à taper son adresse. Le panneau est en position fixe, il faut donc bien le
     recaler, et on ne ferme que si le bouton a vraiment quitté l'écran. */
  useEffect(() => {
    if (!ask) return;
    const away = (ev: MouseEvent) => {
      const node = ev.target as Node;
      if (!pop.current?.contains(node) && !btn.current?.contains(node)) setAsk(false);
    };
    const esc = (ev: KeyboardEvent) => ev.key === "Escape" && setAsk(false);
    const follow = () => {
      if (!place()) setAsk(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [ask, place]);

  const click = () => {
    const next = toggle();
    /* Le compteur bouge tout de suite : la réponse du serveur le corrigera s'il faut,
       mais un chiffre qui ne bouge pas pendant un aller-retour donne l'impression que le
       clic n'a pas été pris. */
    setN((cur) => (cur === undefined ? cur : Math.max(0, cur + (next ? 1 : -1))));

    const known = readEmail();
    /* Un compte connecté n'a rien à saisir : le témoin `rr_pro_on` suffit à le savoir
       sans requête, et la route lira la vraie adresse dans la session. Il n'accorde rien,
       il n'est utilisé ici que pour ne pas demander deux fois. */
    const logged = typeof document !== "undefined" && document.cookie.includes("rr_pro_on=1");

    void pushInterest({ eventId: id, on: next, email: known, lang }).then((r) => {
      if (typeof r.count === "number") setN(r.count);
    });

    if (next && !known && !logged) {
      setEmail("");
      setState("idle");
      place();
      setAsk(true);
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const value = email.trim();
    if (!value) return;
    setState("sending");
    const r = await pushInterest({ eventId: id, on: true, email: value, lang });
    if (!r.ok || !r.remind) {
      setState("error");
      return;
    }
    rememberEmail(value);
    setState("done");
    setTimeout(() => setAsk(false), 1600);
  };

  const panel = (
    <div
      className="flagpop"
      role="dialog"
      aria-label={t("flag.remindtitle")}
      ref={pop}
      style={{ top: at?.top ?? 0, right: at?.right ?? 0 }}
    >
      <button type="button" className="flagpop-x" onClick={() => setAsk(false)} aria-label={t("flag.close")}>
        ×
      </button>
      {state === "done" ? (
        <p className="flagpop-ok">{t("flag.done")}</p>
      ) : (
        <>
          <p className="flagpop-title">{t("flag.remindtitle")}</p>
          <p className="flagpop-lead">{t("flag.remindlead")}</p>
          <form onSubmit={submit} className="flagpop-form">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t("flag.email")}
              aria-label={t("flag.email")}
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
            <button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "…" : t("flag.ok")}
            </button>
          </form>
          {state === "error" && <p className="flagpop-err">{t("flag.err")}</p>}
          <p className="flagpop-fine">{t("flag.fine")}</p>
        </>
      )}
    </div>
  );

  /* Le singulier a sa propre clé : « 1 intéressés » est une faute, et ce libellé part
     dans un `title`, donc dans ce qu'annonce un lecteur d'écran. */
  const label =
    n === undefined || n === 0
      ? on
        ? t("a11y.unfav")
        : t("a11y.fav")
      : n === 1
        ? t("flag.count1")
        : t("flag.count").replace("{n}", String(n));

  return (
    <div className="flagwrap">
      <button
        type="button"
        ref={btn}
        className={`${className}${on ? " on" : ""}`}
        onClick={click}
        aria-pressed={on}
        aria-label={on ? t("a11y.unfav") : t("a11y.fav")}
        title={label}
      >
        <Pennant on={on} />
        {n !== undefined && n > 0 && <span className="flag-n">{n}</span>}
      </button>

      {ask && at && createPortal(panel, document.body)}
    </div>
  );
}
