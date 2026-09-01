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

## Campagne de vérification line-up + tarifs (31 août 2026)

Dix agents ont repassé les 463 fiches à venir qui portaient une affiche vide, une
affiche partielle ou un `priceNote`. Ce qu'aucune source primaire lisible d'ici n'a pu
trancher est consigné là, avec la règle de toujours : **on ne supprime pas une fiche sur
un soupçon**, et une absence n'est pas un communiqué.

### Une seule suppression, sur communiqué lu

**Decibel Open Air** (Florence, 4-6/09/2026, id 318) est retiré. Communiqué officiel
d'Astro s.r.l. reproduit intégralement par sa billetterie
(`ticketnation.it/firenze/decibel-open-air-2026-firenze.7845`) : « l'edizione di Decibel
Open Air 2026 [...] non potrà avere luogo ». C'était une fiche `trending` à quatre jours
de la date. `/festival/decibel-open-air` et `/lieux/parco-delle-cascine`, qui n'existait
que pour elle, redirigent en 308 vers `/pays/italie` depuis `next.config.mjs` ; la clé
entre dans `REMOVED` de `merge.py`, sans quoi le lot de recherche qui l'avait apportée la
réinjecterait au prochain merge.

### Annulation probable, gardée en ligne

| id | fiche | ce qui est établi | ce qui manque |
|----|-------|-------------------|---------------|
| 216 | Todd Terje au Concorde 2, Brighton, 12/09/2026 | j'ai vérifié moi-même que la salle ne porte plus l'événement et que le listing Skiddle du lieu saute du 05 au 19/09 | ce sont deux **absences**. L'agent rapporte un `eventStatus: EventCancelled` sur DICE, que le Cloudflare de DICE m'a empêché de reproduire. Un seul communiqué lu suffit à trancher. |
| 65 | No Sleep Festival, Belgrade, 28/11/2026 | le site officiel n'annonce qu'une édition 2026, **le 4 avril**, rien en novembre | soit la date du catalogue est fausse, soit l'édition d'automne n'est pas annoncée. Aucune source ne le dit. |
| 406 | Elektricity, Reims, 23-28/09/2026 | déjà au registre ci-dessus, et l'agenda complet de La Cartonnerie relevé le 31/08 ne porte toujours **rien** entre le 25 et le 29/09 | à trancher avant le 23 septembre. |
| 803 | Psy-Spirits, Edelfettwerk Hambourg, 19/12/2026 | introuvable sur les deux sites officiels, l'agenda de la salle s'arrête au 27/11 | inchangé depuis le premier relevé. |
| 839 | Arena Rave, Leipzig, 20/02/2027 | l'organisateur ne liste que Rostock le 04/12/2026 | toujours aucune source d'annulation, donc toujours rien à faire. |
| 615 | Psy Clan / Juno Reactor, Tama Poznań, 24/10/2026 | seule date Tama absente de l'agenda Biletomat, où les six autres figurent avec leur tarif | une absence, pas un avis. |
| 865 | Kobosil à l'Akvárium, 02/10/2026 | l'agenda du club liste les deux autres AkvaWaves du lot, pas celle-là | idem. |

### Fiches à corriger, pas à supprimer

- **716 Kimmic** : la salle est **SWG3 Warehouse**, pas TV Studio, dit deux fois sur swg3.tv.
- **745 Vini Vici & Blastoyz** : Blastoyz est dans le titre, absent de l'affiche officielle
  d'IllumiNaughty. Renommer casserait le slug, donc `lib/renamed.ts`.
- **118 David Guetta Galactic Circus** : la résidence court jusqu'au 09/10, la closing est
  probablement ce jour-là et non le 02/10 où la fiche la place.
- **572 Tiësto · INFINITY Lisbon** : accès réservé aux porteurs d'un pass du SBC Summit,
  aucune billetterie publique. Le titre le dit déjà, le tarif ne peut pas exister.
- **218 Klub K4** : le club programme bien ce soir-là, sous le titre « KEEP IN MIND ».
- **142 Rampage Weekend** : le bandeau de `rampage.eu` annonce « 5+6 March » quand sa propre
  liste d'événements et la fiche donnent 05→07/03.
- **812 Verknipt NYE Specials Antwerp** : le seul line-up lisible pour un Verknipt NYE au
  Garage Klub est daté du **31/12/2025**, sur une page titrée 2026, et ne recoupe le
  catalogue que sur deux noms. Deux éditions distinctes, ou une année mal saisie.
- **Duel Club** est à Pozzuoli et **Basic Club** à Cercola, pas à Naples.
- **428 Positive Education** : la correction consignée plus haut est contredite par Loire
  Tourisme (maj 18/08/2026), qui redonne Le Clapier + Parc Expo, et `positiveeducation.fr`
  répond 404. À reprendre avant novembre.

### Devises à contrôler, 27 fiches

Le lot allemand a trouvé deux soirées **bâloises** facturées « ≈ 38 € » alors qu'elles se
paient CHF 25 et CHF 20 : corrigé. Le même test passé sur tout le catalogue sort 27 autres
fiches dont la devise ne correspond pas à leur pays, dont `163 Terminal V Croatia` en `£`
et `391 Palmesus` (Norvège) en `€`. **Rien n'a été converti** : le montant affiché doit être
celui qu'on paie à l'entrée, et une conversion serait précisément le chiffre que personne
n'a annoncé. Certaines sont peut-être justes, un organisateur serbe ou roumain vendant
réellement en euros. Chacune demande d'ouvrir sa billetterie.

    python3 - <<'PY'   # relance le relevé
    import re
    for l in open('lib/data.ts'):
        m = re.match(r'\s*\{ id: (\d+), title: "([^"]*)"', l)
        ...
    PY

### Affiches périmées, le piège le plus coûteux du lot

Deux fiches `trending` portaient l'affiche d'une **édition antérieure**, ce qu'une fusion
aurait conservé : **335 Bloom Festival** (Amelie Lens, Maceo Plex, Folamour, absents de la
page officielle 2026) et **777 FAIRGROUND** (Amelie Lens, Charlotte de Witte, Kyanu, Maddix,
zéro occurrence sur la page line-up officielle qui porte pourtant la date de la fiche).
Les deux ont été vérifiées à la main avant remplacement complet.

Trois autres ont été **écartées avant d'entrer** : l'affiche « Hard Is Coming » qui circule
date de janvier 2022, celle d'Illusion BZH de décembre 2024, et les line-ups encore en ligne
d'Insane Festival et de Nuits Sonores sont ceux des éditions 2026 déjà passées, pas des
éditions 2027 du catalogue. C'est le même piège que l'article artsixMic de 2012 sur
Elektricity : une page qui ne porte pas son année se lit comme si elle était d'aujourd'hui.
