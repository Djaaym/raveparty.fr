"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";

export default function Nav({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // strip /en prefix to compute the equivalent path in the other language
  const frPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const enPath = "/en" + (frPath === "/" ? "" : frPath);

  const links = [
    { href: `${p}/explore`, label: t("nav.explore"), key: "/explore" },
    { href: `${p}/genres`, label: t("nav.genres"), key: "/genres" },
    { href: `${p}/villes`, label: t("nav.cities"), key: "/villes" },
    { href: `${p}/pays`, label: t("nav.countries"), key: "/pays" },
    { href: `${p}/artistes`, label: t("nav.artists"), key: "/artistes" },
    { href: `${p}/map`, label: t("nav.map"), key: "/map" },
  ];
  const isActive = (key: string) => frPath.startsWith(key);

  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link className="brand" href={`${p}/`}>
          <span className="dot" />
          RAVE<b>RADAR</b>
        </Link>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map((l) => (
            <Link key={l.key} href={l.href} className={isActive(l.key) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
          <Link href={`${p}/account`} className="nav-only-mobile">
            {t("nav.signin")}
          </Link>
          <Link href={`${p}/organizer`} className="nav-only-mobile btn btn-primary btn-sm">
            {t("nav.add")}
          </Link>
        </div>
        <div className="nav-right">
          <div className="lang-switch">
            <Link href={frPath || "/"} className={lang === "fr" ? "on" : ""}>
              FR
            </Link>
            <Link href={enPath} className={lang === "en" ? "on" : ""}>
              EN
            </Link>
          </div>
          <Link href={`${p}/account`} className="btn btn-ghost btn-sm">
            {t("nav.signin")}
          </Link>
          <Link href={`${p}/organizer`} className="btn btn-primary btn-sm">
            {t("nav.add")}
          </Link>
        </div>
        <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          ☰
        </button>
      </div>
    </nav>
  );
}
