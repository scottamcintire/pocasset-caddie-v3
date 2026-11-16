# Changelog: Pocasset AI Caddie V3

All changes to the V3 project, newest first. V3 is separate from production: nothing here changes the live app (V2.3.1 at scottamcintire.github.io/pocasset_caddie), its repository, the archived V2.2.1, or the approved greens. Git tags mark preserved versions.

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
