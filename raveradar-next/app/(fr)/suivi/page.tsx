import type { Metadata } from "next";
import Link from "next/link";
import TrackingDashboard from "@/components/TrackingDashboard";

/**
 * `/suivi`, the owner's audience dashboard.
 *
 * Not part of the site: no Nav, no Footer, no sitemap entry, no link pointing here from
 * anywhere. It is a tool that happens to be served by the same app, and the only way in
 * is to know the URL *and* the password.
 *
 * Three separate refusals stack up, on purpose. `robots` here and a Disallow in
 * `app/robots.ts` keep it out of the index, politeness, not security, since a crawler
 * can ignore both. The password on `/api/track/stats` is the actual lock: with no valid
 * cookie the route answers 401 and this page renders a login form over an empty shell,
 * so a crawler that walks in anyway finds nothing to read.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi d'audience - RaveRadar",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function SuiviPage() {
  return (
    <main className="trk-page">
      <div className="wrap">
        <TrackingDashboard />
        <p className="trk-back">
          <Link href="/">← Retour au site</Link>
        </p>
      </div>
    </main>
  );
}
