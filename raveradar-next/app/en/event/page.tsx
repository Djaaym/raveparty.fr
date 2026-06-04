import type { Metadata } from "next";
import EventDetail from "@/components/EventDetail";
import { EVENTS, eventDescL } from "@/lib/data";

type SP = { [k: string]: string | string[] | undefined };
const pickId = (sp: SP) => {
  const v = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  return Number(v) || 1;
};

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const e = EVENTS.find((x) => x.id === pickId(searchParams)) ?? EVENTS[0];
  return { title: `${e.title} — ${e.city} | RaveRadar`, description: eventDescL(e, "en").slice(0, 160) };
}

export default function Page({ searchParams }: { searchParams: SP }) {
  const e = EVENTS.find((x) => x.id === pickId(searchParams)) ?? EVENTS[0];
  return <EventDetail e={e} lang="en" />;
}
