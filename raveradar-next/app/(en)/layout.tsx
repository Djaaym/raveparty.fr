import type { Metadata } from "next";
import { Syne, Inter, Space_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import Analytics from "@/components/Analytics";
import ImpactAffiliate from "@/components/ImpactAffiliate";
import "../globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

/** Same daily refresh as the French tree — see app/(fr)/layout.tsx. */
export const revalidate = 86400;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RaveRadar — Find your next rave",
  description:
    "Discover Europe's best electronic music events. Techno, hardstyle, DnB, psytrance, free parties & warehouse raves.",
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
      <body>
        <ImpactAffiliate />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
