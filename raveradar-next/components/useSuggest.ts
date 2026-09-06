"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang, SuggestKind, Suggestion } from "@/lib/types";

/**
 * Les suggestions de `/api/search`, temporisées, annulables et mises en cache.
 *
 * Le hook existe parce que la recherche vit maintenant à **deux endroits** : la barre
 * du hero (`HeroSearch`) et la loupe de la nav (`NavSearch`). Recopier la boucle de
 * requête dans le second aurait produit deux comportements qui divergent à la première
 * correction, ce qui est exactement le motif que le projet évite ailleurs (une seule
 * conversion dans `lib/catalog-export.ts`, une seule validation dans `lib/accounts.ts`).
 *
 * Trois précautions, toutes déjà payées dans la version d'origine :
 *
 * - **Temporisation à 140 ms.** Une requête par frappe ferait un appel toutes les
 *   40 ms sur une saisie normale ; 140 ms reste sous le seuil de perception.
 * - **`AbortController`.** Sans lui, une réponse lente à « berg » écrase celle de
 *   « berghain » et le menu affiche autre chose que ce qui est tapé.
 * - **Cache local.** En tapant « berghain » on passe par « berg », « bergh »,
 *   « bergha » ; effacer une lettre rejoue la précédente. Le cache est un `Map` de
 *   composant, il meurt avec la page, ce qui est la bonne durée de vie ici.
 *
 * Un échec réseau ne renvoie rien et ne lève pas : les deux appelants savent retomber
 * sur `/explore`, qui filtre le catalogue sans dépendre de l'API.
 */
export function useSuggest(q: string, lang: Lang, kind?: SuggestKind) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const cache = useRef(new Map<string, Suggestion[]>());

  useEffect(() => {
    const term = q.trim();
    // Deux caractères, c'est le seuil sous lequel une suggestion ne veut rien dire :
    // « a » remonterait la moitié du catalogue et coûterait un appel par frappe.
    if (term.length < 2) {
      setItems([]);
      setBusy(false);
      return;
    }
    const key = `${kind ?? ""}:${term.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}`;
    const hit = cache.current.get(key);
    if (hit) {
      setItems(hit);
      setBusy(false);
      return;
    }
    setBusy(true);
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const url = `/api/search?q=${encodeURIComponent(term)}&lang=${lang}${kind ? `&kind=${kind}` : ""}`;
        const r = await fetch(url, { signal: ctl.signal });
        const data = (await r.json()) as { items: Suggestion[] };
        cache.current.set(key, data.items);
        setItems(data.items);
      } catch {
        /* Réseau coupé ou requête annulée : l'appelant reste utilisable tel quel. */
      } finally {
        setBusy(false);
      }
    }, 140);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, lang, kind]);

  return { items, busy };
}
