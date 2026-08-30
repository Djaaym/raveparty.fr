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
