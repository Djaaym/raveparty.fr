import type { Lang } from "@/lib/types";
import Nav from "./Nav";
import Footer from "./Footer";
import { cardEvents, past } from "@/lib/data";
import AccountTabs from "./AccountTabs";

/**
 * La page de compte.
 *
 * Elle reste **rendue statiquement** : l'en-tête, les onglets et l'état de la session
 * vivent tous dans `<AccountTabs>`, qui demande la session après l'hydratation. Le
 * cookie est `HttpOnly`, donc il n'y a rien à lire au rendu de toute façon, et rendre la
 * page dynamiquement pour afficher un nom coûterait la génération statique du reste.
 */
export default function AccountView({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="blob b1" />
      <div className="blob b2" />
      <Nav lang={lang} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          {/* Les favoris sont des ids en localStorage : la résolution se fait côté client,
              donc le catalogue doit y être, mais allégé de tout ce qu'une carte
              n'affiche pas, sinon c'est 218 Ko de JS. Voir `cardEvents()`. */}
          <AccountTabs lang={lang} events={cardEvents()} history={cardEvents(past().slice(0, 4))} />
        </div>
      </section>
      <Footer lang={lang} />
    </>
  );
}
