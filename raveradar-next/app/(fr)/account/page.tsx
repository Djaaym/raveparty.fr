import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = {
  alternates: alternates("/account", "fr"),
  title: "Mon compte — Favoris & alertes | RaveRadar",
};

export default function Page() {
  return <AccountView lang="fr" />;
}
