#!/usr/bin/env node
/**
 * Rend les messages du site dans `.mail-preview/`, sans rien envoyer.
 *
 * Un mail ne se relit pas dans son gabarit. Les trois défauts attrapés en écrivant
 * celui-ci ne se voyaient que sur le message construit : un lien répété deux fois dans
 * la version texte (« Site : https://fornap.fr/ https://fornap.fr/ »), une table qui
 * prenait la longueur d'une URL de billetterie pour largeur minimale et débordait de
 * l'écran d'un téléphone, et une date ISO nue dans un message qui demande justement de
 * vérifier le jour de la semaine. C'est la règle du dépôt sur les textes engendrés, « un
 * texte engendré se relit sur la page construite, pas dans le gabarit », appliquée au
 * seul contenu du site qui n'a pas de page.
 *
 *     node scripts/mail-preview.mjs        # tout
 *     node scripts/mail-preview.mjs j7     # un seul, par fragment de nom
 *
 * Chaque message sort en deux fichiers, `.html` et `.txt` : les deux versions partent
 * ensemble dans un vrai envoi, donc les deux se relisent.
 *
 * ## Pourquoi ce script transpile lui-même
 *
 * Les gabarits sont en TypeScript et Node ne les lit pas. Plutôt qu'ajouter un lanceur
 * (`tsx`, `ts-node`) pour un aperçu, on passe par `typescript`, déjà là en dépendance de
 * développement : `transpileModule` suffit, il n'y a aucun type à vérifier ici, `tsc`
 * s'en charge au build. Les imports relatifs sont suivis en cascade, donc le rappel J-7
 * tire `lib/data.ts` comme en production, avec le vrai catalogue.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const OUT = ".mail-preview";
const only = process.argv[2] ?? "";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/** Transpile un module de `lib/` et, récursivement, tout ce qu'il importe. */
const done = new Set();
function emit(name) {
  if (done.has(name)) return;
  done.add(name);
  const src = readFileSync(join("lib", `${name}.ts`), "utf8");
  for (const m of src.matchAll(/from "\.\/([\w-]+)"/g)) emit(m[1]);
  const js = ts
    .transpileModule(src, { compilerOptions: { target: "ES2022", module: "ESNext" } })
    .outputText.replace(/from "\.\/([\w-]+)"/g, 'from "./$1.mjs"');
  writeFileSync(join(OUT, `${name}.mjs`), js);
}
for (const m of ["promoter-mail", "interest-mail", "mail-template"]) emit(m);

const load = (name) => import(pathToFileURL(join(process.cwd(), OUT, `${name}.mjs`)).href);
const { signupRequestMail, submissionRequestMail, accountDecisionMail, submissionDecisionMail } =
  await load("promoter-mail");
const { reminderMail } = await load("interest-mail");
const { renderMail } = await load("mail-template");
const { EVENTS, upcoming, todayISO } = await load("data");
const { SITE_URL } = await load("site");

/* Des fixtures plausibles, pas des « Lorem » : ce qu'on relit, c'est le comportement du
   gabarit sur de la vraie saisie, un nom à barre oblique, une adresse longue, une URL
   sans césure possible, une description en Markdown réduit. */
const account = {
  name: "NO/ID",
  kind: "organisateur",
  contact: "Jess",
  email: "contact@noid.example",
  phone: "06 27 61 19 10",
  city: "Toulon",
  country: "France",
  website: "https://noid.example/",
  instagram: "noid_collectif",
  soundcloud: "",
  legalId: "430 389 031 00039",
  about:
    "Association de 25 ans, NO/ID organise des événements sur la côte méditerranéenne. Depuis 2024 elle a la gestion du Fort Napoléon à La Seyne-sur-Mer et y développe une programmation musicale.",
  lang: "fr",
  status: "pending",
  password: "",
  createdAt: new Date().toISOString(),
};

const submission = {
  id: "sub_demo",
  owner: account.email,
  status: "pending",
  createdAt: new Date().toISOString(),
  title: "Fort Napoléon Open Air #4",
  type: "Open air",
  genre: "Techno",
  subgenres: ["Hard Groove"],
  city: "La Seyne-sur-Mer",
  country: "France",
  venue: "Fort Napoléon",
  address: "Chemin Marc Sangnier, 83500 La Seyne-sur-Mer",
  date: "2027-06-19",
  endDate: "",
  time: "18:00",
  endTime: "02:00",
  lineup: ["Vortek's", "Hysta", "Nina Kraviz"],
  desc: "Quatrième édition de l'open air du **Fort Napoléon**, face à la rade.\n- Deux scènes\n- Navettes depuis Toulon",
  descEn: "",
  price: "22",
  currency: "€",
  priceNote: "estimated",
  ticketUrl: "https://shotgun.live/fr/events/fort-napoleon-open-air-4",
  posterUrl: "",
  posterFile: "affiche.jpg",
  contactEmail: account.email,
  lang: "fr",
};

const links = {
  yes: `${SITE_URL}/api/promoteur/approve?e=demo&a=approve&t=jeton-signe`,
  no: `${SITE_URL}/api/promoteur/approve?e=demo&a=reject&t=jeton-signe`,
};

const today = todayISO();
// Un événement du catalogue, pas une fiction : c'est lui qui porte les cas tordus
// (titre long, salle à libellé descriptif, tarif estimé, festival sur plusieurs jours).
const event = upcoming(EVENTS, today).find((e) => e.lineup.length > 3) ?? EVENTS[0];

const messages = {
  "1-compte-demande": signupRequestMail(account, links),
  "2-depot-demande": submissionRequestMail(submission, account.name, "affiche.jpg", links),
  "3-compte-valide": accountDecisionMail(account, "approve"),
  "4-compte-refuse": accountDecisionMail(account, "reject"),
  "5-depot-valide": submissionDecisionMail(submission, "publish"),
  "6-depot-ecarte": submissionDecisionMail(submission, "reject"),
  "7-rappel-j7-fr": reminderMail(event, "fr", today),
  "8-rappel-j7-en": reminderMail(event, "en", today),
  "9-test-envoi": {
    subject: "RaveRadar, test d'envoi",
    ...renderMail(
      {
        kicker: "Test d'envoi",
        title: "Le transport fonctionne",
        blocks: [{ kind: "text", text: "Aperçu, ce message n'est pas celui que la console envoie." }],
      },
      SITE_URL,
    ),
  },
};

let n = 0;
for (const [name, mail] of Object.entries(messages)) {
  if (only && !name.includes(only)) continue;
  writeFileSync(join(OUT, `${name}.html`), mail.html);
  writeFileSync(join(OUT, `${name}.txt`), `Objet : ${mail.subject}\n\n${mail.text}`);
  n += 1;
  console.log(`${OUT}/${name}.html`);
}
console.log(`\n${n} message(s), rendus avec le catalogue du ${today}.`);
console.log("Ouvre les .html dans un navigateur, et relis les .txt : les deux partent ensemble.");
