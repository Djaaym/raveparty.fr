#!/usr/bin/env python3
"""Reporte les tarifs confirmés au guichet dans lib/data.ts.

Un tarif n'est repris que si l'agent l'a lu sur la caisse (`price` non nul et
pas de `priceNote`) : c'est la différence entre « vérifié » et « estimé », et
c'est elle qui autorise à retirer le `priceNote` de la fiche.

Le montant écrit est celui qu'on paie à l'entrée, dans la devise de la caisse :
on ne convertit jamais (règle du catalogue), donc une soirée vendue 150 kr cesse
d'être annoncée « 20 € ».
"""
import json, re, sys, glob

# Un agent rend parfois le code ISO là où le catalogue stocke le symbole. Recopié
# tel quel, « EUR » s'afficherait « EUR55 » et partirait aussi dans le JSON-LD :
# c'est le défaut que merge.py normalise déjà de son côté, il n'a pas à être
# repayé ici. On ne convertit jamais un montant, on ne fait que renommer la devise.
CURRENCY_FIX = {
    "EUR": "\u20ac", "GBP": "\u00a3", "USD": "$", "CZK": "K\u010d", "PLN": "z\u0142",
    "SEK": "kr", "NOK": "kr", "DKK": "kr", "HUF": "Ft", "RON": "lei",
    "RSD": "RSD", "CHF": "CHF", "ISK": "ISK", "BGN": "\u043b\u0432", "HRK": "\u20ac",
}

DATA = 'lib/data.ts'
src = open(DATA, encoding='utf-8').read()
lots = {}
for f in sorted(glob.glob('.research/tickets/b*.json')):
    try: rows = json.load(open(f, encoding='utf-8'))
    except Exception: continue
    for r in rows:
        if r.get('price') is None or r.get('priceNote'): continue
        if r.get('status') not in ('ok', 'soldout'): continue
        cur = r.get('currency')
        lots[int(r['id'])] = (r['price'], CURRENCY_FIX.get(cur, cur))

changed, same, missed = [], 0, []
out = []
for line in src.split('\n'):
    s = line.strip()
    m = re.match(r'\{ id: (\d+),', s)
    if not m or int(m.group(1)) not in lots:
        out.append(line); continue
    i = int(m.group(1))
    new_p, new_c = lots[i]
    mp = re.search(r'\bprice: ([-\d.]+)', line)
    mc = re.search(r'\bcurrency: "([^"]*)"', line)
    if not mp:
        missed.append((i, 'pas de champ price')); out.append(line); continue
    old_p, old_c = mp.group(1), (mc.group(1) if mc else None)
    if abs(float(old_p) - float(new_p)) < 0.005 and (not new_c or new_c == old_c):
        same += 1; out.append(line); continue
    line = line[:mp.start(1)] + str(new_p) + line[mp.end(1):]
    if new_c and mc:
        mc = re.search(r'\bcurrency: "([^"]*)"', line)
        line = line[:mc.start(1)] + new_c + line[mc.end(1):]
    # un tarif lu sur la caisse n'est plus une estimation
    line = re.sub(r', priceNote: "(?:estimated|unknown)"', '', line)
    changed.append((i, f'{old_p}{old_c or ""}', f'{new_p}{new_c or old_c or ""}'))
    out.append(line)

if '--dry' not in sys.argv:
    open(DATA, 'w', encoding='utf-8').write('\n'.join(out))
print(f'tarifs confirmés lus : {len(lots)}')
print(f'  déjà justes        : {same}')
print(f'  corrigés           : {len(changed)}')
print(f'  non appliqués      : {len(missed)}')
for i, a, b in changed[:60]: print(f'    id {i}: {a} -> {b}')
