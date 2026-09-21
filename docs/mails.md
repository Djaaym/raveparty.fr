# Les mails du site - un seul gabarit, deux rendus

Le site parle à quelqu'un hors de son domaine à sept occasions, et c'est le seul
contenu qu'il publie sans page derrière. Un organisateur à qui on demande sa confiance
voit ce message **avant** de voir une fiche : une mise en page soignée sur le site et un
pavé de texte brut dans sa boîte disent l'inverse l'un de l'autre.

Tout passe donc par **`lib/mail-template.ts`**, qui rend la version HTML et la version
texte **à partir de la même structure**. Les routes décrivent ce qu'elles disent, le
gabarit décide à quoi ça ressemble.

---

## 1. Ce qui part, d'où, et vers qui

| Message | Construit par | Vers |
|---|---|---|
| Demande de compte promoteur | `signupRequestMail()`, `lib/promoter-mail.ts` | le propriétaire |
| Dépôt d'événement | `submissionRequestMail()` | le propriétaire |
| Compte validé / refusé | `accountDecisionMail()` | le promoteur |
| Dépôt vérifié / écarté | `submissionDecisionMail()` | le promoteur (contact de la fiche, à défaut le compte) |
| Rappel J-7 « ça m'intéresse » | `reminderMail()`, `lib/interest-mail.ts` | le lecteur qui a posé un fanion |
| Nouvelle alerte (chemin Resend) | `lib/subscribers.ts` | le propriétaire |
| Test d'envoi | `app/api/admin/data/route.ts` | le propriétaire |

Le transport (SMTP, Resend, Brevo), l'expéditeur et le destinataire par défaut sont
décrits dans **`docs/promoteurs.md`**, § mail. Le gabarit n'en sait rien : il rend un
message, `sendMail()` l'achemine.

---

## 2. Décrire un message

Un appelant n'écrit jamais de HTML. Il décrit des blocs :

```ts
const mail = renderMail(
  {
    kicker: "Demande de compte",          // le sur-titre, en capitales espacées
    title: account.name,
    preheader: "Approuver ou refuser en un clic.",
    blocks: [
      { kind: "text", text: "Une structure demande un compte promoteur." },
      { kind: "rows", rows: [{ k: "Contact", v: "Jess" }, { k: "Site", v: url, href: url }] },
      { kind: "quote", title: "Présentation", text: account.about },
      {
        kind: "panel",
        title: "Ta décision",
        blocks: [{ kind: "actions", actions: [{ href: yes, label: "Approuver", tone: "ok" }] }],
      },
      { kind: "note", text: "Ces liens valent le secret qui les signe." },
    ],
    footnote: "Message automatique du formulaire d'inscription promoteur.",
  },
  SITE_URL,
);
// -> { html, text }
```

Sept blocs : `text`, `rows`, `actions`, `panel`, `quote`, `note`, `divider`. Quatre tons
de bouton : `primary` (le dégradé de marque), `ok` (vert acide), `danger` (contour
magenta), `ghost` (contour gris).

Trois points à connaître avant d'en ajouter un :

- **`text` est le seul bloc qui admette du HTML** (`<b>`, `<a>`), parce qu'il est rédigé
  par nous. Ce qu'on y interpole s'échappe avec `escapeMail()`. Tout le reste est
  échappé au rendu : une ligne de `rows` porte de la saisie (nom de structure, titre
  d'événement, adresse), et c'est le seul endroit du message où une chaîne arrive sans
  avoir été relue.
- **Le refus est en contour, jamais plein.** Posés côte à côte, deux boutons pleins
  appellent le doigt pareil, et ces liens sont à sens unique.
- **`renderMail()` prend `siteUrl` en paramètre** plutôt que d'importer `lib/site.ts` :
  le module reste feuille, donc une route de compte ne tire pas le catalogue pour
  envoyer une notification.

---

## 3. Ce qu'un client mail n'est pas

Ce n'est pas un navigateur, et ça décide de toute la mise en page.

- **Tableaux `role="presentation"` et styles en ligne.** Gmail jette `<style>` sur
  mobile, donc il n'y a pas de feuille de style à écrire. Largeur bornée à 600 px.
- **Aucune fonte distante.** Syne et Inter n'arriveront jamais dans une boîte mail :
  c'est Helvetica, et le kicker en chasse fixe.
- **Aucune image de fond, aucun pixel espion.** La seule image est le logo, servi depuis
  `/icon-96.png` ; bloquée, elle ne laisse rien à la place, le nom est du texte à côté.
- **Deux dégradations assumées.** Outlook sous Windows ignore `border-radius` (les
  boutons y sont carrés, ils restent cliquables) et `linear-gradient`, d'où le `bgcolor`
  posé **en plus** sur chaque cellule qui en porte un, sinon la barre de marque s'y
  rendrait transparente.
- **Deux boutons dans la même rangée de tableau fixent la largeur minimale du message.**
  Une rangée ne se replie pas : mesuré dans une iframe de 320 px, le message faisait
  349 px de large pour 320 de viewport, et le coupable n'était ni les URL de billetterie
  ni les tableaux de valeurs, qui se replient très bien, mais la paire « Valider /
  Écarter ». Les boutons sont des `inline-block` dans une seule cellule, ils passent à la
  ligne quand la place manque. **Ça ne se mesure que dans un vrai viewport étroit** :
  Chromium refuse une fenêtre de moins de 485 px, donc `--window-size=380` rogne la
  capture sans rétrécir la page, il montre un débordement là où il n'y en a pas et en
  cacherait un vrai. Vérifié à 320, 360 et 480 px sur les neuf aperçus.

---

## 4. Relire avant d'envoyer

```bash
cd raveradar-next
npm run mail:preview            # neuf aperçus dans .mail-preview/
npm run mail:preview j7         # un seul, par fragment de nom
```

Neuf aperçus pour sept messages : le rappel J-7 est rendu dans les deux langues, et le
test d'envoi de la console s'y ajoute. Chaque message sort en `.html` **et** en `.txt` :
les deux partent ensemble dans un vrai envoi, donc les deux se relisent.

Le rappel J-7 est rendu avec un vrai événement du catalogue, pas une fiction : ce sont
les vrais libellés qui portent les cas tordus (titre long, salle à libellé descriptif,
tarif estimé, festival sur plusieurs jours).

Les trois défauts attrapés en écrivant ces gabarits ne se voyaient **que** sur le
message construit : un lien répété deux fois dans la version texte (« Site :
https://noid.example/ https://noid.example/ »), le débordement mobile ci-dessus, et une
date ISO nue dans un message qui demande justement de vérifier le jour de la semaine. C'est
la règle du dépôt sur les textes engendrés, appliquée au seul contenu qui n'a pas de
page : **un texte engendré se relit sur ce qui est rendu, pas dans le gabarit.**

Le bouton « tester l'envoi » de `/admin` part avec le même gabarit que les vrais
messages : ce qu'on vérifie là n'est pas seulement que le transport répond, c'est aussi
ce qui arrive dans la boîte.

---

## 5. Ce que ces messages s'interdisent

Les règles du dépôt s'appliquent au mail comme au reste, et deux d'entre elles y sont
plus tranchantes qu'ailleurs, un message envoyé ne se corrige pas.

- **Rien d'inventé.** Le rappel J-7 ne nomme aucun hôtel et n'annonce aucun prix
  d'hôtel : un mail n'a pas de `revalidate`, donc un chiffre périmé y reste faux pour
  toujours. Un refus ne promet pas un réexamen qu'on ne ferait pas, il dit ce qui manque.
- **La mention d'affiliation est dans le corps**, pas en pied de page, et le rappel J-7
  garde sa **phrase entière** là où la fiche se contente d'un libellé court : un mail n'a
  pas de page à côté de lui vers laquelle renvoyer l'explication.
- **Pas de tiret cadratin.** Un mail est du contenu publié comme le reste.
- **Un lien signé est nommé comme tel.** Les liens de décision valent le secret qui les
  signe, et le message le dit au propriétaire à chaque fois.
