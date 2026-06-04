import WeekendView from "@/components/WeekendView";

export const metadata = {
  title: "Raves this weekend — upcoming parties & festivals | RaveRadar",
  description: "Upcoming rave parties, free parties and electronic festivals across Europe in the next few days. Dates, line-ups, tickets.",
};

export default function Page() {
  return <WeekendView lang="en" />;
}
