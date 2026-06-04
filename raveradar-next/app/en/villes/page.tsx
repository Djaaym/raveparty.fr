import CitiesHub from "@/components/CitiesHub";

export const metadata = {
  title: "Rave parties & festivals by city — Lyon, Rennes, Bordeaux… | RaveRadar",
  description:
    "Find rave parties, free parties and festivals near you: Lyon, Rennes, Bordeaux, Drôme, Lozère, Aude, Hérault and more.",
};

export default function Page() {
  return <CitiesHub lang="en" />;
}
