import type { Metadata } from "next";
import { Syne, Inter, Space_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import Analytics from "@/components/Analytics";
import Tracker from "@/components/Tracker";
import ImpactAffiliate from "@/components/ImpactAffiliate";
import "../globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

/**
 * Pages are prerendered, and most of them branch on "is this event still ahead?".
 * Rebuild each page at most once a day so the calendar can't go stale between deploys.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RaveRadar — Trouve ta prochaine rave",
  description:
    "Découvre les meilleurs événements de musique électronique d'Europe. Techno, hardstyle, DnB, psytrance, free parties & raves en entrepôt.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FF2D9B'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body>
        <ImpactAffiliate />
        {children}
        <Analytics />
        {/* First-party collector feeding /suivi. Independent of GA4 above: GA counts,
            this one records what happened — see components/Tracker.tsx. */}
        <Tracker />
      </body>
    </html>
  );
}
