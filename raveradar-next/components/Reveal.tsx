"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Le bloc qui monte en entrant dans le champ de vision.
 *
 * C'était `motion.div` + `whileInView`, et framer-motion ne servait plus qu'à ça et
 * aux trois entrées du hero, soit ~35 Ko de JavaScript compressé chargés sur la page
 * d'accueil pour une translation de vingt pixels. `EventCard` avait déjà fait le
 * chemin inverse pour la même raison. L'animation vit maintenant dans `globals.css`
 * (`.reveal`, en pause) et il ne reste ici qu'un IntersectionObserver.
 *
 * Un seul observateur pour tous les blocs : `IntersectionObserver` est partagé au
 * niveau du module, sinon une page qui rend douze `Reveal` en instancie douze.
 *
 * `once: true` de l'ancienne version se traduit par le `unobserve()` au premier
 * franchissement, un bloc déjà montré ne redescend pas quand on remonte la page.
 */

let io: IntersectionObserver | null = null;

function observer(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  io ||= new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add("is-in");
        io!.unobserve(en.target);
      }
    },
    /* Déclenche quand le haut du bloc franchit 88 % de la hauteur du viewport.
     *
     * Plutôt que la transposition littérale de l'ancien `amount: 0.15` : un ratio
     * d'intersection se mesure sur l'aire de l'élément, donc une section plus haute
     * que six écrans ne peut jamais en montrer 15 % d'un coup, l'observateur ne se
     * déclencherait pas et le bloc resterait invisible. Aucune section n'est aussi
     * haute aujourd'hui, mais un seuil à zéro ne dépend que du premier pixel entré,
     * quelle que soit la hauteur : le point de déclenchement se règle alors par la
     * marge, ce qui est de toute façon ce qu'on veut dire. */
    { threshold: 0, rootMargin: "0px 0px -12% 0px" },
  );
  return io;
}

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = observer();
    /* Sans IntersectionObserver (vieux navigateur, environnement de test) on montre
       tout de suite plutôt que jamais : une animation ratée vaut mieux qu'un bloc perdu. */
    if (!obs) {
      el.classList.add("is-in");
      return;
    }
    /* Un bloc déjà dans le viewport au chargement est traité par le premier callback
       de l'observateur, qui se déclenche immédiatement après l'observation. */
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return (
    <div ref={ref} className={className ? `reveal ${className}` : "reveal"} style={delay ? { "--d": `${delay}s` } as React.CSSProperties : undefined}>
      {children}
    </div>
  );
}
