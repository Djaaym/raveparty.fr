import NearMeView from "@/components/NearMeView";

export const metadata = {
  title: "Rave party autour de moi — événements électro près de chez toi | RaveRadar",
  description: "Trouve les rave parties, free parties et festivals électro les plus proches de ta position. Géolocalisation, tri par distance.",
};

export default function Page() {
  return <NearMeView lang="fr" />;
}
