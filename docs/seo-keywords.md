# RaveRadar - Mémoire SEO & mots-clés

> Source : exports SEMrush broad match FR (04/06/2026), `raveparty` & `festival`.
> À garder en tête pour toute la stratégie de contenu et l'architecture des pages.

## Mots-clés de marque / piliers à mémoriser
- **`rave party`**, 40 500 rech./mois (FR), intent informationnel + news. Total longue traîne ≈ **173 300 / mois**.
- **`festival`**, 27 100 rech./mois sur le terme seul ; **volume total de la thématique ≈ 5,44 M / mois** (énorme).

## Constat clé
La demande est **massivement géolocalisée** (département / ville / région) et temporelle (« ce week-end », « autour de moi »). C'est un cas d'école de **SEO programmatique** : une page par lieu = des centaines de pages à fort potentiel.

### Top « rave party {lieu} » (volume mensuel)
| Vol | Lieu |
|----:|------|
| 5 400 | lot |
| 4 400 | aude |
| 4 400 | lozère |
| 3 600 | rennes |
| 2 900 | louargat |
| 1 300 | fontjoncouse |
| 1 000 | ain · drôme · hautes-alpes · isère · lyon · lozère |
| 880 | hérault · la canourgue · innimond |
| 720 | bordeaux · bretagne · larzac · rocamadour · rosporden |
| 590 | carhaix · feyzin · flaux |
| 480 | tarn · nizas · pénestin · chasserades · mont-lozère |
| 390 | loire-atlantique · paris · tourtour |
| 320 | aveyron · orne · charente-maritime |

Termes transverses à forte intention : `rave party autour de moi` (1 900), `rave party ce week-end` (1 600), `rave party en cours` (2 900).

### Côté « festival » (volume mensuel, extrait)
festival de cannes (40 500) · delta festival (27 100) · rose festival (27 100) · festival d'avignon (14 800) · festival de nîmes (14 800) · main square festival (14 800) · dour festival (8 100) · festival de poupet · vieilles charrues · beauregard · aluna festival (9 900)…
→ Forte demande sur les **festivals nommés** ET les **festivals par ville/région**.

## Architecture d'URL recommandée (SEO programmatique)
```
/                                 Accueil
/explore                          Annuaire + filtres (déjà en place ✅)
/rave-party/{lieu}                ex. /rave-party/lyon, /rave-party/drome, /rave-party/lozere
/festival/{lieu}                  ex. /festival/lyon, /festival/bretagne
/festival/{slug}                  pages festival nommées (Awakenings, Dour…)
/genres/{genre}                   ex. /genres/techno, /genres/hardstyle
/rave-party/autour-de-moi         géoloc
/rave-party/ce-week-end           filtre temporel
/artistes/{slug}                  PHASE 2, qui joue où (maillage interne massif)
```
Chaque page lieu = H1 « Rave party {Lieu} », intro éditoriale, liste filtrée des events, FAQ (intent « People also ask »), maillage vers départements/villes voisins, hreflang fr/en.

## Notes d'intention
- Beaucoup de requêtes « rave party » sont **news/illégal** (incendie, accident, agriculteurs) → ne PAS cibler ces angles ; capter plutôt l'intention « trouver/sortir » (autour de moi, ce week-end, {ville}).
- « festival » est très **commercial/navigational** → pages festival riches (line-up, billetterie, dates, lieu, carte).

## Roadmap de contenu
1. ✅ Explorer + filtres.
2. 🔜 Pages programmatiques `/rave-party/{lieu}` & `/festival/{lieu}` (départements + grandes villes prioritaires ci-dessus).
3. 🔜 Pages festival nommées.
4. ⏳ Phase 2 : pages **artistes** (line-up croisé festivals ↔ artistes) pour démultiplier les pages et le maillage interne.

---

## 🌍 Expansion internationale - « rave party / rave » par pays (exports 04/06/2026)

Sources : `raveparty_allkeywords_{nl,es,de,uk}`. À exploiter pour les futures villes / festivals / pages.

### 🇳🇱 Pays-Bas (total ≈ 77 900/mois)
- **rotterdam rave** (8 100) · rave (5 400) · **festival rotterdam** (1 600) · rotterdamse rave (880) · candy festival (720) · klangkuenstler ade (880).
- ➜ **À ajouter** : ville **Rotterdam** (events + page), ~~contenu **ADE**~~ ✅ fait, Candy Festival.
- **ADE (Amsterdam Dance Event)** ✅ : `/festival/amsterdam-dance-event-ade` est passée d'une fiche générique à un **guide complet** (voir `lib/guides.ts`). Intention couverte : « ade 2026 », « amsterdam dance event dates / programme / tickets / prix », « ade c'est quoi », « pass ADE ». L'angle qui différencie de la concurrence : expliquer que **l'ADE n'est pas un festival unique mais 1 200+ événements dans 300+ lieux, sans billet unique**, c'est la question que tout le monde se pose et à laquelle personne ne répond en haut de page. FAQ balisée `FAQPage`, programme jour par jour, `subEvent` schema.org vers les 5 dates ADE du catalogue.

### 🇩🇪 Allemagne (total ≈ 222 700/mois - énorme)
- **nature one** (33 100 ✅ ajouté) · **rave the planet** (12 100, parade techno de Berlin) · pydna / raketenbasis pydna (1 600, le lieu de Nature One) · festival techno (1 600).
- ➜ **À ajouter** : **Rave the Planet** (Berlin), garder Nature One ; marché très orienté **festivals nommés**.

### 🇪🇸 Espagne (total ≈ 63 300/mois)
- Surtout **informationnel** : rave significado, que es una rave, fiesta rave… « techno music festival » (590).
- ➜ **À faire** : page éducative **« ¿Qué es una rave? »** (intent informationnel) + festivals techno ES (Sónar ✅, ajouter Madrid/Valence).

### 🇬🇧 Royaume-Uni
- rave party near me · **upcoming raves** · raves in uk · rave events · rave tickets · uk rave.
- ➜ **À ajouter** : pages **« near me » / « upcoming »**, villes UK (Manchester ✅, Bristol, Leeds, Birmingham, Glasgow), London ✅.

> Idée transverse : la requête **« near me »** revient FR + UK → prévoir une page géolocalisée `/rave-party/autour-de-moi` (géoloc navigateur).

## État de la couverture (revue du 29/07/2026)

Le calendrier couvre **12 mois d'affilée** (août 2026 → juillet 2027), 88 dates à venir sur 116 événements référencés.

### Départements FR couverts
Vaucluse · Gironde · Nord · Bouches-du-Rhône · Ille-et-Vilaine · Seine-et-Marne · Seine-Saint-Denis · Yvelines · Haute-Savoie · Allier · Ardèche · Calvados · Orne · Rhône · Hérault · Isère · Drôme · Loire-Atlantique · Alpes-Maritimes · Paris · Bretagne.

### Départements à fort volume encore vides
| Vol | Lieu | Statut |
|----:|------|--------|
| 5 400 | Lot | page en ligne, aucun événement légal vérifiable trouvé |
| 4 400 | Aude | idem |
| 4 400 | Lozère | idem |
| 1 000 | Ain · Hautes-Alpes | idem |
| 480 | Tarn | idem |
| 320 | Aveyron | idem |

Ces requêtes sont massivement portées par des événements non déclarés (intention news). **Le site ne les couvre pas**, c'est une ligne éditoriale, pas un trou à combler : RaveRadar est un annuaire de festivals et de soirées déclarées. La page reste utile en captation + alerte, mais elle n'aura de contenu que le jour où un festival ou une soirée club s'y tient.

### Ce qui a été cherché sans succès
Qlimax (arrêté après « Final Prophecy » 2024) · Mysteryland 2026 (pause, retour 2027 sans date) · Sonus Croatie (contradictoire) · EXIT Novi Sad 2027 · Tomorrowland Belgique 2027 (dates non officielles) · Macki Music Festival (dernière édition 2025) · Scopitone (biennal). Astropolis l'Hiver, Panoramas, Peacock Society, I Love Techno Europe, Ososphère : dates 2027 non annoncées au 29/07/2026, **à re-vérifier**.


## Couverture paneuropéenne (revue du 29/07/2026, 2e passe)

**349 événements, ~320 à venir, 38 pays, ~7 000 pages statiques, ~1 750 liens internes.**

### Pays ouverts sur cette passe
Danemark · Suède · Norvège · Finlande · Islande · Estonie · Lettonie · Lituanie · Irlande · Slovaquie · Bosnie-Herzégovine · Monténégro · Macédoine du Nord · Bulgarie · Slovénie · Géorgie · Grèce · Chypre · Luxembourg.

### Villes à fort volume désormais servies
**Rotterdam** (8 100 rech./mois) passe de 1 à 16 dates, c'était le plus gros mot-clé ville non couvert. Plus Copenhague, Helsinki, Oslo, Stockholm, Dublin, Belfast, Glasgow, Bristol, Leeds, Prague, Varsovie, Budapest, Bucarest, Zagreb, Belgrade, Sofia, Tbilissi.

### Trous connus
- **Baltes** : festivals seulement. Les sites de clubs (One One, HALL, Sveta, Opium, Lizdas) et RA/DICE renvoient 403 aux requêtes serveur.
- **Départements FR à fort volume toujours vides** : Lot (5,4k), Aude (4,4k), Lozère (4,4k), Tarn, Aveyron, Hautes-Alpes, Ain, aucun festival ni soirée déclarée à y référencer. Volume porté par des événements non déclarés, hors périmètre éditorial.
- **Villes sans contenu vérifiable** : Bilbao, Séville, Naples, Maastricht, Nimègue, Nuremberg, Linz.
- **Décembre-février 2027** reste maigre : la plupart des clubs ne publient qu'à 4-8 semaines.

### Événements confirmés disparus (ne pas re-chercher)
Qlimax · Melt · Fusion (pause jusqu'en 2028) · Secret Solstice · Summerburst · Into the Valley · The Qontinent · Ground Zero · Macki · DGTL Barcelona · Lost & Found Malta · Terraforma · Printworks London (réouverture annoncée, sans date) · Perron Rotterdam · Watergate · Institut für Zukunft · Club Zukunft Zurich · Café d'Anvers · Blitz Munich (ferme début août 2026).

### Dates 2027 non annoncées au 29/07/2026 - à re-vérifier
Tomorrowland · Dour · Astropolis l'Hiver · Panoramas · Peacock Society · I Love Techno Europe · Ososphère · Mysteryland · Caprices · Horst · Listen! · Verknipt Utrecht · A Summer Story · Medusa · Waking Life · Sónar Lisboa · Boomtown · Love Saves the Day · AVA Belfast · Terminal V (lieu à trouver).
