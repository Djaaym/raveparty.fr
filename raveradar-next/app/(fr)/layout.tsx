import type { Metadata } from "next";
import { Syne, Inter, Space_Mono } from "next/font/google";
import { SITE_URL, ADSENSE_CLIENT } from "@/lib/site";
import Analytics from "@/components/Analytics";
import AdSense from "@/components/AdSense";
import Tracker from "@/components/Tracker";
import ImpactAffiliate from "@/components/ImpactAffiliate";
import ConsentBanner from "@/components/ConsentBanner";
import { InterestCountsProvider } from "@/components/InterestCounts";
import { countsForPages } from "@/lib/interest-store";
import "../globals.css";

/**
 * Syne et Inter sans liste de graisses : ce sont des fontes **variables**, et énumérer
 * `["600","700","800"]` demandait à next/font d'en découper trois instances statiques.
 * Six fichiers woff2 là où deux suffisent, six `<link rel="preload">` en tête de page,
 * tous en concurrence avec l'image LCP pour la bande passante des premières secondes.
 * Un seul fichier variable couvre 400→800 et rend exactement les mêmes graisses.
 *
 * Space Mono n'existe qu'en statique chez Google : ses deux graisses restent listées.
 */
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

/**
 * Pages are prerendered, and most of them branch on "is this event still ahead?", a
 * question whose answer changes at midnight Paris with no deploy and no data edit.
 * The window is what a finished event can still be highlighted for: at 86400 a party
 * that ended last night stayed on the home page most of the following day. Hourly
 * bounds that to the hour, and costs nothing extra on quiet pages, a stale page is
 * only regenerated when someone actually asks for it.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RaveRadar - Trouve ta prochaine rave",
  description:
    "Découvre les meilleurs événements de musique électronique d'Europe. Techno, hardstyle, DnB, psytrance, trance & raves en entrepôt.",
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
  /* La balise meta de validation AdSense, en plus du script du `<head>`. Elle ne
     diffuse rien et ne coûte aucune requête, elle prouve seulement la propriété du
     site : c'est le filet si le script est bloqué ou n'est pas vu. Voir
     `components/AdSense.tsx` pour le choix entre les deux méthodes. */
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

/**
 * Asynchrone pour une seule raison : lire les compteurs de fanions une fois par page.
 *
 * C'est le bon endroit et le seul. Le chiffre doit s'afficher sur chaque carte de chaque
 * grille du site, y compris celles que `/explore` et `/map` rendent côté client, et
 * `countsAll()` est mis en cache par tag, donc un build entier ne fait qu'un aller-retour
 * Redis. Le mettre plus bas voudrait dire le faire traverser `cardEvent()` et une
 * vingtaine de pages ; le laisser au navigateur ferait une requête par carte.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const interest = await countsForPages();
  return (
    <html lang="fr" className={`${syne.variable} ${inter.variable} ${spaceMono.variable}`}>
      <head>
        {/* Filet du scroll-reveal : `.reveal` part en animation pause (voir globals.css),
            donc invisible tant que l'IntersectionObserver de <Reveal> ne l'a pas armé.
            Sans JavaScript, cette règle rend la page entière plutôt qu'une page blanche. */}
        <noscript>
          <style>{`.reveal{animation:none}`}</style>
        </noscript>
      </head>
      <body>
        {/* Le tag AdSense. Il est rendu ici et non dans le `<head>` : React ne rend pas
            un `<script>` écrit dans le `<head>` d'un composant serveur, alors qu'il hisse
            celui-ci dans le `<head>` du HTML servi. Voir components/AdSense.tsx. */}
        <AdSense />
        <ImpactAffiliate />
        <InterestCountsProvider value={interest}>{children}</InterestCountsProvider>
        <Analytics />
        {/* First-party collector feeding /suivi. Independent of GA4 above: GA counts,
            this one records what happened, see components/Tracker.tsx. */}
        <Tracker />
        {/* Rien ne se charge tant qu'elle attend une réponse : voir components/ConsentBanner.tsx. */}
        <ConsentBanner lang="fr" />
      </body>
    </html>
  );
}
