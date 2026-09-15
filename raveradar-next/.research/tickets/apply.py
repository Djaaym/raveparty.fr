#!/usr/bin/env python3
"""Reporte les lots de vérification billetterie dans lib/data.ts.

Un lot est un tableau de {id, status, url, checked_on, price, currency,
priceNote, note} écrit par un agent de vérification. Le script ne réécrit que
la map TICKETS et, quand un tarif est confirmé, price/priceNote de la fiche.

Garde-fous, dans l'ordre où ils ont coûté cher :
  - une URL racine n'est pas un lien d'achat, elle est refusée comme si elle
    était absente : c'est le défaut que toute la campagne corrige ;
  - les lignes de TICKETS portent un commentaire « // Titre, Ville » en fin de
    ligne, donc on ne reconnaît jamais une entrée sur `",$` ;
  - un id inconnu du catalogue est refusé, sinon la map reprend les entrées
    orphelines que `--prune` existe pour retirer.
"""
import json, re, sys, glob, os
from urllib.parse import urlparse

DATA = os.path.join(os.path.dirname(__file__), '../../../../../home/user/raveparty.fr/raveradar-next/lib/data.ts')
DATA = os.path.realpath('/home/user/raveparty.fr/raveradar-next/lib/data.ts')
LOTS = sorted(glob.glob('/tmp/claude-0/-home-user-raveparty-fr/79f94381-5bdc-5187-9b2b-b1e71d600571/scratchpad/tickets/b*.json'))

def esc(s): return s.replace('\\', '\\\\').replace('"', '\\"')

def load_lots():
    rows, seen = [], {}
    for f in LOTS:
        try: data = json.load(open(f, encoding='utf-8'))
        except Exception as e: print(f'  ! {os.path.basename(f)} illisible: {e}'); continue
        for r in data:
            if not isinstance(r, dict) or 'id' not in r: continue
            i = int(r['id'])
            if i in seen and seen[i] != f:
                print(f'  ! id {i} présent dans deux lots ({os.path.basename(seen[i])} et {os.path.basename(f)})')
            seen[i] = f
            rows.append(r)
    return rows

def main():
    src = open(DATA, encoding='utf-8').read()
    # index du catalogue
    cat = {}
    for m in re.finditer(r'\{ id: (\d+),.*?\n', src):
        pass
    for line in src.split('\n'):
        s = line.strip()
        if not s.startswith('{ id:'): continue
        i = int(re.match(r'\{ id: (\d+)', s).group(1))
        t = re.search(r'title: "((?:[^"\\]|\\.)*)"', s)
        c = re.search(r'city: "((?:[^"\\]|\\.)*)"', s)
        cat[i] = (t.group(1) if t else '?', c.group(1) if c else '?')

    ts = src.index('const TICKETS: Record<number, string> = {')
    te = src.index('\n};', ts)
    body = src[ts:te]
    existing = {}
    for m in re.finditer(r'^\s*(\d+): "([^"]*)",', body, re.M):
        existing[int(m.group(1))] = m.group(2)

    rows = load_lots()
    add, repl, skip, price_fix = {}, {}, [], []
    for r in rows:
        i, url, st = int(r['id']), (r.get('url') or '').strip(), r.get('status')
        if i not in cat:
            skip.append((i, 'id absent du catalogue')); continue
        if not url or st == 'none':
            skip.append((i, f"pas de lien ({r.get('note','')[:60]})")); continue
        p = urlparse(url)
        if p.scheme != 'https':
            skip.append((i, f'schéma refusé: {url[:50]}')); continue
        if p.path in ('', '/') and not p.query:
            skip.append((i, f'lien racine refusé: {url[:50]}')); continue
        (repl if i in existing else add)[i] = (url, st, r.get('checked_on', ''))
        if r.get('price') is not None and not r.get('priceNote'):
            price_fix.append((i, r['price'], r.get('currency')))

    print(f'lots lus        : {len(LOTS)} fichiers, {len(rows)} fiches')
    print(f'à ajouter       : {len(add)}')
    print(f'à remplacer     : {len(repl)}')
    print(f'écartées        : {len(skip)}')
    print(f'tarifs confirmés: {len(price_fix)}')
    if '--dry' in sys.argv:
        for i, why in skip[:25]: print(f'  skip {i}: {why}')
        return

    # remplacements
    for i, (url, st, on) in repl.items():
        t, c = cat[i]
        new = f'  {i}: "{esc(url)}", // {t}, {c}'
        body = re.sub(rf'^\s*{i}: "[^"]*",.*$', lambda _m: new, body, count=1, flags=re.M)
    # ajouts, insérés avant l'accolade fermante (ancre = la déclaration, pas un commentaire voisin)
    lines = [f'  {i}: "{esc(u)}", // {cat[i][0]}, {cat[i][1]}' for i, (u, _s, _o) in sorted(add.items())]
    body = body.rstrip('\n') + ('\n' + '\n'.join(lines) if lines else '')
    src = src[:ts] + body + src[te:]
    open(DATA, 'w', encoding='utf-8').write(src)
    print(f'\nlib/data.ts réécrit : {len(add)} ajouts, {len(repl)} remplacements.')
    if price_fix:
        print('Tarifs confirmés à reporter à la main (price/priceNote) :')
        for i, pr, cu in price_fix[:40]: print(f'  id {i}: {pr} {cu or ""}')

main()
