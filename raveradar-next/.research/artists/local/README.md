# Photos déposées à la main

Le reste de `avatars.py` ne va chercher que sur **Wikimedia Commons**, parce que c'est
la seule source qui énonce ses termes de réutilisation. Ce répertoire est l'exception :
une photo qu'on dépose ici est publiée telle quelle, et **la responsabilité des droits
est celle du déposant**, pas d'une licence que le script aurait lue.

Deux gestes :

1. poser le fichier (JPEG ou PNG, au moins 320 px de côté, l'artiste seul et de face
   autant que possible) ;
2. l'ajouter à `sources.json` :

```json
[
  {
    "name": "Amelie Lens",
    "file": "amelie-lens.jpg",
    "author": "Nom du photographe",
    "license": "Autorisation de l'artiste, 2026-08-30",
    "page": "https://exemple.com/presse"
  }
]
```

Puis `python3 .research/artists/avatars.py`.

`author`, `license` et `page` ne sont pas décoratifs : ils s'affichent sous le portrait
sur la fiche artiste, et une entrée à laquelle il en manque un est refusée. Écrire d'où
vient la photo et à quel titre on la publie est la condition, pas la formalité.

Ce que cette route change, et rien d'autre : les garde-fous qui servent à deviner *qui*
est sur la photo (deux visages de taille comparable, aucun visage détecté, netteté) ne
s'appliquent plus, puisque la question est déjà tranchée par celui qui dépose. Le
recadrage carré, le virage duotone et la taille de sortie restent les mêmes que pour
tout le monde, c'est ce qui fait tenir la grille de `/artistes`. Un artiste listé dans
`SKIP` redevient publiable par ce chemin.

## Un logo plutôt qu'un portrait

Certains noms du calendrier sont des collectifs qui ne se présentent pas par un visage
mais par une marque. Une entrée `"kind": "logo"` publie celle-ci :

```json
{
  "name": "Baile Funk Culture",
  "file": "baile-funk-culture.webp",
  "kind": "logo",
  "author": "Baile Funk Culture",
  "license": "",
  "page": ""
}
```

Ce que le mot change, et rien d'autre :

- **le logo est posé entier dans le carré** (contain), là où un portrait y est recadré
  (cover). Toutes les vignettes du site sont rondes, donc la marque est réduite à 66 %
  du côté, sous le cercle inscrit (0,71) : sans ça, « BAILE » perd son B et son E ;
- **la taille minimale et la netteté ne s'appliquent plus.** Elles disent « l'upscale
  se voit » et « il n'y a plus d'image », deux mesures faites pour une photographie :
  un aplat à deux couleurs n'a ni grain à étirer ni variance à mesurer ;
- **seul l'auteur est exigé.** Une photo se publie sous une licence, et la licence se
  vérifie sur une page ; un logo ne se publie pas sous licence, il identifie son
  propriétaire, et c'est lui qu'il faut nommer. `license` et `page` restent acceptés
  quand ils existent ;
- **la fiche le dit.** Le texte alternatif devient « Logo de … » et le crédit « logo
  de … » : annoncer un portrait sous une marque serait exactement le crédit faux que
  `photoSource()` évite par ailleurs. Le logo est aussi écarté de la liste des
  licences sous `/artistes`, qui n'existe que pour les photos de Commons.

Le cadrage carré, le virage duotone et la taille de sortie ne changent pas : c'est ce
qui fait tenir la grille.
