# Lot be-ie — doutes et fiches laissées telles quelles

Relevé du 31/08/2026. Devise : `€` partout (Belgique et Irlande).
Sources bloquées depuis le conteneur pour ce lot : Resident Advisor (toutes les soirées
irlandaises y vendent), Ticketmaster / Ticketmaster.ie, `verknipt.org` (Cloudflare),
`raverebels.com` et `garageklub.be` (captcha SiteGround sur tout le domaine, API WP comprise),
`c12.brussels` (tunnel refusé, aucun accès), `partyflock.nl` (403), `songkick.com` (406),
`eventim.be`. Skiddle : les pages de LIEU passent bien, mais les salles de Dublin de ce lot
n'y ont quasiment rien (Wigwam n'y liste que ses bingos et brunchs, Racket Space une seule
date, Button Factory une seule) — c'est RA qui porte la billetterie de ces soirées.

## Tarifs non tranchés (fiche laissée telle quelle)

| id | fiche | pourquoi |
|---|---|---|
| 550 | Fuse: SESH with Clara Cuvé & PETERBLUE | seule fiche Fuse dont la page **n'affiche aucun tarif** (les autres portent « €X Presale / €Y Doors ») : https://www.fuse.be/events/fuse-presents-sesh-w-clara-cuv%C3%A9-peterblue |
| 660 | S.P.Y at Racket Space | billetterie RA uniquement, page inaccessible |
| 667 | Main Phase at Wigwam | absent de la page de lieu Skiddle du Wigwam, billetterie RA |
| 866 | STACKED x LOST: KiNK b2b Raredub & Nikki Nair | idem |
| 774 | Mietze Conte at Wigwam | idem |
| 691 | Cassius at Button Factory | date confirmée par l'organisateur (Selective Memory, ven. 16/10/2026, portes 23h30) mais **aucun tarif publié** : https://selectivememory.ie/cassius/ |
| 721 | Duke Dumont at 3Arena | billetterie Ticketmaster.ie (bloquée) |
| 722 | 2manydjs at Vicar Street | la salle confirme la date et le line-up mais renvoie sur Ticketmaster.ie (bloquée) : https://www.vicarstreet.com/component/thelist/show/2317-2manydjs-live-in-vicar-street-58-59-thomas-street-Dublin-8-on-25-Oct-2026.html |
| 692 | 30 Years of Kozzmozz | le site officiel confirme date et affiche mais son bouton « Buy Tickets » ne mène qu'à une page vide : https://www.kozzmozz.com/events/30-years-of-kozzmozz |
| 867 | Yanamaste at Kompass (All Night Long) | date confirmée (https://kompassklub.com/line-up/yanamaste-at-kompass-all-night-long/) mais la billetterie est une agenda Paylogic rendue en JS |
| 953, 679 | Unfaced au C12, Los Ninos: Queer Berlin | `c12.brussels` totalement injoignable depuis le conteneur |
| 884 | Meakusma Festival | la page tarifs du site officiel est vide côté serveur (contenu JetEngine en AJAX) ; l'organisateur annonce seulement une hausse liée à la TVA belge 2026, sans montant : https://www.meakusma.org/event/meakusma-festival-2026/ |
| 887 | Space Safari | boutique Paylogic en JS, aucun montant lisible : https://space-safari.com/ |
| 898 | Sunset Festival | boutique Paylogic en JS. Le site signale que **la première vague est épuisée**, donc la valeur estimée de 45 € est probablement basse : https://www.sunsetfestival.be/ |
| 369 | Liquicity Ghent | boutique Liquicity rendue en JS (`?eventId=e_4sdkj`) |
| 787 | Space Rave: Dacru & Kuf Kuf | aucune page d'organisateur trouvée pour la date du 05/12/2026 à De Chinastraat |
| 801 | Pat B Birthday Bash XXL | Bass Events annonce la date (19/12/2026, Lotto Arena) mais ni affiche ni tarif |
| 376 | FCKNYE Festival | l'ING Arena confirme les dates (30+31/12 + 01/01) et affiche « SCHEDULE TBC » ; `fcknyefestival.com` est une SPA vide côté serveur : https://ing.arena.brussels/en/show/fcknye-festival/ |
| 812 | Verknipt NYE Specials Antwerp | voir « à vérifier » ci-dessous |
| 924, 933 | Full Circle Antwerp / Full Circle Ghent | le site officiel n'annonce que « 150 Artists. 1 Day. 40 Venues. 1 Ticket. », sans nom ni prix : https://full-circle.be/antwerp/ |
| 808 | Full Circle: BYORN Invites | **aucune page** pour le 20/12/2026 dans l'agenda du Kompass (l'API WP du club ne rend que « Byørn at Kompass » du 03/04/2025 et « FULL CIRCLE at KOMPASS » du 20/02/2026) |
| 380 | Reverze | site officiel en pré-inscription, ni affiche ni tarif : https://www.reverze.be/ |
| 139 | Thunderdome | l'AFAS Dome confirme les deux nuits et le concept mais ne publie ni line-up ni tarif : https://www.afas-dome.be/en/event/thunderdome-2026-552e132d |
| 935 | MODUL'AIR Festival | rien de publié pour 2027 sur le site officiel : https://www.modul-air.com/events/ |
| 385 | Extrema Outdoor Belgium | le site officiel n'affiche que « may 2027 / 14 - 16 » : https://www.extrema.be/en/ |
| 936 | Sunrise Festival | pré-inscription 2027 seulement : https://www.sunrisefestival.be/ |
| 876 | Paradise City Festival | le site officiel n'annonce que les dates 2027 et une inscription à l'accès anticipé : https://www.paradisecity.be/en/ |
| 395 | Ostend Beach Festival | « Super Early Bird » annoncé (« −15 € sur un jour, −30 € sur un combi ») mais **la remise n'est pas un prix** ; la boutique est une iframe Weeztix en JS : https://www.ostendbeach.be/en/tickets |
| 937 | Dour Festival | la page tarifs lisible porte encore le titre « Dour Festival 2026 » (pass 1 jour 80 €) alors que la fiche vise l'édition **2027**, dont seule la « WAVE 0 » est ouverte, sur une boutique Eventgoose en JS. On ne reporte pas un tarif d'édition précédente : https://www.dourfestival.eu/en/tickets/ |
| 361 | Rave Rebels XXL | voir ci-dessous |

## Affiches non tranchées

- **361 Rave Rebels XXL (07/11/2026, ING Arena)** — la page de l'événement dit littéralement
  « More intel soon », donc aucun nom : https://www.sway.events/event/3211 . `raverebels.com`
  est derrière un captcha.
- **142 Rampage Weekend (05-07/03/2027)** — page line-up officielle : « SOON TO BE ANNOUNCED ».
  https://www.rampage-weekend.eu/line-up
- **887 Space Safari** — le site officiel ne publie que ses quatre scènes (Supernova, Nebula,
  Galaxy, Zodiac), pas de grille d'artistes. Les quatre noms déjà au catalogue (Eat Static,
  Koxbox, Dickster, James Monro) n'ont donc pas pu être complétés depuis une source primaire.
- **660 S.P.Y at Racket Space (04/09/2026)** — un second nom (« SHO ») apparaît dans les
  résumés de moteur autour de la page RA de l'événement, **page que je n'ai pas pu ouvrir**.
  Non écrit : c'est exactement le cas où un résumé n'est pas une source.

## À vérifier de près (soupçon, aucune fiche supprimée)

- **812 Verknipt NYE Specials Antwerp — risque de confusion d'édition.** Le seul relevé
  lisible du line-up d'un « Verknipt NYE Antwerp » au Garage Klub (Vieze Asbak, Toxic
  Machinery, KARAH, SANTØS, Kruelty, Klofama, BØĘRY) est daté du **31 décembre 2025**
  (https://technomusicworld.com/events/verknipt-nye-antwerp-2026, qui titre « 2026 » tout en
  affichant « Wednesday, 31 December 2025 »). Le catalogue porte le **31/12/2026** avec un
  line-up partiellement différent (Ben Techy, Bøęry, Charlotte Preckler, Kruelty). Deux
  chevauchements seulement, donc soit ce sont bien deux éditions, soit l'une des deux fiches
  a été saisie sur la mauvaise année. Le 31 décembre 2026 est un **jeudi**, ce que ni l'une ni
  l'autre source ne confirme. À trancher sur `verknipt.org` ou `garageklub.be` depuis une IP
  non bloquée avant l'automne.
- **534 Index: HorsegiirL (05/09/2026) — tarif relevé sur un événement complet.** DICE ne
  publie plus qu'un seul type de billet, « General Admission » à **53,05 €**, en statut
  `sold-out` : c'est le dernier palier vendu, pas le prix d'entrée initial, et le catalogue
  estimait 20 €. Le tarif déposé (53 €) est celui qu'on lit aujourd'hui, mais il faut savoir
  qu'il décrit un événement épuisé.
  https://dice.fm/event/q2q8np-index-horsegiirl-5th-sep-index-dublin-dublin-index-dublin-tickets
- **661 Index: Indira Paganotto** — même remarque en plus doux : seul le « Tier 3 » reste en
  vente (39,66 €), les paliers précédents ont disparu de l'API. Les prix DICE sont affichés
  frais inclus et le site ne distingue pas la part de frais dans ce qu'on peut lire.
- **142 Rampage Weekend — 5+6 ou 5+7 mars ?** Le bandeau de `rampage.eu` annonce
  « Rampage Weekend 2027 - **5+6** March », alors que sa propre liste d'événements et la fiche
  du catalogue donnent **05/03 → 07/03**. Le tarif déposé (« Tickets from 31,92 Euro ex fee »,
  vente ouverte le 01/10/2026) est lu sur le site dédié, https://www.rampage-weekend.eu/tickets .
- **924 / 933 Full Circle Antwerp et Full Circle Ghent** — un agrégateur (followthebeat.nl)
  annonce Full Circle Antwerp sur **10-14 novembre 2026** là où le site officiel affiche
  « 10 November 2026 » et la fiche une seule journée. Le site officiel fait foi, mais si
  l'événement est réellement un week-end prolongé, `endDate` manque.
