#!/usr/bin/env python3
"""Öffnungszeiten aus dem Google-Unternehmensprofil holen (Places API New) und als JSON ablegen.
Läuft nachts als GitHub-Aktion. Umgebung: GOOGLE_PLACES_KEY (Secret), PLACE_ID, ZIEL (Standard daten/oeffnungszeiten.json).
Fehler ändern nie etwas: dann bleibt die letzte gute Datei stehen und die Seite zeigt ihre eingebauten Zeiten bzw. die letzten bekannten."""
import json, os, sys, urllib.request, datetime

KEY = os.environ.get('GOOGLE_PLACES_KEY', '').strip()
PID = os.environ.get('PLACE_ID', '').strip()
ZIEL = os.environ.get('ZIEL', 'daten/oeffnungszeiten.json')
if not KEY or not PID:
    print('Kein Schlüssel oder keine PLACE_ID – nichts zu tun.'); sys.exit(0)

try:
    req = urllib.request.Request(f'https://places.googleapis.com/v1/places/{PID}?languageCode=de',
        headers={'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'displayName,businessStatus,regularOpeningHours,currentOpeningHours'})
    d = json.load(urllib.request.urlopen(req, timeout=30))
except Exception as e:
    print('Google nicht erreichbar oder Fehler:', e); sys.exit(0)

hm = lambda p: f"{p.get('hour', 0):02d}:{p.get('minute', 0):02d}"

def intervalle(periods):
    """→ Liste (tagIndex Mo=0, datum|None, [von, bis]); über Mitternacht endet am Tag bei 24:00."""
    out = []
    for p in periods or []:
        o, c = p.get('open', {}), p.get('close')
        i = (o.get('day', 0) + 6) % 7
        dt = o.get('date')
        iso = f"{dt['year']:04d}-{dt['month']:02d}-{dt['day']:02d}" if dt else None
        if not c:  # rund um die Uhr
            return [(k, None, ['00:00', '24:00']) for k in range(7)]
        bis = hm(c) if c.get('day') == o.get('day') else '24:00'
        out.append((i, iso, [hm(o), bis]))
    return out

reg = d.get('regularOpeningHours') or {}
cur = d.get('currentOpeningHours') or {}
if not reg.get('periods') and d.get('businessStatus') == 'OPERATIONAL':
    print('Google liefert keine Zeiten – Datei bleibt unverändert.'); sys.exit(0)

woche = [[] for _ in range(7)]
for i, _, z in intervalle(reg.get('periods')):
    woche[i].append(z)
for w in woche: w.sort()

tage = {}
heute = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).date()
for k in range(7):  # jeder der nächsten 7 Tage bekommt einen Eintrag, auch „geschlossen“ (Feiertage)
    tage[(heute + datetime.timedelta(days=k)).isoformat()] = []
for i, iso, z in intervalle(cur.get('periods')):
    if iso and iso in tage: tage[iso].append(z)
for v in tage.values(): v.sort()
sonder = sorted({f"{x['date']['year']:04d}-{x['date']['month']:02d}-{x['date']['day']:02d}" for x in cur.get('specialDays', []) if x.get('date')})
if not cur.get('periods'): tage = {}

neu = {'quelle': 'Google-Unternehmensprofil', 'name': (d.get('displayName') or {}).get('text', ''),
       'status': d.get('businessStatus', ''), 'woche': woche, 'tage': tage, 'sondertage': sonder,
       'texte': reg.get('weekdayDescriptions', [])}
alt = {}
if os.path.exists(ZIEL):
    try: alt = json.load(open(ZIEL))
    except Exception: alt = {}
if {k: v for k, v in alt.items() if k != 'stand'} == neu:
    print('Keine Änderung.'); sys.exit(0)
neu['stand'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
os.makedirs(os.path.dirname(ZIEL) or '.', exist_ok=True)
json.dump(neu, open(ZIEL, 'w'), ensure_ascii=False, indent=1)
print('Aktualisiert:', json.dumps(woche))
