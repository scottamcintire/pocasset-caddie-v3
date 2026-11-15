# Data sources

*Every geographic and course data source V3 uses or may use: how to get it, what it covers, its licence, and known problems. The summary table from 15 Nov (first version) is kept unchanged in §6.*

## 1. In use

### 1.1 Course features: `data/sources/pocaset-GEO.json`

| | |
|---|---|
| Origin | zommagolf course GeoJSON for `ma/pocasset-golf-club`, built from OpenStreetMap (OSM). Metadata: traced 2026-08-17, 237 elements |
| How we got it | Copy of `Pocasset_AI_Master/02_course_sources/geojson/pocaset-GEO.json` on the Mac. SHA-256 8222dec0… matches the master checksum list. zommagolf.com itself could not be reached from Claude's workspace |
| Coverage | 18 greens, 25 fairways, 53 tees, 83 bunkers, 2 water, 33 cart-path segments, 18 playing lines, 4 pin points, 1 course boundary. **No trees/woods, no rough outlines, no elevation** |
| Licence | **ODbL-1.0, © OpenStreetMap contributors**, share-alike. V3 must show the attribution. A database derived from it (our standardized features) stays ODbL. App code and artwork can keep their own licence. *(Standard reading of ODbL; not legal advice.)* |
| Known problems | Every feature `verified: false`. Pocasset **rebuilt every bunker and tee** in a recent restoration (Mass Golf, Aug 2026; massgolf.org "Pocasset Selected To Host 118th Massachusetts Open"); bunker ways were drawn in one batch (version 1), so they may show the old layout. Forward tee sets are mostly not mapped (Hole 2: only Gold and Blue). Feature-to-hole assignment comes from the source |
| Accuracy so far | Greens: used by production GPS since V2.2.1; the approved pin models agree with EZLocator dots to within about 0.1–1.2 yd. Hole 2 tees: 462 yd vs Gold 463, 422 yd vs Blue 424 (along the playing line) |

### 1.2 Scorecard: `data/course/course.json`
Pars and yards for six tee sets (Gold, Blue, Green, White, Bronze, Silver), taken from production V2.2.1 `index.html` (SHA-256 0f4d7ffe…). Public listings (GolfPass) agree on the totals for the tees they show.

### 1.3 Approved greens: `data/greens/approved_manifest.json`
See GREEN_ASSET_PROTECTION.md. Project assets derived from GolfLogix heat maps; already public on GitHub Pages by owner decision (26 Oct 2026).

## 2. Needed, not yet obtained

| Data | Best source | Access | Coverage / quality | Licence | Status |
|---|---|---|---|---|---|
| Elevation (ground shape) | USGS 3D Elevation Program (3DEP) lidar, 1 m bare-earth DEM | USGS LidarExplorer / The National Map download (manual: neither Claude's workspace nor the Mac shell can reach it) | Barnstable County lidar 2010 at 1 m; newer quality-level-1 lidar statewide in Massachusetts | Public domain (USGS) | **Download needed** |
| Tree positions | Lidar canopy height (first-return surface minus bare earth) from the same lidar | same | Shows real trees and wood edges at about 1 m | Public domain | **Download needed** |
| Tree areas (fallback) | MassGIS 2016 Land Cover/Land Use (1 m, has a tree class) | MassGIS download | 2016 imagery, may be out of date | MassGIS public data | Optional |
| OSM woods / tree rows | Fresh OSM extract (Overpass) | Not reachable from Claude's workspace or the Mac shell | Unknown for the course | ODbL | Optional |
| Post-restoration bunker/tee outlines | (a) newer aerial imagery review; (b) on-course GPS capture; (c) updated OSM | (a) Google Earth Pro; (b) V3 test page; (c) OSM | (b) is ±3–5 yd per point with a phone | own data | **Needed for checkpoint B** |
| Forward-tee positions | On-course GPS capture | V3 test page | ±3–5 yd | own data | Needed for tee markers |

## 3. Checked and not used
- **OpenYardage:** builds yardage books from OSM, so it holds the same data (no new data).
- **GolfLogix, ezLocator, commercial GPS apps:** not licensed for reuse of their geometry. ezLocator *pin numbers* are entered by the owner daily.
- **AI-generated hole artwork:** not geographic; textures only (ARCHITECTURE.md §2).

## 4. Conversion (raw → standard)
`tools/pcv3.py standardize --hole N`:
1. Checks the source checksum.
2. Copies the hole's features unchanged into `source/source_extract.geojson`.
3. Writes `features.geojson` with standard properties (HOLE_BUILD_STANDARD.md §3).
4. Writes `hole.json`.

Coordinates are never modified.

## 5. Adding a new source
1. Put the file in `data/sources/`.
2. Add an entry to `SOURCES.lock.json`: file, role, sha256, origin, licence, date.
3. Add a row here.
4. Record the change in CHANGELOG.md.

A source is never edited after it is locked; a corrected source is a new file.

## 6. First summary table (15 Nov 2026, kept as written)

| Data | File | Origin | Licence | Status |
|---|---|---|---|---|
| Course features (greens, fairways, tees, bunkers, water, cart paths, playing lines) | `data/sources/pocaset-GEO.json` (copied unchanged from Mac master `02_course_sources/geojson/`) | zommagolf course GeoJSON, built from OpenStreetMap; traced 2026-08-17 | ODbL-1.0, © OpenStreetMap contributors (share-alike) | All features `verified: false`. Pocasset rebuilt every bunker and tee recently (Mass Golf, Aug 2026), so bunkers/tees must be checked |
| Hole 2 extract | `data/holes/hole02/features.geojson`, `hole02_check.kml` | `tools/extract_hole.py` from the file above; coordinates unchanged | ODbL-1.0 | Awaiting aerial/field check |
| Elevation | — (to download) | USGS 3DEP lidar / 1 m DEM (Barnstable County 2010 ARRA lidar; newer QL1 statewide) | Public domain (USGS) | Not yet downloaded |
| Trees | — (to derive) | Lidar canopy height (DSM − DTM); fallback MassGIS 2016 Land Cover (1 m, tree class) | Public | Not yet downloaded |
| Approved greens | — (to copy) | Mac master `03_greens/hole_NN/approved/` | Project asset (GolfLogix-derived imagery, already public on GitHub Pages by owner decision 26 Oct) | Copy byte-for-byte, checksum-locked |
| Scorecard (pars, tee yardages) | — (to port) | V2.2.1 `index.html` | Project data | |
