# Déployer RaveRadar (Next.js) sur Vercel

L'app est dans le **sous-dossier `raveradar-next/`** du repo. Le build est vérifié, aucune variable d'environnement n'est requise.

## En 5 minutes (Vercel - recommandé)
1. Va sur **vercel.com → Add New → Project** et importe le repo GitHub `Djaaym/raveparty.fr`.
2. **⚠️ Réglage critique**, dans la config du projet, mets :
   - **Root Directory : `raveradar-next`** (sinon Vercel ne trouve pas l'app).
   - Framework Preset : **Next.js** (auto-détecté).
   - Build Command / Output : laisser par défaut.
3. **Production Branch** : `main` (voir « Avant de déployer » ci-dessous).
4. Clique **Deploy**. C'est tout, Next + Tailwind + Framer Motion + les ~135 pages SEO se construisent automatiquement.

## Avant de déployer
- **Fusionner le travail dans `main`** : tout est sur la branche `claude/gifted-carson-HQLiX` (PR ouverte). Merge-la dans `main`, ou configure cette branche comme branche de production sur Vercel.
- **Domaine** : le code utilise `https://raveparty.fr` (`lib/site.ts`) pour le sitemap/robots/metadata. Si tu déploies d'abord sur l'URL `*.vercel.app`, change `SITE_URL` dans `lib/site.ts`, ou ajoute simplement ton domaine `raveparty.fr` dans **Vercel → Settings → Domains** (recommandé) et garde la valeur actuelle.

## Ce qu'il faut changer toi-même
| Quoi | Où | Pourquoi |
|---|---|---|
| Root Directory = `raveradar-next` | Réglages projet Vercel | l'app est en sous-dossier |
| Brancher le domaine `raveparty.fr` | Vercel → Domains | sitemap/robots pointent dessus |
| `SITE_URL` | `lib/site.ts` | seulement si le domaine final diffère |

## Alternatives
- **Netlify** : plugin officiel Next.js, même principe (Base directory = `raveradar-next`).
- **CLI** : `cd raveradar-next && npx vercel` (nécessite un compte/token Vercel).

## Vérifs post-déploiement
- `/` (FR) et `/en` (EN) ✓
- `/rave-party/lyon`, `/festival/awakenings-festival`, `/genres/techno` ✓
- `/sitemap.xml` et `/robots.txt` ✓ → à soumettre dans la Google Search Console.
