import NearMeView from "@/components/NearMeView";

export const metadata = {
  title: "Raves near me — electronic events close to you | RaveRadar",
  description: "Find the rave parties, free parties and electronic festivals closest to your location. Geolocation, sorted by distance.",
};

export default function Page() {
  return <NearMeView lang="en" />;
}
