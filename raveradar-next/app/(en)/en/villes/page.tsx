import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import CitiesHub from "@/components/CitiesHub";

export const metadata: Metadata = pageMeta({
  lang: "en",
  path: "/villes",
  title: "Rave parties & festivals by city - Lyon, Rennes, Bordeaux… | RaveRadar",
  description: "Find electronic festivals and rave parties near you: Lyon, Rennes, Bordeaux, Drôme, Lozère, Aude, Hérault and more.",
});

export default function Page() {
  return <CitiesHub lang="en" />;
}
