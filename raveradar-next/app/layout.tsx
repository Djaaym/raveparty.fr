import type { Metadata } from "next";
import { Syne, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  title: "RaveRadar — Trouve ta prochaine rave",
  description:
    "Découvre les meilleurs événements de musique électronique d'Europe. Techno, hardstyle, DnB, psytrance, free parties & raves en entrepôt.",
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FF2D9B'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
