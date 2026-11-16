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

## 2. Needed (status updated 15 Nov)

| Data | Best source | Access | Coverage / quality | Licence | Status |
|---|---|---|---|---|---|
| Elevation (ground shape) | USGS 3D Elevation Program (3DEP) lidar, 1 m bare-earth DEM | USGS LidarExplorer / The National Map download (manual: neither Claude's workspace nor the Mac shell can reach it) | Barnstable County lidar 2010 at 1 m; newer quality-level-1 lidar statewide in Massachusetts | Public domain (USGS) | **Obtained for Hole 2's area (§2b)**; other holes: extract per §5a of HOLE_BUILD_STANDARD |
| Tree positions | Lidar canopy height (first-return surface minus bare earth) from the same lidar | same | Shows real trees and wood edges at about 1 m | Public domain | Not used (point cloud not reachable; §2c). Replaced by 2023 imagery canopy |
| Tree areas (fallback) | MassGIS 2016 Land Cover/Land Use (1 m, has a tree class) | MassGIS download | 2016 imagery, may be out of date | MassGIS public data | Optional |
| OSM woods / tree rows | Fresh OSM extract (Overpass) | Reachable from the Mac's browser pane (done 15 Nov) | 4 wood areas near the course | ODbL | Cross-check only (§2c) |
| Post-restoration bunker/tee outlines | (a) newer aerial imagery review; (b) on-course GPS capture; (c) updated OSM | (a) Google Earth Pro; (b) V3 test page; (c) OSM | (b) is ±3–5 yd per point with a phone | own data | **Needed for checkpoint B** |
| Forward-tee positions | On-course GPS capture | V3 test page | ±3–5 yd | own data | Needed for tee markers |


## 2a. Elevation research (15 Nov 2026): reported, not yet used

| | |
|---|---|
| Best candidate | **2021 USGS Lidar: Central Eastern Massachusetts** (USGS 3DEP project MA_CentralEastern_2021_B21), collected by NV5 Geospatial |
| Quality | Quality Level 1. Bare-earth DEM at 0.5 m ground sample distance, hydro-flattened. QL1 = 3DEP's second-highest level: vertical accuracy ≤10 cm RMSE in open ground, at least 8 points per m² |
| When flown | 20 Mar – 24 Apr 2021 (leaf-off spring) |
| Coverage | Most of eastern Massachusetts, co-funded by the Cape Cod Commission. The published extent (41.22–42.90 °N, 72.05–69.92 °W) contains Pocasset. **To confirm:** the exact tile over Hole 2 on the MassGIS tile index |
| Where | MassGIS "Latest and Best Lidar Terrain Data": 32-bit DEM tiles (0.5 or 1 m) downloaded per tile from MassMapper (Identify → Latest and Best Lidar Index → tile link). Also USGS LidarExplorer / The National Map (point cloud and DEM) |
| Licence | US government / Commonwealth public data, free to reuse |
| Fallback | 2010 Barnstable County ARRA lidar, 1 m (vertical accuracy about 18 cm at 95%), superseded by 2021 |

### Caveats before use
1. **The lidar predates the restoration.** It shows the 2021 ground, before the recent reconstruction of every bunker and tee.
   - **Use it for:** the broad shape of the land (slopes, rises, hollows), which a bunker and tee rebuild does not change.
   - **Do not use it for:** bunker or tee shapes, which stay from the mapped outlines.
2. **Trees from the same lidar are 2021 trees.** Restorations often remove trees. Every lidar-derived tree area must be checked against current imagery before it is drawn.
3. **Datum:** heights are in NAVD88 (GEOID18). Only relative heights matter for shading, so the datum does not affect the picture.

### Proposed use, once approved
1. Download the one or two tiles covering Hole 2 into `data/sources/elevation/` inside the V3 folder only. Lock the checksum in `SOURCES.lock.json`.
2. Clip them to the hole.
3. Use them for the render's height grid, replacing the cosmetic flat ground. The positions of features do not change: outlines stay where the coordinates put them.

**Status (updated 15 Nov 2026):** approved by the owner and obtained. See §2b. The research above is kept as written.

## 2b. Elevation: 2021 USGS lidar (in use)

| | |
|---|---|
| Dataset | USGS 3D Elevation Program (3DEP) 1 m bare-earth DEM, project **MA_CentralEastern_2021_B21** (same lidar collection as MassGIS "Latest and Best"). Tile `USGS_1M_19_x36y462` |
| Survey date | Flown **20 Mar – 24 Apr 2021** (leaf-off spring) |
| Quality / accuracy | **QL1** under the USGS Lidar Base Specification: vertical RMSEz ≤ 10 cm on open ground (non-vegetated vertical accuracy ≤ 19.6 cm at 95%), ≥ 8 points/m². Horizontal accuracy is reported per project in its metadata (not retrieved here; for QL1 projects it is typically under 1 m). Our own check: every Hole 2 tee is flat to ≤ 0.15 m and the pond outline sits on the flat water surface (sd 0.07 m), so registration with the course map is within the 2 m grid |
| Coordinate system | Horizontal **EPSG:6348**, NAD83(2011) / UTM zone 19N, metres. Vertical **NAVD88 (GEOID18)**, metres |
| Resolution | Native 1 m. Stored in V3 at **2 m** (mean of 2×2 native cells), heights to 0.1 m. Good for landform; not for small features |
| Coverage in V3 | 616 × 844 m around Hole 2 and its neighbours (UTM E 365455–366071, N 4616274–4617118). Elevations 1.5–21.4 m. **Other holes need their own extract** (HOLE_BUILD_STANDARD.md §5a) |
| How obtained | The Mac's built-in browser (the cloud workspace cannot reach USGS): `exportImage` on the USGS 3DEPElevation ImageServer, locked to raster 70295, 616 × 844 px at 1 m, float32 TIFF (2,295,241 bytes, SHA-256 54d79025…). Encoded in the browser (2 m mean → decimetres → row-differences → gzip → base64), carried over in two parts, SHA-256 of the transfer text checked (4209e07d…) and decoded. Exact request in `SOURCES.lock.json` |
| File | `data/sources/elevation/usgs3dep_2021_pocasset_hole02_2m.dm16.gz` (51,799 bytes; format in `tools/terrain.py`), checksum-locked |
| Licence | US Government work (USGS), public domain. Credit: U.S. Geological Survey, 3D Elevation Program |
| Limitations | **Before the restoration:** shows 2021 ground; the rebuilt bunkers and tees may differ. Used for the general shape of the land only; bunker and tee shapes come from the outlines. Water is hydro-flattened. Bare earth (no trees or buildings). Course outlines are WGS84 (OSM) and the lidar NAD83(2011); about 1–1.5 m apart here, not corrected (below the grid size). **Never used for distances or for the approved greens** |
| Derived | `data/holes/hole02/terrain.json`: 2 m grid in the hole frame (`tools/terrain.py grid`). `checks/terrain_check.md` and `terrain_registration.png`: QA |

## 2c. Woods: tree canopy from 2023 aerial imagery (in use, ILLUSTRATIVE)

**Sources investigated:**

| Source | Result |
|---|---|
| OpenStreetMap (`natural=wood`, `natural=tree`, `landuse=forest`) via Overpass | 3 wood polygons + 1 wood multipolygon near the course (ways 1241472152/53/54, relation 19103516; same mapper as the course). No individual trees. Useful cross-check, not complete |
| Lidar canopy (first-return surface minus ground) | Best in principle, but 3DEP serves only bare earth as an image service; the point cloud is LAZ (cannot be decoded in the browser bridge). Also 2021, before any tree work. Not used |
| MassGIS 2016 Land Cover (1 m) | Older than the imagery below. Not used |
| **USDA NAIP aerial imagery, 22 Aug 2023, 0.3 m, colour + infrared** (USGS NAIPPlus ImageServer, tiles m_4107020_nw/sw_19_030_20230822) | **Used.** Newest public imagery over the course; leaf-on with an infrared band |

**Method** (`tools/canopy_browser.js`, run in the Mac's browser): imagery resampled to 1 m on the lidar grid; a pixel is canopy if, averaged over 5 × 5 m, vegetation index NDVI > 0.19, brightness texture > 14 and brightness < 140 (tree crowns are vegetated, textured and darker; mown grass is smooth); 7 × 7 m majority filter; stored as 2 m cells counting canopy 1 m cells (0–4). File `data/sources/canopy/naip2023_canopy_pocasset_hole02_2m.u8.gz`, checksum-locked.

**Visual check:** the mask covers the woods along the railway, the wooded strips between holes and the clumps right of Hole 2's fairway, and leaves fairways, greens and rough clear (owner can re-check in the 2023 imagery).

**Rules for use:**
1. Woods are drawn only where this grid shows canopy, and **never on a mapped playing surface + 2 m**.
2. Individual crowns, tree height (13 m nominal), shapes and colours are **illustrative**, and the app says so.
3. The imagery is from 2023, before the restoration; trees removed since then may still be drawn. If the owner reports a cleared area, remove it with a documented correction (never by editing the grid).
4. It is not a hazard and is never used for distances or yardage advice.

## 2d. Preliminary imagery and lidar check of Hole 2 (15 Nov 2026), NOT verification

Outlines drawn over the 2023 NAIP image (0.3 m) and compared with the 2021 lidar:

| Feature | 2023 imagery | 2021 lidar | Note |
|---|---|---|---|
| Green H02-GR-01 | Matches the mown green | flat (sd 0.08 m) | |
| Bunkers H02-BK-01, BK-02 | Match sand areas in 2023 | — | Pre-restoration image; rebuilt shapes may differ |
| Pond H02-WA-01 | Matches the water | flat water surface (sd 0.07 m) | |
| Tees TE-01 (Gold), TE-02 (Blue) | Match visible tee boxes | flat platforms | |
| **TE-03 Green/White candidate** | Image too soft to see the box edges | **flat platform (sd 0.06 m), 0.35 m above surrounding ground** | Distance 367 yd vs card 368. Still a **candidate**: needs on-course or current-imagery confirmation |
| TE-04 Bronze candidate | Image too soft | flat platform (sd 0.06 m), 0.32 m raised | 344 yd vs card 349 |

These checks raise confidence but do not satisfy HOLE_VALIDATION.md: imagery predates the rebuild. `verification.json` is unchanged (owner's record).

## 2e. Course-area grids for Holes 1 and 5–9 (15 Nov 2026, in use)
Same survey, classifier and imagery as §2b and §2c, for a second area (EPSG:6348 bbox 365620,4615710 – 366398,4616592; 389×441 cells at 2 m):
- **Elevation:** `elevation/usgs3dep_2021_pocasset_course_2m.dm16.gz` (sha256 8e7a63b5…). Native 1 m export 3,212,857 bytes, sha256 5a7d9e4d…, heights 4.49–22.45 m, no gaps. Carried over as base64 (sha256 adf72d74…, verified), then losslessly re-encoded to the Hole 2 grid's format.
- **Canopy (illustrative):** `canopy/naip2023_canopy_pocasset_course_2m.u8.gz` (sha256 cd90da31…). Same NAIP tiles as Hole 2 (22 Aug 2023); `tools/canopy_browser.js` unchanged except the bounding box; 54.5% of the area classed as canopy.
- **Which grid a hole uses:** the first locked grid (lock order) whose coverage box holds every mapped point of the hole. Holes 2–4 keep the Hole 2 grid, so Hole 2's approved renders stay byte-identical; Holes 1, 5–9 use the course-area grids.
- Holes 10–18 lie outside both areas and need a third download.

## 2f. Lidar-derived features (15 Nov 2026, in use)
`derived/lidar_derived_features.geojson` (locked, role `derived_features`) holds features missing from the OSM source, each with its evidence. `pcv3.py course_features()` merges them at read time; the OSM file is never edited. Standardized features carry `source.file`, `source.evidence` and `assignment: derived (traced from lidar …)`.
- **H08-WA-01, Hole 8 pond** — owner-reported; 2021 lidar basin with a dead-flat floor at 5.0 m (water surface), ~28 x 44 m (~1,000 m2), 25–45 m in front of the tees. Outline: connected cells within 0.15 m of the flat surface, smoothed. Approximate, unverified.

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
| Elevation | — (to download) | USGS 3DEP lidar / 1 m DEM (Barnstable County 2010 ARRA lidar; newer QL1 statewide) | Public domain (USGS) | Not yet downloaded *(superseded: in use, §2b)* |
| Trees | — (to derive) | Lidar canopy height (DSM − DTM); fallback MassGIS 2016 Land Cover (1 m, tree class) | Public | Not yet downloaded *(superseded: 2023 NAIP canopy in use, §2c)* |
| Approved greens | — (to copy) | Mac master `03_greens/hole_NN/approved/` | Project asset (GolfLogix-derived imagery, already public on GitHub Pages by owner decision 26 Oct) | Copy byte-for-byte, checksum-locked |
| Scorecard (pars, tee yardages) | — (to port) | V2.2.1 `index.html` | Project data | |
