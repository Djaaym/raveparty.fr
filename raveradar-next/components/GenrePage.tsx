import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/types";
import { genreFromSlug, eventsForGenre, genreDescL } from "@/lib/data";
import { getDict, langPrefix } from "@/lib/i18n";
import Nav from "./Nav";
import Footer from "./Footer";
import EventCard from "./EventCard";

export default function GenrePage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const genre = genreFromSlug(slug);
  if (!genre) return notFound();
  const events = eventsForGenre(genre);

  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <Link href={`${p}/genres`} style={{ color: "var(--grey)", fontSize: ".9rem" }}>
            ← {t("nav.genres")}
          </Link>
          <h1 className="h-lg gradient-text" style={{ margin: "14px 0 8px" }}>
            {genre}
          </h1>
          <p className="lead">{genreDescL(genre, lang)}</p>
          <div className="grid grid-4" style={{ marginTop: 36 }}>
            {events.map((e) => (
              <EventCard key={e.id} e={e} lang={lang} />
            ))}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
