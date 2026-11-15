# Data sources

| Data | File | Origin | Licence | Status |
|---|---|---|---|---|
| Course features (greens, fairways, tees, bunkers, water, cart paths, playing lines) | `data/sources/pocaset-GEO.json` (copied unchanged from Mac master `02_course_sources/geojson/`) | zommagolf course GeoJSON, built from OpenStreetMap; traced 2026-08-17 | ODbL-1.0, © OpenStreetMap contributors (share-alike) | All features `verified: false`. Pocasset rebuilt every bunker and tee recently (Mass Golf, Aug 2026), so bunkers/tees must be checked |
| Hole 2 extract | `data/holes/hole02/features.geojson`, `hole02_check.kml` | `tools/extract_hole.py` from the file above; coordinates unchanged | ODbL-1.0 | Awaiting aerial/field check |
| Elevation | — (to download) | USGS 3DEP lidar / 1 m DEM (Barnstable County 2010 ARRA lidar; newer QL1 statewide) | Public domain (USGS) | Not yet downloaded |
| Trees | — (to derive) | Lidar canopy height (DSM − DTM); fallback MassGIS 2016 Land Cover (1 m, tree class) | Public | Not yet downloaded |
| Approved greens | — (to copy) | Mac master `03_greens/hole_NN/approved/` | Project asset (GolfLogix-derived imagery, already public on GitHub Pages by owner decision 26 Oct) | Copy byte-for-byte, checksum-locked |
| Scorecard (pars, tee yardages) | — (to port) | V2.2.1 `index.html` | Project data | |
