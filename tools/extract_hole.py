"""Extract one hole's mapped features from the course GeoJSON (read-only source) into a hole package.
Usage: python3 -I tools/extract_hole.py data/sources/pocaset-GEO.json 2 data/holes/hole02
Writes features.geojson (the hole's own features, unchanged coordinates) and hole02_check.kml
(open in Google Earth to compare the mapped outlines with current aerial imagery)."""
import json, sys, os
src, hole, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
D = json.load(open(src))
feats = [f for f in D['features'] if hole in (f['properties'].get('holes') or [])]
os.makedirs(out, exist_ok=True)
fc = {'type': 'FeatureCollection',
      'metadata': {'hole': hole, 'extracted_from': os.path.basename(src), 'source_metadata': D.get('metadata'),
                   'note': 'Coordinates copied unchanged. verified=false on every feature: field/imagery check pending.'},
      'features': feats}
json.dump(fc, open(f'{out}/features.geojson', 'w'), indent=1)
style = {'green': 'ff4da33f', 'fairway': 'ff6ac47c', 'tee': 'ff9ad9a7', 'bunker': 'ffb0e2f1', 'water': 'ffe8b66f', 'path': 'ffcccccc', 'hole': 'ffffffff'}
pm = []
for f in feats:
    L = f['properties']['layer']; g = f['geometry']; c = style.get(L, 'ff888888')
    name = f"{L} {f['properties'].get('osm_id', '')}"
    if g['type'] == 'Polygon':
        coords = ' '.join(f'{x},{y},0' for x, y in g['coordinates'][0])
        pm.append(f'<Placemark><name>{name}</name><Style><LineStyle><color>{c}</color><width>3</width></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style><Polygon><outerBoundaryIs><LinearRing><coordinates>{coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>')
    elif g['type'] == 'LineString':
        coords = ' '.join(f'{x},{y},0' for x, y in g['coordinates'])
        pm.append(f'<Placemark><name>{name}</name><Style><LineStyle><color>{c}</color><width>2</width></LineStyle></Style><LineString><coordinates>{coords}</coordinates></LineString></Placemark>')
open(f'{out}/hole{hole:02d}_check.kml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
    f'<name>Pocasset Hole {hole} — mapped outlines (OSM via zommagolf, unverified)</name>' + ''.join(pm) + '</Document></kml>\n')
print(len(feats), 'features written to', out)
