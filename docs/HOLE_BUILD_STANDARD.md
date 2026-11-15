# Hole Build Standard (V3)

*The approved, repeatable process for building one Pocasset hole in V3. Version 0.1, 15 Nov 2026: a draft. It is being proven on Hole 2 and is not yet approved.*

The goal is that "Build Hole N using our approved process" means running the steps below. A hole is never approved because it looks good. It is approved only when checkpoints A–F (in [HOLE_VALIDATION.md](HOLE_VALIDATION.md)) all pass.

---

## 1. Ground rules

1. **Never invent a feature.**
   - If a bunker, tree, tee or slope has no source, it is left out and listed as missing.
   - The renderer may add *texture* (grass, sand grain, leaves), but never *position* or *shape*.
2. **Source files are read-only.**
   - They live in `data/sources/`, and each one is locked by SHA-256 in `SOURCES.lock.json`.
   - The tools stop if a source has changed.
3. **Geometry is copied, not edited.**
   - If an outline is wrong, the fix is a new source version, such as a corrected OSM extract or a field-surveyed outline, recorded in `DATA_SOURCES.md`.
   - Nobody edits coordinates by hand.
4. **Stable IDs.** Every feature gets an ID like `H02-BK-01` the first time it is seen (`ids.json`). IDs are never renumbered or reused.
5. **Manual records are never overwritten by tools.** These are `status.json`, `verification.json` and `camera.json`.
6. **Approved versions are frozen.** `approved/vN/` folders are append-only, with checksums in `MANIFEST.json`. To revert a hole, its app config is pointed back at an earlier `vN`.
7. **Approved greens are protected.** See [GREEN_ASSET_PROTECTION.md](GREEN_ASSET_PROTECTION.md). The flyover build never reads them for writing, and never regenerates, recolours or moves them.
8. **Production is out of scope.** No step touches the `pocasset_caddie` repository or its website.

---

## 2. Coordinate reference system

| Use | System |
|---|---|
| Storage (all `.geojson`) | WGS84 longitude/latitude, EPSG:4326 (GeoJSON RFC 7946), copied unchanged from source |
| Calculations and rendering | **Hole frame**, metres. Origin = mean of the green outline's points including the closing point; **v** = along the last leg of the playing line toward the green; **u** = golfer's right. Equirectangular, Earth radius 6,371,008.8 m |

The hole frame is **identical to the frame the approved greens' pin model already uses** (V2.3.1 / `build_data.py`). The flyover, GPS distances and the green's orange flag therefore all share one coordinate system with no extra fitting. Within a 500 m hole the equirectangular error is far below 1 cm.

---

## 3. Standard per-hole data structure

```
data/
  sources/                     read-only inputs + SOURCES.lock.json (checksums, licence, origin)
  course/course.json           pars, scorecard yards for 6 tee sets, approved-green record per hole
  greens/approved_manifest.json   SHA-256 of every approved green file in the Mac master (112 files)
  holes/holeNN/
    hole.json                  GENERATED  hole summary (schema pocasset-v3/hole@1)
    features.geojson           GENERATED  standardized features (below)
    ids.json                   GENERATED, append-only  stable feature IDs
    source/source_extract.geojson   GENERATED  exact copy of this hole's source features
    source/initial_*/          preserved first extracts (history)
    checks/check_report.md     GENERATED  automated QA report + distance table
    checks/holeNN_check.kml    GENERATED  outlines for Google Earth comparison
    checks/holeNN_topdown.svg  GENERATED  top-down drawing in the hole frame
    status.json                MANUAL     stage + checkpoints A–F
    verification.json          MANUAL     one record per feature check (imagery or on-course)
    camera.json                MANUAL     flyover camera settings (Tee / Approach views) — Stage 4
    source_corrections.json    MANUAL     documented hole re-assignments of source features (below)
    terrain.json               GENERATED  2 m height grid in the hole frame from the locked lidar (tools/terrain.py grid)
    checks/terrain_check.md, terrain_registration.png   GENERATED  lidar QA
    render/                    GENERATED  flyover images, projection data, material IDs, alignment images
    render/v0.1/               preserved earlier renders (history)
    approved/vN/               FROZEN     promoted versions with MANIFEST.json
```

### `features.geojson` (one Feature per mapped object)

| Property | Meaning |
|---|---|
| `id` | Stable ID `H{hole}-{class code}-{nn}`. Codes: TE tee, FW fairway, GR green, BK bunker, WA water, CP cart path, TR trees, CL centerline |
| `class` | tee, fairway, green, bunker, water, path, trees, centerline |
| `along_m` | Distance along the playing line from the back of the line to the feature's centre projection |
| `offset_m` | Perpendicular distance from the playing line |
| `position` | Hazards only: `across` (crosses the playing line), `green-front` / `green-front-left` / … (within 40 m of the green), or `L` / `R` of the playing line |
| `geometry_status` | `unverified` (as delivered by the source), `approximate`, `verified`, or `wrong`. The last three are set only from `verification.json` |
| `source` | `{file, ref (e.g. osm:way/1241445310), osm_version, licence}` |
| `measured_yards`, `tee_sets` | Tees only: yards along the playing line to green centre, and which scorecard sets they match (within 10 yd) |

### `hole.json`
- **Identity:** hole, par, scorecard yards.
- **Frame:** the frame definition and values (origin, bearing).
- **Geometry summary:** centerline length, tees (with matched tee sets), tee sets not mapped, and counts by class.
- **Gaps:** `missing.not_in_source`, `missing.not_yet_sourced`, and the number of unverified features.
- **Links:** the approved green asset record.
- **Provenance:** source checksum and generation date.

Missing information is always explicit, at three levels:
1. **Feature level:** `geometry_status`.
2. **Hole level:** the `missing` lists and the tee sets without a mapped tee.
3. **Inventory level:** [HOLE_PROGRESS.md](HOLE_PROGRESS.md).

---

## 4. The process for one hole

| Step | What happens | How | Automated? |
|---|---|---|---|
| 1. Standardize | Extract the hole's features from the locked source, assign stable IDs, compute along/offset/position, match tees to the scorecard, write `features.geojson` + `hole.json` | `python3 -I tools/pcv3.py standardize --hole N` | ✔ automatic |
| 2. Auto-check | Completeness, geometry sanity (self-intersections, sizes, centerline ends on green), tee-vs-card, unverified count, green-asset record; reach/carry table from each mapped tee | `python3 -I tools/pcv3.py check --hole N` (exit code 1 = STOP) | ✔ automatic |
| 3. Imagery review | Open `checks/holeNN_check.kml` in Google Earth Pro; compare every bunker, tee, green and water outline with the newest imagery (note its date) | Owner or Claude with owner | ✋ manual |
| 4. Record verification | One entry per feature in `verification.json`: verified / approximate / wrong, method, date, error in yards | Edit file (Claude can do it from your notes) | ✋ manual |
| 5. Fix data gaps | Wrong or missing outlines → corrected source (new OSM extract or field GPS capture) → back to step 1. Never hand-edit coordinates | | ✋ manual decision, then automatic |
| 6. Terrain + woods | Check the hole lies inside the locked lidar and canopy grids (else extract the next tile, §5a); `terrain.py check` (tees/greens on flat platforms, water flat; look at the registration image); `terrain.py grid` writes `terrain.json`. Woods come from the locked canopy grid at render time (illustrative) | `python3 tools/terrain.py check --hole N` then `grid --hole N` | ✔ automatic once the grids cover the hole (extraction is a browser step) |
| 7. Camera | Tee and Approach camera settings in `camera.json` (position, target, height, field of view) | Start from an auto-suggested default from the hole frame; adjust | ◐ semi |
| 8. Render | Same renderer for every hole; style from one shared style file; writes images, projection data (camera matrix + height model), material IDs | `python3 tools/render_flyover.py --hole N` | ✔ automatic |
| 9. Overlay alignment test | Points inside every hazard/green outline projected exactly as the app does must land on that surface (material ID + colour, ≥95%; points behind illustrative woods reported); browser projection = renderer projection; tap round trip | `python3 tests/test_alignment.py --hole N`, `node tests/test_prototype.js` | ✔ automatic |
| 10. Visual review | Owner compares with the style reference and with the real hole | | ✋ manual (checkpoint C) |
| 11. GPS validation | Simulated positions along the hole: front/center/back identical to the production method; hazard reach/carry match hand calculations; then an on-course check | tests + course | ◐ automatic + manual (D) |
| 12. Green check | Approved green files match the manifest; flag positions match the approved pages | `pcv3.py verify-greens --master …` + tests | ✔ automatic (E) |
| 13. iPhone test | V3 test site on the iPhone (after publishing is approved) | | ✋ manual (F) |
| 14. Promote | Freeze the approved data + renders | `pcv3.py promote --hole N --label "…"` | ✔ automatic, run only after approval |
| 15. Inventory | Refresh the 18-hole table | `pcv3.py inventory` | ✔ automatic |

**Batch mode (later):** steps 1, 2, 6, 8, 9, 12 and 15 can run for many holes in one go. Every hole still stops at steps 3–5, 10, 11, 13 and 14 for a human decision. A STOP in step 2, or a missing source, ends that hole's batch run instead of guessing.

**Regenerating an approved hole:**
- Re-running steps 1, 2 and 8 writes only GENERATED files, and the reproducibility test proves identical output from identical input.
- Approved versions in `approved/vN/` are never touched.
- A new approval becomes `vN+1`.

### Source corrections (`source_corrections.json`)
When the source files a feature under the wrong hole (Hole 2: the Green/White and Bronze tees were tagged as Hole 4), the feature is **re-assigned, never edited or copied by hand**:
1. Record it in `data/holes/holeNN/source_corrections.json`: the source ref (`osm:way/…`), what the source said, status (`approximate`), and the evidence (distances to each hole's line, scorecard match).
2. `standardize` merges it: the geometry is taken unchanged from the locked source; the feature gets `assignment: "corrected (…)"` and stays `unverified` until checked.
3. The app marks such tees as **candidate**. They become plain tees only after a verification record (imagery dated after the rebuild, or on-course GPS).

---

## 5. Commands (from the project folder)

```
python3 -I tools/pcv3.py standardize --hole 2
python3 -I tools/pcv3.py check --hole 2
python3 -I tools/pcv3.py inventory
python3 -I tools/pcv3.py verify-greens --master "/Users/scott/Documents/Pocasset AI Caddie/Pocasset_AI_Master"
python3 -I tools/pcv3.py promote --hole 2 --label "flyover v1 approved"
python3 -I tools/pcv3.py files
python3 -I tests/test_tools.py
python3 tools/terrain.py check --hole 2
python3 tools/terrain.py grid --hole 2
python3 tools/render_flyover.py --hole 2
python3 tests/test_alignment.py --hole 2
python3 -I tools/build_prototype.py --hole 2
HOLE=2 node tests/test_prototype.js        # release test for any hole (HOLE=N)
python3 tools/make_camera.py --hole 2        # approved camera pattern scaled by hole length (never overwrites without --force)
python3 -I tools/build_site.py --holes 1 2 3 # test site; statuses from data/release/status.json
```
Release procedure, rollback and the central progress table: docs/RELEASES.md.

`pcv3.py` uses only Python's standard library (3.9+), so it runs on the Mac with its built-in `python3`, with nothing to install. `terrain.py` needs numpy; the renderer needs numpy, scipy and opencv (all in Claude's workspace).

### 5a. Elevation and canopy for other holes (repeatable browser step)
The cloud workspace cannot reach USGS, so grids are fetched in the Mac's browser pane and carried over as checksummed text:
1. **Area:** the hole's features + 150 m, in EPSG:6348 (UTM 19N) metres (`terrain.utm_bounds_uv` / `ll_to_utm`). One extract can cover several neighbouring holes.
2. **Elevation:** on any `elevation.nationalmap.gov` page, find the 3DEP tile's raster id (`/query` with the bbox), then `exportImage` (bbox, `bboxSR=6348`, 1 m size, `pixelType=F32`, `format=tiff`, lockRaster mosaic rule). Read the TIFF, block-mean to 2 m, encode as in DATA_SOURCES.md §2b, record the SHA-256 of the base64 text, transfer in parts, verify, decode.
3. **Canopy:** on an `imagery.nationalmap.gov` or `*.nationalmap.gov` page, set BBOX and RASTERS in `tools/canopy_browser.js` (newest NAIP tiles from `/query`), run it, transfer `window.__canopy_b64` the same way.
4. **Lock** both files in `SOURCES.lock.json` with grid georeferencing, dates, request, checksums and limitations. Never overwrite a locked grid: a new area is a new file (the tools then need the role entries extended to several files; to do when Hole 3+ is built).
5. Run `terrain.py check` and look at the registration image before rendering.
