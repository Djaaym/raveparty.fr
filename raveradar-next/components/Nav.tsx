"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";
import { SESSION_EVENT } from "./usePromoter";
import NavSearch from "./NavSearch";

export default function Nav({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  /* Le menu mobile restait ouvert après un clic : la navigation côté client ne démonte
     pas la nav, donc rien ne le refermait, et la page d'arrivée s'affichait derrière un
     panneau ouvert. */
  useEffect(() => setOpen(false), [pathname]);
  const signedIn = useSignedIn();

  // strip /en prefix to compute the equivalent path in the other language
  const frPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const enPath = "/en" + (frPath === "/" ? "" : frPath);

  /* "Pays" sat right next to "Villes" and read as the same promise twice, and a
     stranger's first question is a date, not a geography. It gives up its slot to
     "Ce week-end"; /pays keeps its links from /villes and from every footer, so no
     page loses its way in. */
  const links = [
    { href: `${p}/explore`, label: t("nav.explore"), key: "/explore" },
    { href: `${p}/rave-party/ce-week-end`, label: t("soon.crumb"), key: "/rave-party/ce-week-end" },
    { href: `${p}/genres`, label: t("nav.genres"), key: "/genres" },
    { href: `${p}/villes`, label: t("nav.cities"), key: "/villes" },
    { href: `${p}/artistes`, label: t("nav.artists"), key: "/artistes" },
    { href: `${p}/map`, label: t("nav.map"), key: "/map" },
  ];
  const isActive = (key: string) => frPath.startsWith(key);

  return (
    <>
      {/* Premier élément focusable du document, invisible tant qu'il n'a pas le focus.
          Sans lui, un lecteur au clavier retraverse les six onglets, le sélecteur de
          langue, la loupe et les deux boutons à chaque page. La cible est `#contenu`,
          posée par les composants de page sur leur `<main>`. */}
      <a className="skip-link" href="#contenu">
        {t("a11y.skip")}
      </a>
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link className="brand" href={`${p}/`}>
          <span className="dot" />
          RAVE<b>RADAR</b>
        </Link>
        <div className={`nav-links ${open ? "open" : ""}`} id="nav-menu">
          {links.map((l) => (
            <Link key={l.key} href={l.href} className={isActive(l.key) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
          <Link href={`${p}/account`} className="nav-only-mobile">
            {signedIn ? t("nav.myaccount") : t("nav.signin")}
          </Link>
          <Link href={`${p}/organizer`} className="nav-only-mobile btn btn-primary btn-sm">
            {t("nav.add")}
          </Link>
        </div>
        <div className="nav-right">
          {/* La recherche vivait uniquement sur la page d'accueil, alors que le trafic
              d'un site de référencement arrive sur les fiches profondes : la quasi-
              totalité des lecteurs ne la voyait jamais. Le panneau n'est monté qu'au
              clic, donc ce bouton ne coûte rien aux pages qui portent le LCP. */}
          <NavSearch lang={lang} />
          <div className="lang-switch">
            <Link href={frPath || "/"} className={lang === "fr" ? "on" : ""}>
              FR
            </Link>
            <Link href={enPath} className={lang === "en" ? "on" : ""}>
              EN
            </Link>
          </div>
          <Link href={`${p}/account`} className="btn btn-ghost btn-sm">
            {signedIn ? t("nav.myaccount") : t("nav.signin")}
          </Link>
          <Link href={`${p}/organizer`} className="btn btn-primary btn-sm">
            {t("nav.add")}
          </Link>
        </div>
        {/* `aria-expanded` et `aria-controls` manquaient : un lecteur d'écran ne pouvait
            pas savoir si le menu était ouvert, alors que les deux attributs sont posés
            correctement partout ailleurs (HeroSearch, TagPicker, EventEditor). Le
            libellé change aussi avec l'état, et il est traduit, il était écrit « Menu »
            en dur. */}
        <button
          className="nav-toggle"
          type="button"
          aria-label={open ? t("nav.menuclose") : t("nav.menuopen")}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </nav>
      {/* La cible du lien d'évitement. Elle vit ici et non dans chacune des dix-neuf
          pages : posée juste après la barre, elle veut dire « après la navigation »,
          ce qui est exactement ce que le lien promet, et une seule ligne la tient à
          jour pour tout le site.

          `tabIndex={-1}` est indispensable : un `<div>` n'est pas focusable, et sans
          lui le navigateur déplace le défilement sans déplacer le focus, donc la
          tabulation suivante repart du haut de la nav, c'est-à-dire de là qu'on
          voulait partir. */}
      <div id="contenu" tabIndex={-1} />
    </>
  );
}

/**
 * Y a-t-il une session ouverte ?
 *
 * La nav affichait « Connexion » à quelqu'un qui venait de se connecter, ce qui est
 * exactement le genre de détail qui fait douter du reste. Elle ne peut pas lire le
 * cookie de session (il est `HttpOnly`, et il doit le rester), et l'appel à
 * `/api/promoteur/me` se paierait sur **toutes** les pages du site, dont celle dont le
 * LCP compte le plus, pour un résultat négatif dans l'immense majorité des cas.
 *
 * Elle lit donc le témoin non sensible posé à côté (`lib/promoter-session.ts`), qui ne
 * porte qu'un drapeau et n'ouvre rien. Il est lu après l'hydratation, jamais au rendu :
 * le HTML servi est le même pour tout le monde, donc la page reste en cache statique.
 */
function useSignedIn(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(document.cookie.split("; ").some((c) => c.startsWith("rr_pro_on=1")));
    read();
    // Une connexion, une inscription ou une déconnexion se produit sur la même page que
    // la nav : sans cet écouteur, elle garderait « Connexion » jusqu'au rechargement.
    window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  return on;
}
