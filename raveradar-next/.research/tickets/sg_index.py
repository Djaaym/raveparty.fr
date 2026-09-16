#!/usr/bin/env python3
"""Construit un index global de l'agenda Shotgun, puis l'apparie au catalogue.

Pourquoi un index global et pas une requête par ville de la fiche : Shotgun
range ses dates par ZONE, pas par commune. Marseille s'appelle « aix-marseille »,
Balma est dans « toulouse », et deviner le slug depuis la ville du catalogue rend
une coquille vide de 124 Ko qui se lit comme « aucune date », ce qui fait passer
un balayage pour concluant alors qu'il n'a rien regardé. La liste des zones fait
autorité : elle vient du collecteur du dépôt.

Deux formes de lien coexistent, /en/events/{slug} et /en/web/events/{slug} ;
n'en reconnaître qu'une coûte 561 dates rien que sur Paris.
"""
import json, re, subprocess, sys, time, unicodedata
from pathlib import Path

sys.path.insert(0, '/home/user/raveparty.fr/raveradar-next/.research/sources')
from shotgun import CITIES  # la liste des zones réellement servies par Shotgun

EV = r'/en/(?:web/)?events/'
CARD = re.compile(
    r'href="(' + EV + r'[a-z0-9\-]+)"'
    r'(?:(?!href="' + EV + r').)*?alt="([^"]*)"'
    r'(?:(?!href="' + EV + r').)*?dateTime="(\d{4}-\d{2}-\d{2})', re.S)

def norm(s):
    s = unicodedata.normalize('NFD', s or '').lower()
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def build():
    done = {}
    if Path('sg-index.json').exists():
        for r in json.load(open('sg-index.json', encoding='utf-8')):
            done.setdefault(r['zone'], []).append(r)
    idx = [r for rs in done.values() for r in rs]
    for z in CITIES:
        if z in done:
            print(f'  {z:18s} {len(done[z]):5d}  (déjà en cache)', flush=True)
            continue
        url = f'https://shotgun.live/en/cities/{z}?page=40'
        p = subprocess.run(['curl', '-sS', '-A', 'ClaudeBot/1.0', '--max-time', '120', url],
                           capture_output=True, text=True)
        html = p.stdout or ''
        n = 0
        for m in CARD.finditer(html):
            alt = m.group(2)
            venue = alt.split('—')[-1] if '—' in alt else ''
            idx.append(dict(path=m.group(1), alt=alt, zone=z, date=m.group(3),
                            title=alt.split('—')[0].strip(),
                            venue=venue.split(',')[0].strip()))
            n += 1
        print(f'  {z:18s} {n:5d}', flush=True)
        json.dump(idx, open('sg-index.json', 'w'), ensure_ascii=False)
        time.sleep(2)
    json.dump(idx, open('sg-index.json', 'w'), ensure_ascii=False)
    print(f'\nindex Shotgun : {len(idx)} dates sur {len(CITIES)} zones')

build()
