# Changelog: Pocasset AI Caddie V3

All changes to the V3 project, newest first. V3 is separate from production: nothing here changes the live app (V2.3.1 at scottamcintire.github.io/pocasset_caddie), its repository, the archived V2.2.1, or the approved greens. Git tags mark preserved versions.

## v5.3.1-hole02-hazard-reach: hazard labels by golfer-to-hazard distance (Hole 2 only, test release, 19 Nov 2026)
- Owner report: at 261 yd from the green the pond ahead had no label (v5.3.0 hid all labels when the green was > 250 yd). Hazard labels no longer depend on the green distance: a hazard is labelled when its near edge is ≤ 250 yd from the golfer and ahead (existing hazard calculation: ahead, in the ±40 yd corridor, nearest first), max 3. The centre-only header beyond 250 yd from the green is unchanged.
- Pond H02-WA-01 inspected first: closed OSM outline, 68 points, no self-intersections, ~1,765 m², 13–76 yd short of the green centre, imagery check Mar 2025 ±1.1 yd (pre-restoration, unverified). Front · carry come from the existing crossings of the playing line; no geometry or distance changed. The playing line runs through the mapped pond ~50–76 yd out: a golfer inside the outline has no near edge ahead, so no pond front · carry label there (the table still lists it, unchanged).
- Page code only (labels drawn from a filtered hazard list); app/*.js, GPS, zoom, images, coordinates, hazard table and UNVERIFIED warnings unchanged; built /play/ differs from v5.3.0 in index.html only.
- Tests: tests/test_minimal.js 82/82, Move Me taps at 300/261/251/250/200/100/60/40 yd + the same spots as live GPS; test_play 38/38; test_zoom 202/202 (results and screenshots byte-identical). Production V2.3.1 unchanged (e8b22e4).

## v5.3.0-minimal-hole02: minimalist display, Phase 1 (Hole 2 only, test release, 19 Nov 2026)
- /play/ on Hole 2: beyond 250 yd from the green centre (the header's existing V2.3.1 centre yardage) the header shows the centre yardage only and the flyover shows no bunker/pond labels; at 250 yd or closer the front/centre/back header returns and at most 3 hazard labels are drawn (hazards ahead within ±40 yd of the line, nearest first: the existing order, `rule.max` 3 for drawing only).
- The hazard table below the picture is unchanged (up to 4 rows). Simulation buttons sit behind one collapsible **SIMULATE** button (collapsed by default, Hole 2 only). Tap-to-measure and the "move me" toggle stay visible.
- Page code only (`prototype/play_src/index.html`); `app/*.js` (GPS, zoom, overlay, geometry), images, coordinates and hazard geometry unchanged; built /play/ differs from v5.2.0 in index.html only. Other holes and the /holeNN/ pages are unchanged.
- Tests: new tests/test_minimal.js 86/86 (300/251/250/200/100/60 yd, simulated and live; zoom box/transform identical to v5.2.0; Holes 1, 3, 9, 14 overlays identical to v5.2.0); test_play 38/38 (one line: opens SIMULATE before tapping a preset); test_zoom 202/202 with results and screenshots byte-identical to v5.2.0. Production V2.3.1 unchanged (e8b22e4).
- Noted, not changed: at 200 yd the automatic Approach view (camera ~110 yd out) has the golfer behind the camera, so no blue dot or "You" pill is drawn — same as v5.2.0.

## v5.2.0-zoom-all: GPS zoom on all 18 holes (test release, 17 Nov 2026; APPROVED by owner 17 Nov 2026)
- The approved Hole 2 zoom (nearest-green-edge distance) now runs on every flyover hole through the same shared code (`ZOOM_HOLES = COURSE.flyover_holes`); no per-hole logic, no artwork, camera, GPS, hazard, pin or scoring change.
- DEV (`?dev=1`): beyond button now 15 yd; a DEV distance button is hidden when the hole never reaches it (DEV 150 on par-3 Holes 12 and 15).
- tests/test_zoom.js covers all 18 holes (202 checks, all pass). Regression: test_play 38/38, test_prototype Holes 1–18, alignment, visual baseline v1.2, tools, scorecard: all pass.
- Flagged for review (no change made): Hole 6 at 150 yd (unzoomed tee picture, same as v5.0) shows the green within 5% of the top edge.
- Owner decision 17 Nov 2026: the short par 3s (Holes 6, 12, 15) stay as they are; Hole 6 framing flag closed, no change.

## v5.1.1-zoom-test: zoom by nearest green edge (owner, 17 Nov 2026)
- Zoom now follows the distance to the NEAREST EDGE of the green (0 on the green; back edge when beyond it), from the same green outline and metres as the GPS engine; front/centre/back unchanged. DEV buttons (`?dev=1`) are edge distances (150/75/50/25/10 short, 10 beyond). Hole 2 only; tests/test_zoom.js 19 checks.

## v5.1.0-zoom-test: GPS zoom, Phase 1 (Hole 2 only, 17 Nov 2026)
- /play/ flyover zooms toward the green as the distance to the green centre falls (1× at 150+ yd → 2.8× at 10 yd, smooth curve), centred between green and golfer and never cropping either; image and overlay share one visible box (`PFly.zoomBox`/`zoomFor`, overlay `box` option keeps marks on their ground points and labels at constant on-screen size). Smoothing: EMA on distance + 0.1× change threshold; animation only on change.
- Enabled for Hole 2 only (`ZOOM_HOLES`). Developer distances with `?dev=1` (150/75/50/25/10 yd + 15 yd beyond the green). Without a box the overlay output is byte-identical (1,440 overlays compared); GPS engine, hazards, pins, scoring, artwork unchanged. Test: tests/test_zoom.js (16 checks).

## v5.0.2: Hole 11 Green tee (owner information, 17 Nov 2026)
- New manual record `tee_positions.json` (owner-reported tee-set positions within/next to a mapped box): standardize/check/hole page/play support it (own id, label "owner-reported", own distance rows and tests). First use: Hole 11 Green tee at the front of the Gold/Blue box (F/C/B 355/369/382, matching the owner's screenshot).
- Off-line box re-filed from Hole 11 to Hole 14 (Bronze candidate). No images re-rendered (tee boxes are painted from the whole course map); all 18 hole pages re-tested, only Holes 11 and 14 pages changed.

## v5.0.1: Hole 9 tee-view framing (owner feedback, 16 Nov 2026)
- Hole 9 is a dogleg, so the standard tee → green aim left its fairway on the picture's edge. Tee view now aimed through the centre of Hole 9's own fairway (optional `aim_through_uv` camera field, Hole 9 only), closer and a little steeper. Camera only: no geography, GPS, hazard or green change; other holes byte-identical (Hole 2 fresh re-render). See docs/reviews/hole09.md.

## v5.0.0: back nine — Holes 10–18 flyovers, all 18 in /play/ (16 Nov 2026)
- **Holes 10–18 built and published one at a time** (v4.1.0–v4.9.0) with the approved v1.2 style and the same pipeline; each awaiting owner review.
- **Data:** new locked lidar + canopy area for Holes 11–14 (`*_back9_2m`); Hole 10 pond traced from lidar (owner report); 7 misfiled source tees re-assigned and 2 removed (source_corrections.json, all candidates/unverified).
- **Tools:** `terrain.py` per-hole multi-grid mosaic (opt-in `terrain_options.json`; Holes 10, 16–18); renderer world clipped to the hole + 450 m in mosaic mode; `build_site.py` homepage flyover range automatic.
- **Tests:** `test_play.js` now covers every flyover hole (A4, E1, K1) and the "no flyover yet" case only while one exists; `test_alignment.py` reads `tests/alignment_exceptions.json` (one entry: H18-BK-06 tee view).
- Cameras: Hole 11 tee view from the on-line Gold/Blue tee (Green tee 43 m off line); Hole 17 trial camera replaced by the standard scaled camera; Hole 18 +25 m beyond the green.

## v4.0.0: integrated round page /play/ — live GPS, hazards, green & today's pin, Green/Blue scorecard, scoring (16 Nov 2026)
- **New page `/play/`** (the nine `/holeNN/` pages stay unchanged): start a round and confirm the tee (Green default; Blue and the other four selectable, changeable mid-round, remembered) → hole → FLYOVER (live overlays + hazard front/carry) → GREEN (approved heat map, EZLocator pin entry, 18-pin sheet) → SCORE (strokes, putts, tee shot, pin + hole notes, totals, scorecard OUT/IN/TOT, CSV, finish round → V3 history).
- **Scorecard vs live GPS shown separately:** the header's SCORECARD line (fixed for the tee) is apart from the LIVE GPS / SIMULATED front-centre-back and flag numbers; GPS never uses the scorecard.
- **Central scorecard** `data/scorecard/pocasset_scorecard.json`: published card (all six tees, ratings/slopes, = V2.3.1) preserved; the owner's newer Green 5,986 / Blue 6,301 figures are **provisional** (no club-issued card found); 7 differences listed.
- **GPS = V2.3.1's engine** (`app/caddie.js`): same front/back method, flag yardage, 180 m away-from-course rule, automatic-hole thresholds, retry/watchdog/resume/wake-lock/permission messages. Tested identical to V2.3.1 at 749 positions and through a 413-fix walk of all 18 holes.
- **All 18 holes** get GPS, greens and scoring; flyovers/hazards Holes 1–9. Approved greens for Holes 10–18 ported byte-identical (checksums).
- **Storage isolation:** V3 writes only `pocasset_v3:*`; a test proves V2.3.1's saved round and pins stay byte-identical through a full V3 session. No service worker.
- Overlay drawing moved to `app/flyover.js` and shared; nine hole pages re-tested, screenshots pixel-identical.

## v3.9.0: Hole 1 tee correction; crown clearance (visual baseline v1.2) (15 Nov 2026)
- **Hole 1:** a source tee pointing ~97° off the line of play (26 m off it, 5 m below the tee platform) was removed from Hole 1; the app and camera now start at the real Green tee (475 yd). Owner-approved.
- **Crown clearance (baseline v1.2):** trees whose crowns would reach a tee, green, fairway, bunker or water are no longer drawn (Holes 1, 3, 6 most visibly; Hole 2 < 1%). Owner-approved.
- Hole 4 left as is (owner).

## v3.8.0-visual-v1.1: shorter illustrative trees on all holes; Hole 8 pond (15 Nov 2026)
- **Visual baseline v1.1 (owner-approved):** trees 8 m instead of 13 m so wooded holes show their ground; all nine holes re-rendered and re-tested. v1.0 preserved.
- **v3.7.0 Hole 8 pond:** owner-reported pond traced from the 2021 lidar into a locked lidar-derived source (OSM file untouched); hazard yardages from all three tees; Hole 9 tee view updated.
- **Terrain audit:** `tools/terrain_audit.py` and `audits/terrain_2026-11-15/`; previews in `previews/` (camera, exaggeration, lighting, woods, shading). Findings: flat-looking holes were real terrain plus woods, not missing lidar or settings.

## v3.2.0 → v3.6.1: rolling releases of Holes 1–9 to the test site (15 Nov 2026)
Full table of releases, commits and tests: docs/RELEASES.md. Problems found: docs/PROBLEM_REPORT.md.
- **Holes 1, 3–9 built with the approved Hole 2 process and published**, each awaiting owner review (Hole 2 look unchanged).
- **Data:** course-area 2021 lidar (Holes 1, 5–9) and NAIP 2023 canopy locked as second grids; approved greens + EZLocator pin models ported for Holes 1, 4–9 (checksums verified, images unchanged).
- **Tools:** per-hole grid selection (`terrain.py`); `make_camera.py` (approved camera scaled by hole length); `port_green.py`; `source_corrections.json` `remove_from_this_hole`; renderer writes a QA-only ray-distance file (pictures unchanged); `test_alignment.py` separates hidden-behind-woods from misaligned and scales its edge inset with pixel size; `test_prototype.js` runs for any hole (`HOLE=N`); homepage statuses from `data/release/status.json`.
- **App fix:** when no Green tee is mapped the app opens at the Blue tee, else the card tee closest to the Green yardage, never at a mapped tee that matches no card tee; footer explains.
- **Hole 3:** re-rendered with the length-scaled camera (earlier render kept for comparison).

## v3.1.0-visual-baseline: Hole 2 V2 approved as the V3 visual standard (15 Nov 2026)
- **Owner approval (visual only):** the Hole 2 V2 appearance is the standard for all V3 holes. Geography, bunkers, Green tee, GPS and iPhone checks remain separate.
- Approved style, renderer and terrain code frozen read-only in `style/approved/` with `VISUAL_BASELINE_v1.0.json` (checksums, camera approach, Hole 2 reference renders in `render/approved_visual_v1.0/`).
- Renderer guard: stops if the shared style differs from the approved one unless an owner-approved change is named. New `tests/test_visual_baseline.py` (quick checksum check; `--render` proves byte-identical re-render).
- RENDERING_STANDARD is now v1.0; PROJECT_STATUS and DECISIONS record the approval and the next steps.

## v3.0.2-hole02-proto-v2: Hole 2 visual prototype V2 (15 Nov 2026)

**Owner approvals this round:** download 2021 lidar into V3; investigate tree sources (approximate woods allowed if labelled illustrative).

### Data
- **Elevation added:** 2021 USGS 3DEP QL1 lidar, 1 m bare earth, stored at 2 m (`data/sources/elevation/`), checksum-locked with full provenance (DATA_SOURCES.md §2b). Fetched through the Mac's browser; transfer verified by SHA-256.
- **Woods added (illustrative):** canopy mask classified from USDA NAIP imagery of 22 Aug 2023 (0.3 m, infrared), stored at 2 m (`data/sources/canopy/`), locked; method in `tools/canopy_browser.js` (DATA_SOURCES.md §2c). OSM wood polygons found and used as a cross-check only.
- **Green tee candidate found:** two tees the source filed under Hole 4 are re-assigned to Hole 2 through the new `source_corrections.json`: H02-TE-03 Green/White (367 yd; card 368) and H02-TE-04 Bronze (344 yd; card 349). Both stay `unverified` and are labelled **candidate**. Supporting evidence: they sit on flat platforms raised about 0.35 m in the 2021 lidar. Only Silver remains unmapped.
- **Preliminary imagery/lidar check** of all Hole 2 outlines (DATA_SOURCES.md §2d). Recorded as evidence, not verification.
- `terrain.json` (2 m height grid in the hole frame) generated for Hole 2.

### Tools
- `tools/terrain.py` (new): transverse Mercator (Krüger series) for UTM 19N, locked-grid loading and sampling, hole-frame rasters, `check` (registration QA) and `grid` commands.
- `tools/pcv3.py`: `standardize` merges `source_corrections.json` (geometry from the locked source, unchanged).
- `tools/render_flyover.py` **v0.2** (rewritten): real terrain (1.5× exaggeration, stated), ray-marched 3D camera, illustrative woods from the canopy grid, sun shadows and ambient occlusion, mowing patterns, sand, water with sky reflection, sky and haze, detail + distance canvases, material-ID output, projection schema `flyover-projection@2` (3×4 camera matrix + height model). v0.1 kept in `tools/archive/`.
- `style/flyover_style.json` **v0.2** (v0.1 in `style/archive/`).
- `tools/build_prototype.py`: adds the terrain grid to the prototype data.

### App prototype (`prototype/hole02/`)
- Overlays projected in 3D on the terrain (`app/geo.js` `Terrain`, `View.project`); taps converted to ground points by ray-march (`View.unproject`).
- **Default tee = Green (candidate)**; tee chips ordered Green, Blue, Gold, then others.
- Lighter, smaller labels with anchor dots; same collision-free layout.
- Footer states the candidate tee, exaggeration, illustrative woods and data credits.
- v0.1 preserved in `prototype/hole02_v0.1/` and `prototype/screenshots_v0.1/`; its artifact stays published.

### Views (`camera.json`)
- **Tee:** from behind the Green tee, 95 m back and 105 m up, 1170 × 1440 (fits an iPhone screen); whole hole, pond and green visible.
- **Approach:** 100 m short of the green, 25 m back, 60 m up, 1170 × 1400; green, both greenside bunkers, pond and fairway end. v0.1 settings kept in `render/v0.1/camera_v0.1.json`.

### Tests
- `tests/test_alignment.py`: now projects with matrix + terrain and checks material IDs as well as colours; reports points hidden by woods.
- `tests/test_prototype.js`: green F/C/B compared with **V2.3.1 production** (baseline) and V2.2.1; browser projection vs Python renderer; tap round trip.

### Docs
RENDERING_STANDARD (draft 0.2), DATA_SOURCES (§2b–2d), HOLE_BUILD_STANDARD (terrain step, source corrections, §5a repeatable browser extraction), PROJECT_STATUS, DECISIONS, HOLE_PROGRESS, FILE_INVENTORY, this changelog.

## Preserve v0.1 (15 Nov 2026), commit 314e862
- Hole 2 renders, camera, style and prototype v0.1 copied to `render/v0.1/`, `style/archive/`, `prototype/hole02_v0.1/` before any v0.2 work.

## Elevation research (15 Nov 2026), commit 0fc6f4e
- DATA_SOURCES.md §2a: lidar options researched and reported for approval (nothing downloaded).

## v3.0.1-hole02-proto: Hole 2 prototype v0.1 (15 Nov 2026), commit 7aecf17
- First renderer (2.5D: painted outlines, flat ground, cosmetic bevels, homography projection) and the Tee/Approach/Green prototype with simulated GPS.
- Green F/C/B ported line-for-line from production (identical at 60 positions vs V2.2.1); hazard reach/carry; approved green shown unchanged (checksum-verified).
- Published as a private artifact (v0.1).

## v3.0.0-process-draft: documentation and tools (15 Nov 2026), commit 22d9ba0
- Docs: PROJECT_STATUS, ARCHITECTURE, HOLE_BUILD_STANDARD, DATA_SOURCES, HOLE_VALIDATION, GREEN_ASSET_PROTECTION, RENDERING_STANDARD (draft), DECISIONS, HOLE_PROGRESS, FILE_INVENTORY, V3 plan.
- `tools/pcv3.py` (standardize, check, inventory, verify-greens, promote, files); locked course source; 112-file approved-green manifest; Hole 2 standardized and checked.

## Scaffold (15 Nov 2026), commit 44affb8
- Separate V3 project created (local git, no remote). Storage isolation rules (`pocasset_v3:` keys, `pcv3-` caches).
