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
  title: "RaveRadar - Find your next rave",
  description:
    "Discover Europe's best electronic music events. Techno, hardstyle, DnB, psytrance, trance & warehouse raves.",
  /* Google n'affichait aucune favicon dans les résultats, et la cause était ici :
     l'icône était déclarée en `data:image/svg+xml,...`. Un navigateur la rend très
     bien, Googlebot non — sa documentation demande un **fichier explorable**, à une
     URL stable et non bloquée par robots.txt, carrée et d'un multiple de 48 px. Un
     URI `data:` n'est pas une URL : il n'y a rien à demander, donc rien à indexer,
     donc le globe générique. Les fichiers sont engendrés par `python3 scripts/favicon.py`. */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
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
