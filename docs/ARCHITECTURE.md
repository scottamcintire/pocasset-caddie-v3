# V3 Architecture

*How the geographic data, the flyover renderer, GPS calculations and the approved greens fit together. Draft 0.1, 15 Nov 2026. Decisions still open are marked **[DECISION]**; the full list is in PROJECT_STATUS.md.*

## 1. Three layers, one coordinate system

```
            SOURCES (read-only, checksum-locked)
  OSM course GeoJSON · USGS lidar (to download) · scorecard · approved greens (Mac master)
                         │
                         ▼   tools/pcv3.py  (build time, on the Mac or in Claude's workspace)
            HOLE PACKAGES  data/holes/holeNN/
  features.geojson · hole.json · terrain/ · trees/ · camera.json · render/ · approved/vN/
                         │
                         ▼   app/ (runs on the iPhone; plain JavaScript modules)
   ┌──────────────┬──────────────────┬────────────────┬─────────────┐
   │ Flyover view │ Green view       │ GPS service    │ Scoring     │
   │ (new)        │ (approved, as-is)│ (V2.3.1 logic) │ (V2 port)   │
   └──────────────┴──────────────────┴────────────────┴─────────────┘
```

**Shared coordinate system:** every hole uses the **hole frame**. That is the green-pin frame the approved greens already use: origin at the green centre, v toward the green along the last leg, u to the golfer's right, in metres. GPS positions, hazard outlines, the rendered flyover and the green's orange flag all convert to and from this frame with the same formulas. That is how the markers stay aligned with the artwork.

## 2. Flyover renderer (an independent component). Built; see RENDERING_STANDARD.md

- **Input:** a hole package plus one shared `style.json` (grass colours, mowing stripe width, sand, water, tree sprites, lighting angle, label styling). One style applies to every hole, so all 18 look alike. Each hole has only `camera.json`; there is no per-hole code.
- **Method (2.5D):**
  1. Paint a ground texture in the hole frame from the outlines: rough everywhere, fairway with stripes along the playing line, tees, green surface, bunkers with lip shading, water, paths.
  2. Drape it over the lidar height grid; until lidar is available, it is drawn flat and marked "terrain pending".
  3. Stand tree sprites at lidar-derived tree positions, with no trees where there is no data.
  4. Apply one sun direction for shading and shadows.
  5. Place a perspective camera per view (Tee, Approach).
- **Output:** for each view, a still image plus the camera's projection matrix (`render/view_tee.png` + `render/view_tee.json`, likewise for approach).
  - The app draws GPS dots, distance labels and hazard markers by projecting hole-frame points through the stored matrix, so they cannot drift from the artwork.
  - An automated test projects every outline and checks the pixel alignment.
- **Technology:** one WebGL rendering module (pinned three.js copy in the repository).
  - The build uses it inside headless Chromium to produce the stills; the app can use the same module live later (moving camera, "from my position").
  - **Decided (15 Nov): v1 = pre-rendered still images + live GPS overlays.**
- **AI image tools:** may be used only to create the shared surface textures and tree sprites, never to paint a hole, place a hazard or change a shape.

## 3. Green view: the approved assets, untouched

- It displays the approved green image for the hole (a byte-for-byte copy, checked against `data/greens/approved_manifest.json`).
- It keeps the approach-up rotation rule approved on 26 Oct.
- It uses the **unchanged pin model** (points, transform, geoT, front/side rule) from the approved hole page and V2.3.1, ported verbatim with tests that flags match to within 0.06 px.
- It keeps EZLocator pin entry and sheet loading, with V3's own storage.
- The flyover never draws inside the Green view. Navigation is a GREEN button or thumbnail; you choose the view, with no automatic switching.
- See [GREEN_ASSET_PROTECTION.md](GREEN_ASSET_PROTECTION.md).

## 4. GPS calculations

| Value | Method |
|---|---|
| Green front / center / back | Production's `intersectionExtents`, ported line for line, using production's own green-centre point per hole (`course.json → production_green_center`). Tested identical to the production page at 60 positions on Hole 2 |
| Flag | Today's pin (EZLocator numbers) → approved pin model → hole frame → distance. Same as V2.3.1 |
| Hazard reach / carry | **Side hazard:** along the line from the player through the hazard's centre, where it enters (reach) and leaves (carry). **Hazard that crosses the playing line** (`position: across`, e.g. Hole 2 pond): along the playing line ahead of the player, first and last crossing |
| Which hazards are shown | **[DECISION]** proposed: ahead of the player (along the playing line), within ±40 yd of the line to the current target (green, or the dogleg point while short of it), nearest 4 |
| Left / right | `position` from the data (front-left of green, L/R of line, across) |
| Uncertainty | The phone's accuracy figure is shown. Numbers are dimmed when accuracy is worse than ±10 yd. **[DECISION]** optional carry safety margin (e.g. "+5 for GPS"). Map error for verified features about ±1–2 yd; unverified features are labelled as such |
| Hole selection / away guard | V2.3.1 logic (auto-hole hysteresis, 180 m away guard), ported |
| GPS reliability | V2.3.1 "stays on" behaviour: retry on weak signal, watchdog, resume on unlock or reload |

The build-time check (`pcv3.py check`) uses the same reach/carry functions. Its distance table is the reference for app tests.

## 4.1 Simulated GPS
The app has a test mode with positions you can drag along the hole, plus preset points (each tee, 150 yd, 100 yd, greenside). That allows every number to be checked away from the course, as required.

## 5. Storage and offline (isolation from production)

- All GitHub Pages sites under `scottamcintire.github.io` share one browser origin, so their storage is shared.
- V3 rules:
  - localStorage/IndexedDB keys start with `pocasset_v3:`, and one storage module refuses any other key.
  - Cache names start with `pcv3-`. The production service worker deletes any cache named `pocasset-caddie-*`, so V3 must never use that prefix.
  - The service worker lives at `/pocasset-caddie-v3/sw.js`, with no scope overlap with `/pocasset_caddie/`.
- "Import from V2" copies your V2 round or pins in one direction only, on request.
- An automated isolation test fails if any non-V3 key or cache changes during the V3 test suite.

## 6. App structure (planned; built at Stage 4)

```
index.html          app/core  app/storage  app/gps  app/geo  app/scoring  app/pins
app/views/flyover   app/views/green   data/ (hole packages, course.json)   greens/ (protected copies)
sw.js (pcv3- caches)   style.json   vendor/three.min.js (pinned)   tests/
```

- All paths are relative, so the same build runs at `/pocasset-caddie-v3/` now and can run at the production address later without a rewrite.
- No bundler is needed; this keeps the app maintainable from any computer.

## 7. Version history

- Git for everything, with a tag per milestone.
- `approved/vN` per hole.
- `CHANGELOG.md` and `DECISIONS.md`.
- A dated zip backup in the Mac folder at each milestone.
- The production app and its repository are never part of V3's history.
