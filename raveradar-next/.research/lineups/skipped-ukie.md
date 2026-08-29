# UK / Irlande — fiches laissées sans line-up (au 30 août 2026)

8 des 20 fiches de la liste de travail restent en « Programmation à venir ». Aucune
n'a de line-up publié à ce jour ; rien n'a été déduit ni recopié d'une autre édition.

| id | événement | date | pourquoi |
|----|-----------|------|----------|
| 211 | FOLD presents Bassiani (Extended) | 2026-09-05 | La page billetterie officielle de FOLD (https://www.fold.london/tickets) publie un texte de présentation complet pour le 05.09.2026 mais **aucun nom d'artiste** — FOLD annonce ses line-ups tard, voire jamais (l'UNFOLD du 27/09 est explicitement « unannounced », billets à la porte uniquement). RA, qui porte la billetterie, est bloqué depuis le conteneur. |
| 466 | Steppers at Drumsheds | 2026-09-26 | La fiche officielle Drumsheds (https://drumshedslondon.com/event/steppers/) affiche littéralement « TBA » à la place du line-up, à quatre semaines de la date. Waiting-list ouverte. |
| 487 | The Warehouse Project: FAC51 The Haçienda | 2026-12-05 | Page officielle WHP (https://thewarehouseproject.com/events/hacienda/) : « Lineup revealed soon. Sign up now for first information ». Billets pas encore en vente. |
| 140 | The Warehouse Project New Year's Eve | 2026-12-31 | Page officielle WHP (https://thewarehouseproject.com/events/nye/) : titre, salle et horaires (20:00-04:00) seulement, aucune programmation, alors que les billets sont déjà en vente. |
| 249 | Teletech Belfast | 2026-12-26 | L'agenda officiel Teletech (https://www.teletech.events/events) liste bien « Teletech: Belfast — 26 Dec — The Telegraph Building » mais **sans tarif ni billetterie active** : le lien Skiddle qu'il porte (skiddle.com/e/42567156) retombe aujourd'hui sur la page de la salle, « No events to display ». Ni Shine Tickets (le promoteur du Telegraph Building, https://shine.tickets/) ni Ents24 ne listent la date. Rien à relever — et rien qui indique une annulation non plus, la date reste affichée par Teletech. |
| 252 | Field Day | 2027-05-29 | Site officiel (https://fielddayfestivals.com/) : « Saturday 29th May 2027 » confirmé, mais « Make sure you're on the list to hear first about our lineup announcements ». Rien d'annoncé. |
| 254 | Gottwood Festival | 2027-06-10 | Site officiel (https://gottwood.co.uk/) : dates 2027 confirmées, early birds déjà épuisés, aucun nom. |
| 260 | Parklife | 2027-07-10 | Site officiel (https://parklife.uk.com/) : « Saturday 10th + Sunday 11 July », early birds en vente, aucun nom annoncé. |

## À signaler côté données (hors line-up)

- **Aucune annulation ni report détecté** sur les 20 dates de la liste. Toutes sont
  toujours affichées par leur salle ou leur organisateur.
- **id 254 — Gottwood Festival** : notre fiche porte `date: 2027-06-10` seule. Le site
  officiel annonce **10 au 13 juin 2027** (« Returning from 10th to 13th of June »).
  Un `endDate: "2027-06-13"` manque donc — sans lui, `isPast()` sortira le festival
  des listings dès le 11 juin. (Le `<title>` de la page dit « 10th-14th June », le
  corps de page dit 10-13 : c'est le corps qui fait foi ici, mais à re-vérifier avant
  d'écrire l'`endDate`.)
- **id 260 — Parklife** : notre fiche porte `date: 2027-07-10` seule ; l'officiel
  annonce **samedi 10 + dimanche 11 juillet 2027**. `endDate: "2027-07-11"` manquant.
- **id 232 — Teletech Liverpool** : la soirée est en fait billée
  « Teletech: JOWI [ALL NIGHT LONG] », un seul artiste toute la nuit. Idem pour
  Glasgow (237), Newcastle (243), Cardiff (250) et Belfast (249), qui sont les étapes
  de la tournée « KIRSTY All Night Long » — un `lineup` à un seul nom n'est pas une
  affiche incomplète, c'est le format de la soirée.
- **id 466 — Steppers at Drumsheds** : Drumsheds affiche « FROM £38.45 + BF », notre
  fiche pourra être confirmée au passage.
