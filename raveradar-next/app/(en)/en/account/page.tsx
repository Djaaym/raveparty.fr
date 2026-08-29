import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = {
  alternates: alternates("/account", "en"),
  title: "My account - Favourites & alerts | RaveRadar",
};

export default function Page() {
  return <AccountView lang="en" />;
}
