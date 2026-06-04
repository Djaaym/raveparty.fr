"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Lang, RaveEvent } from "@/lib/types";
import { cardBg, countryLabel, eventPath } from "@/lib/data";
import { fmtDate, priceLabel } from "@/lib/format";
import { langPrefix } from "@/lib/i18n";
import { useFav } from "./useFavorites";

export default function EventCard({ e, lang }: { e: RaveEvent; lang: Lang }) {
  const { on, toggle } = useFav(e.id);
  const router = useRouter();
  const href = `${langPrefix(lang)}${eventPath(e)}`;

  return (
    <motion.article
      className="card"
      style={{ cursor: "pointer" }}
      onClick={() => router.push(href)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="card-genre-bar" />
      <div className="card-media">
        <div className="poster" style={{ backgroundImage: cardBg(e) }} />
        <div className="card-top">
          <span className="tag type">{e.type}</span>
          <button
            className={`fav ${on ? "on" : ""}`}
            onClick={(ev) => {
              ev.stopPropagation();
              toggle();
            }}
            aria-label="Save"
          >
            ♥
          </button>
        </div>
        <div className="card-body">
          <div className="card-date">
            {fmtDate(e.date, lang)} · {e.time}
          </div>
          <h3 className="card-title">{e.title}</h3>
          <div className="card-loc">
            📍 {e.city}, {countryLabel(e.country, lang)}
          </div>
          <div className="card-foot">
            <div className="card-meta">
              {e.genres.slice(0, 2).map((g) => (
                <span className="gpill" key={g}>
                  {g}
                </span>
              ))}
            </div>
            <div className="card-price">{priceLabel(e, lang)}</div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
