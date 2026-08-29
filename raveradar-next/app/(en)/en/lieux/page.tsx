import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import VenuesHub from "@/components/VenuesHub";

export const metadata: Metadata = {
  alternates: alternates("/lieux", "en"),
  title: "All venues - clubs, warehouses & festivals | RaveRadar",
  description:
    "The agenda of every club, warehouse and festival site: Berghain, Rex Club, Le Sucre, Tresor, fabric and more.",
};

export default function Page() {
  return <VenuesHub lang="en" />;
}
