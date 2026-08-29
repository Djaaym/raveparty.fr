# À vérifier hors conteneur

Remontées par les agents de rafraîchissement (30 août 2026) qu'**aucune source primaire
lisible d'ici** n'a pu confirmer. Le proxy sortant bloque Resident Advisor, eventim,
ticketcorner et les billetteries derrière Cloudflare — c'est-à-dire exactement les
pages qui portent un avis d'annulation.

**Règle : on ne supprime pas une fiche sur un soupçon.** Time Warp Spain a été retiré
sur un communiqué lu, pas sur une absence de nouvelles. Une fiche qui reste est une
erreur réparable ; une fiche retirée à tort emporte son URL indexée avec elle.

| id | fiche | doute | ce qui manque |
|----|-------|-------|---------------|
| 839 | Arena Rave — Messe Leipzig, 20/02/2027 | plusieurs résumés de recherche parlent d'une annulation « aus produktionstechnischen Gründen » avec remboursement automatique | eventim, ticketcorner et RA sont bloqués ; `leipzig-im.de` présente au contraire l'événement comme **confirmé**. Si l'annulation se vérifie : retirer la fiche **et** l'inscrire dans `lib/renamed.ts`, plus élaguer `IMAGES`/`PHOTOS`/`TICKETS`. |
| 803 | Psy-Spirits — Edelfettwerk Hambourg, 19/12/2026 | la date elle-même | le site de l'organisateur ne liste qu'un seul événement à venir (Empire of Goa, 03/10 aux Docks) puis « keine weiteren Events gelistet ». |
| 406 | Elektricity — La Cartonnerie, Reims, 23→28/09/2026 | tenue de l'édition 2026, **dans trois semaines** | les trois domaines du festival sont morts (`ETIMEOUT`), l'agenda de La Cartonnerie ne porte aucun Elektricity sur ses 53 événements, et rien sur jds Reims. Aucune trace d'annulation non plus : `festivalenfrance.com` l'annonce encore « fin septembre 2026 ». L'article artsixMic qui remonte en recherche date de **2012** (10e édition) — piège classique. |

## Corrigé, pour mémoire

- **id 428 Positive Education** — le catalogue portait 12→15/11/2026 au « Parc Expo & Le
  Clapier », c'est-à-dire le format de l'édition **2024** (14-16/11/2024 au parc des
  expositions, cf. petit-bulletin du 05/06/2024). Quatre sources, dont trois publiées en
  août 2026, donnent **6-7 novembre 2026 à la Cité du design** : TL7 (03/08/2026),
  42info (04/08/2026), l'agenda de Loire Tourisme, et le titre de la fiche RA
  (« Positive Education 2026 at Cité du Design »). Fiche corrigée (dates, salle, desc
  FR/EN) et `/lieux/parc-expo-le-clapier` redirigée en 308 vers le festival.
  C'était une fiche `trending`, à dix semaines de la date — exactement le cas que la
  règle « repasser sur les têtes d'affiche à J-60 » existe pour attraper.
- **id 656 Kapital Festival** — l'édition 2026 a bien été annulée/reportée, mais la
  fiche porte déjà le 2 juillet 2027. Rien à faire.
