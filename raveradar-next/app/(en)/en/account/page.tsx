import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = {
  /* Une page de connexion n'a rien à faire dans un index de recherche : elle n'apporte
     aucune réponse, et une SERP qui la propose fait perdre le lecteur. Elle sort aussi
     du sitemap, où elle figurait. `follow` pour que ses liens continuent de compter. */
  robots: { index: false, follow: true },
  alternates: alternates("/account", "en"),
  title: "My account - Favourites & alerts | RaveRadar",
};

export default function Page() {
  return <AccountView lang="en" />;
}
