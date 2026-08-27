import type { Metadata } from "next";
import { Syne, Inter, Space_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import Analytics from "@/components/Analytics";
import Tracker from "@/components/Tracker";
import ImpactAffiliate from "@/components/ImpactAffiliate";
import "../globals.css";

/**
 * Syne et Inter sans liste de graisses : ce sont des fontes **variables**, et énumérer
 * `["600","700","800"]` demandait à next/font d'en découper trois instances statiques.
 * Six fichiers woff2 là où deux suffisent — six `<link rel="preload">` en tête de page,
 * tous en concurrence avec l'image LCP pour la bande passante des premières secondes.
 * Un seul fichier variable couvre 400→800 et rend exactement les mêmes graisses.
 *
 * Space Mono n'existe qu'en statique chez Google : ses deux graisses restent listées.
 */
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

/** Same hourly refresh as the French tree — see app/(fr)/layout.tsx. */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RaveRadar — Find your next rave",
  description:
    "Discover Europe's best electronic music events. Techno, hardstyle, DnB, psytrance, trance & warehouse raves.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FF2D9B'/%3E%3C/svg%3E",
  },
};

/**
 * The English tree gets its own root layout purely so the served HTML carries
 * `lang="en"`. A nested layout can't set the <html> element, and reading the
 * pathname on the server would force every page out of static rendering.
 */
export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable} ${spaceMono.variable}`}>
      <head>
        {/* Filet du scroll-reveal : `.reveal` part en animation pause (voir globals.css),
            donc invisible tant que l'IntersectionObserver de <Reveal> ne l'a pas armé.
            Sans JavaScript, cette règle rend la page entière plutôt qu'une page blanche. */}
        <noscript>
          <style>{`.reveal{animation:none}`}</style>
        </noscript>
      </head>
      <body>
        <ImpactAffiliate />
        {children}
        <Analytics />
        {/* Same collector as the French tree — /suivi reports on both, split by `lang`. */}
        <Tracker />
      </body>
    </html>
  );
}
