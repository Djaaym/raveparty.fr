# Lot de-a (Allemagne, 25 fiches) - doutes et fiches laissées telles quelles

Relevé au 31/08/2026. Aucune fiche ne semble annulée, reportée ou déplacée : toutes les
dates et toutes les salles du lot sont confirmées par la page officielle correspondante.

## Sources bloquées depuis le conteneur (à retenter ailleurs)

- **ticketticker.de** : challenge Cloudflare (403 en curl, 403 en WebFetch). C'est la
  billetterie de Harder Force (id 696).
- **verknipt.org** : Cloudflare, 403 quel que soit l'user-agent. C'est la seule source
  complète pour le line-up et le tarif de Verknipt Oberhausen (id 754).
- **eventim.de**, **ticketmaster.de** : bloqués comme prévu. TMF Trier (id 655) ne vend
  que par eux et par son propre site, qui n'affiche aucun prix.
- **ticket.io** répond 403 en curl mais **passe par WebFetch** : c'est par là que sont
  passés tous les tarifs Bootshaus, Blacklist et Faceless.

## Fiches laissées telles quelles, et pourquoi

| id | titre | ce qui manque encore | raison |
|---|---|---|---|
| 492 | Blacklist & Inurfase pres. Zaagstep by Dr Donk | prix | la page du club ne donne qu'un lien de pré-inscription (bit.ly/ZAAGSTEP), aucune page de vente ouverte. Le listing `bootshaus.ticket.io` affiche « à partir de 8 € », mais c'est le prix d'un casier, pas une entrée : ne pas le reprendre. |
| 502 | Affenkäfig Rules | line-up | « Das Line Up hauen wir euch bald um die Ohren » sur la page officielle. Tarif trouvé (25 €). |
| 505 | Unreal x KUKO All Night Long | prix | l'événement est **sold out** : la billetterie ne montre plus que des casiers (6 € / 9 €). Le line-up officiel est bien « KUKO All Night Long » seul, la fiche est donc exacte. |
| 696 | Harder Force Indoor Festival | line-up + prix | line-up explicitement « TBA » sur harderforce.de/hfoa ; la billetterie (ticketticker) est derrière Cloudflare. |
| 727 | Faceless Psycho City | line-up | « MORE INFO COMING SOON » partout (site, harderdates). Tarif trouvé (65 €). La billetterie annonce la fenêtre « ven. 30 oct. - dim. 1er nov. 2026 » mais ne vend que Day 1 et Day 2 : les 30-31 du catalogue sont corrects. |
| 754 | Verknipt Oberhausen | prix ; line-up incomplet | verknipt.org inaccessible. Le line-up déposé (14 noms) vient de konzertsuche.de, source secondaire ; l'affiche officielle en compte davantage (BLNK, CHLOE, Gina Beldam, GO$PEL, Ixakt, Natte Visstick, O.B.I., Pawlowski, Rikso, Ryx, Schnoxine, Stratera… d'après les extraits de recherche, **non vérifiés sur page ouverte, donc non écrits**). À reprendre. |
| 810 | Army of Hardcore | line-up + prix | armyofhardcore.net ne publie ni affiche ni tarif (la page tickets n'est qu'un embed Paylogic vide côté serveur) ; turbinenhalle.de et alex-events.net non plus. |
| 377 | Bootshaus & Loonyland - NYE | line-up | aucune affiche annoncée, la page ne promet que « tous les floors ». Tarif trouvé (29 €). |
| 830 | APEX | line-up | « the biggest Hardstyle lineup in our history », aucun nom. La billetterie ticket.io renvoie « Vorverkauf für diese Veranstaltung nicht aktiv », le tarif retenu (69,90 €) est celui affiché sur apexfest.de. |
| 655 | TMF - Trier Music Festival | line-up + prix | tmf-festival.de n'a ni page line-up (404) ni prix ; vente exclusive via le site et Ticketmaster, tous deux muets ou bloqués. |
| 149 | Mayday | line-up | « At the moment, no lineup is available » sur mayday.de/en/lineup. Tarif confirmé à 69 € (l'ancienne estimation à 55 € était basse). |
| 389 | World Club Dome | line-up | les trois onglets (Friday / Saturday / Sunday) de worldclubdome.com/lineup rendent « No items found ». |
| 392 | Ruhr-in-Love | line-up | « Momentan ist noch kein LineUp verfügbar ». La page d'accueil cite bien Klaudia Gawlas, Felix Kröcher et Gestört aber GeiL dans un texte de présentation, mais ce n'est pas une affiche publiée : non repris. |
| 657 | Open Beatz Festival | line-up + prix | « Line Up 2027 - Coming Soon, von Oktober bis Februar » ; la boutique TicketPAY liée depuis le site pointe encore sur l'édition **2026** (24-26/07/2026), aucun tarif 2027 publié. |
| 347 | Ritter Butzke Jubiläum - NTO | rien | le line-up officiel est bien « NTO live » seul : la fiche était déjà juste, aucune ligne de line-up déposée. Tarif confirmé (22,50 €). |

## Points de vigilance pour la relecture

- **Hardshift (783)** : l'affiche officielle écrit huit couples « X vs. Y » (« Anderex vs.
  Exproz », « Dimitri K vs. Dr Donk », « Jazzy vs. Yoshiko », « Namara vs. Sakyra »,
  « Viciouz vs. Brainstorm »). Ils sont déposés tels quels. Attention si l'ingestion les
  découpe : **« Jazzy » est le nom qui a déjà fusionné deux personnes** (Jasmin Fumagalli
  CH / Yasmine Byrne IE) ; ici, sur une affiche hard techno / uptempo aux côtés de
  Yoshiko, c'est Jazzy (CH).
- **Blacklist Festival (585)** : le tarif retenu est le billet vendredi (47 €), le samedi
  est à 62 € et le pass week-end à 102 €. C'est bien « le plus bas réellement vendu ».
- **Bootshaus on a Ship (859)** : le Blind Ticket à 28 € est épuisé, seule la Phase 2 à
  36 € est en vente. Si la fiche doit afficher un tarif d'appel, c'est 36.
- **Le listing `bootshaus.ticket.io` affiche des « à partir de » trompeurs** (8 €, 3 €) :
  ce sont les casiers et le parking, pas l'entrée. Toujours ouvrir la page de l'événement.
