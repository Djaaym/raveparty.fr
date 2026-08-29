# Line-ups CEE / Nord — fiches laissées vides (relevé du 29-30 août 2026)

20 fiches passées en revue, 5 line-ups relevés (ids 212, 213, 117, 123, 649).
Les 15 ci-dessous restent en « Programmation à venir » : aucune source ne publie
d'affiche pour **cette** date. Rien n'a été recopié d'une édition précédente.

| id | fiche | date | ce que dit la source officielle |
|----|-------|------|--------------------------------|
| 234 | Insomnia Festival, Tromsø | 2026-10-14 | `insomniafestival.no/edition/lineup-2026/` affiche « COMING SOON… ». Dates 14-17.10.2026 confirmées en page d'accueil. |
| 241 | MAYDAY Poland 2026 : Iconic | 2026-11-10 | `mayday.pl` annonce « 10 listopada 2026 – 27. edycja MAYDAY. Jedna noc, 16 godzin muzyki, 20 artystów » — aucun nom publié. |
| 246 | Taksirat Festival, Skopje | 2026-11-26 | `taksirat.mk` en est encore au programme « Таксират #27 » (édition 2025). Aucune page pour l'édition #28. |
| 65 | No Sleep Festival, Belgrade | 2026-11-28 | `nosleepfestival.com` ne présente que la date du 4 avril 2026 (Indira Paganotto, DJ Gigola, BIIA, Juno, Valentinø) — **ne pas recopier**, ce n'est pas la même date. Rien sur le 28 novembre. |
| 809 | Protoned Christmas Rave, Copenhague | 2026-12-25 | `pumpehuset.dk/en/koncerter/protoned-christmas-rave-5/` : date, horaire (21h30) et tarif (à partir de 380 kr) publiés, mais « **Lineup kommer snart** ». |
| 62 | Zamna Tulum | 2026-12-31 | `zamnafestival.com/events/multipass-zamna-tulum-2027` ne vend qu'un multipass (3 entrées, à partir de 250 USD). Aucun artiste annoncé. |
| 251 | Tallinn Music Week | 2027-04-08 | `tmw.ee` répond 429 depuis ce conteneur (Vercel Security Checkpoint), et aucune source tierce ne publie d'affiche 2027. |
| 253 | Copenhagen Distortion | 2027-06-02 | `cphdistortion.dk` en est encore à l'édition 3-7 juin 2026. |
| 391 | Palmesus, Kristiansand | 2027-06-25 | `palmesus.com` confirme « 2027 · 25.-26. juni » et « Early Bird Palmesus 2027 utsolgt », mais la seule affiche en ligne est celle de 2026 (Alesso, Macklemore, Boris Brejcha…) — **ne pas la recopier**. |
| 255 | Roskilde Festival | 2027-06-26 | `roskilde-festival.dk` porte bien « 26/6 – 3/7 2027 », mais `/en/line-up` sert encore l'affiche RF26. Actualité du 05.07.2026 : « Thank you, Roskilde – see you in 2027 ». |
| 257 | Beats for Love, Ostrava | 2027-07-01 | `b4l.cz` en est encore au 1-4.7.2026 (Calvin Harris, Paul van Dyk, Marshmello, Dimitri Vegas) — édition passée. |
| 656 | Kapital Festival, Bucarest | 2027-07-02 | `kapitalfestival.ro` est bloqué par le proxy (502). La presse roumaine (infomusic.ro, iaBilet) confirme **2-4 juillet 2027 à l'Arena Națională** — la date du catalogue est bonne — mais annonce l'affiche « en cours ». |
| 258 | Pohoda Festival, Trenčín | 2027-07-08 | `pohodafestival.sk` confirme « 8. – 10.7.2027 » et vend les billets, aucune actualité d'affiche depuis la fin de l'édition 2026. |
| 261 | Electric Castle, Bonțida | 2027-07-14 | `electriccastle.ro` en est encore à « 16-19 July 2026 ». Aucune date ni affiche 2027 publiée. |
| 877 | UNTOLD, Cluj-Napoca | 2027-08-05 | `untold.com` confirme « 5-8 August 2027 » et vend les pass « Star Edition ». Le seul nom d'artiste des actualités (Mau P, Galaxy Stage) concerne l'édition **2026**, tenue en août 2026 — pas 2027. |

## Annulations / reports croisés en chemin

- **Kapital Festival (id 656)** — l'édition **2026** (3-5 juillet 2026, Arena Națională) a été
  annulée/reportée ; l'événement revient les **2-4 juillet 2027**. La fiche du catalogue porte déjà
  le 2 juillet 2027, donc rien à corriger, mais l'information est notée ici pour mémoire.
- Aucune autre annulation ou report repéré sur les 20 fiches.

## Notes de méthode

- **Unsound (ids 117 et 123)** : le site officiel est un front Next.js sur Sanity. Le calendrier
  (`/en/2026/warszawa-krakow/schedule`) ne rend qu'un jour à la fois, mais le dataset public
  (`https://gzr8wts9.api.sanity.io/v2021-10-21/data/query/production`) permet de sortir en une
  requête `programEvent → venue → city` + `eventAreas[].programEntries[].artistAppearance`, donc
  la **ville de chaque salle**. C'est ce qui a permis de séparer proprement les deux fiches : la
  page `/artists` mélange Varsovie et Cracovie, et le champ `cities` des artistes n'est renseigné
  que pour un quart d'entre eux. Les entrées « Discourse » (conférences) n'ont pas de créneau
  musical et ne sont donc pas remontées.
  Les billages composés ont été décomposés en noms d'artistes (`Arca b2b Bobby Beethoven` →
  `Arca` + `Bobby Beethoven`, `Sarah Davachi presents The Will of Tongues` → `Sarah Davachi`) :
  chaque nom reste imprimé tel quel sur l'affiche, mais un intitulé de production ne fait pas une
  fiche artiste.
- **Loftas Fest (id 213)** : 15 des 17 noms viennent du communiqué du 24/08/2026 relayé par
  15min.lt. **Garbanotas** et **MPSI** viennent des vignettes de la section « Bands & Stages » de
  `loftasfest.com` — les noms n'y sont lisibles que dans les **noms de fichiers image**
  (`garbanotas_post1.png`, `mpsi_post1.png`), le texte étant gravé dans l'image. Si ce niveau de
  preuve paraît trop faible, ce sont les deux seules entrées à retirer.
  Trois scènes sur six (ELFA, GARAGE, RED CAT) sont encore « Announcement coming soon ».
- **Let It Roll Winter (id 649)** : les 12 noms sont le bloc « Headliners » de la page officielle
  de l'édition d'hiver. Le site annonce 40+ DJ ; `/lineup/` (édition d'été) reste « To Be
  Announced ». Affiche donc partielle.
- **Ankali (id 212)** : `ankali.cz` présente un certificat qui ne correspond pas au nom d'hôte
  (curl échoue en 60) — le vrai domaine est **`anka.li`**, et il sert un timetable complet, salle
  par salle et heure par heure. Les deux b2b (`KEWU b2b Casablanka`, `Luci Jacuzzi b2b Brovanni`)
  ont été séparés en noms individuels, ce qui donne 14 DJ.
