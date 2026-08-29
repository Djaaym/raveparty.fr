#!/usr/bin/env node
/**
 * Prépare et vérifie un compte Brevo pour les alertes RaveRadar.
 *
 * Brevo refuse un attribut personnalisé qui n'a pas été déclaré dans le compte au
 * préalable, c'est l'erreur de configuration la plus probable, et elle ferait échouer
 * toutes les inscriptions. Ce script crée les cinq attributs, vérifie que la clé et la
 * liste existent, et se termine en résumant ce qu'il a trouvé. Il est idempotent :
 * relance-le autant de fois que tu veux.
 *
 *   BREVO_API_KEY=xkeysib-… BREVO_LIST_ID=3 node scripts/brevo-setup.mjs
 */

const KEY = process.env.BREVO_API_KEY;
const LIST = process.env.BREVO_LIST_ID;

if (!KEY || !LIST) {
  console.error("✗ Il manque BREVO_API_KEY et/ou BREVO_LIST_ID.\n");
  console.error("  BREVO_API_KEY=xkeysib-… BREVO_LIST_ID=3 node scripts/brevo-setup.mjs");
  process.exit(1);
}

/** Doit rester aligné sur attributesFor() dans lib/subscribers.ts. */
const ATTRIBUTES = ["ALERT_KIND", "ALERT_VALUE", "ALERT_LABEL", "ALERT_SUMMARY", "LANG"];

const api = (path, init = {}) =>
  fetch(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json", ...init.headers },
  });

async function main() {
  const account = await api("/account");
  if (account.status === 401) {
    console.error("✗ Clé API refusée (401). Vérifie la valeur de BREVO_API_KEY.");
    process.exit(1);
  }
  if (!account.ok) {
    console.error(`✗ Brevo a répondu ${account.status} : ${(await account.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const { email, plan } = await account.json();
  console.log(`✓ Clé valide, compte ${email}`);
  const free = (plan ?? []).find((p) => p.type === "free");
  if (free) console.log(`  Offre gratuite : ${free.credits ?? "?"} crédits restants aujourd'hui`);

  const list = await api(`/contacts/lists/${LIST}`);
  if (!list.ok) {
    console.error(`✗ Liste ${LIST} introuvable (${list.status}). Crée-la dans Contacts > Listes et reprends son ID.`);
    process.exit(1);
  }
  const { name, totalSubscribers } = await list.json();
  console.log(`✓ Liste ${LIST} « ${name} », ${totalSubscribers} contact(s)`);

  const existing = await api("/contacts/attributes");
  const known = new Set(((await existing.json()).attributes ?? []).map((a) => a.name));

  for (const attr of ATTRIBUTES) {
    if (known.has(attr)) {
      console.log(`  = ${attr} existe déjà`);
      continue;
    }
    const res = await api(`/contacts/attributes/normal/${attr}`, {
      method: "POST",
      body: JSON.stringify({ type: "text" }),
    });
    if (res.ok || res.status === 204) console.log(`  + ${attr} créé`);
    else console.error(`  ✗ ${attr} : ${res.status} ${(await res.text()).slice(0, 160)}`);
  }

  console.log("\n✓ Prêt. Pose ces variables dans Vercel > Settings > Environment Variables :");
  console.log(`    BREVO_API_KEY=${KEY.slice(0, 12)}…`);
  console.log(`    BREVO_LIST_ID=${LIST}`);
  console.log("  puis redéploie, /api/alerts passera de 501 à 200.");
}

main().catch((err) => {
  console.error("✗ " + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
