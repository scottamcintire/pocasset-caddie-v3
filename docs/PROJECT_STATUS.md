# Project Status — Pocasset AI Caddie V3

*Last updated: 15 Nov 2026. This file is the place to resume from on any computer or in any Claude session. Read it first, then HOLE_BUILD_STANDARD.md.*

## Where things stand

| Area | Status |
|---|---|
| Stage | **Stage 4 started: Hole 2 flyover prototype v0.1 built and under owner review** (private page). Renderer, distance module, green view port and tests exist. Process documented |
| Production app | **V2.3.1 is the protected production baseline** (owner, 15 Nov). Exact V2.2.1 is archived at …/pocasset_caddie/v2.2.1/. V3 never modifies production. The only authorized production change is the established daily pin-sheet update |
| V3 location | Claude's workspace, local git repository (no remote). **Not yet on the Mac:** `Documents/Pocasset_Caddie_V3` does not exist, and Claude can only reach `Documents/Pocasset AI Caddie` (see decision 6) |
| GitHub / website | None created (needs approval) |
| Hole 2 | In development: A in progress (no trees/elevation), B pending (outline check), C awaiting owner review, D/E automated parts pass, F pending |
| Holes 1, 3–18 | Awaiting data (not started, by design) |

## Done (15 Nov 2026)
- [x] Read-only inventory of the production app, approved greens and course data (V3_PLAN_2026-11-15.md).
- [x] Data research: OSM-derived course GeoJSON (no trees or elevation; all unverified; bunkers/tees possibly pre-restoration); lidar and land-cover sources identified.
- [x] Isolation design: storage prefix, cache-name hazard found, service-worker scope.
- [x] Documentation set: this file, ARCHITECTURE, HOLE_BUILD_STANDARD, DATA_SOURCES, HOLE_VALIDATION, GREEN_ASSET_PROTECTION, CHANGELOG, DECISIONS, HOLE_PROGRESS, FILE_INVENTORY.
- [x] Standard data format (`pocasset-v3/hole@1`) and stable feature IDs.
- [x] Build tool `tools/pcv3.py` (standard library only): standardize, check, inventory, verify-greens, promote, files.
- [x] Tool tests (`tests/test_tools.py`): reproducible output, stable IDs, source tamper stop, manual files untouched, append-only promotion. All pass.
- [x] Hole 2 standardized:
  - 13 features. Tees match Gold (462 vs 463) and Blue (422 vs 424).
  - Pond crosses the line 386–413 yd from the back tee.
  - Auto-check: 9 pass, 4 flags, 0 stops.
- [x] Approved green manifest: 112 files with SHA-256 from the Mac master. Confirmed that Hole 2's approved page is byte-identical to production `hold2-test/index.html`.
- [x] 18-hole progress inventory generated.

## Which parts of the Hole 2 process are already repeatable
- **Automatic for any hole now:** source integrity check, extraction, standardization, stable IDs, tee-to-scorecard matching, hazard position labels, geometry QA, reach/carry reference table, KML + top-down check drawing, 18-hole inventory, green-file verification, promotion/freezing.
- **Still manual:**
  - imagery/field verification of outlines (checkpoint B)
  - downloading lidar (no network route from the tools)
  - capturing missing features (forward tees, any bunker not in OSM)
  - camera fine-tuning
  - visual approval (C)
  - on-course GPS checks (D)
  - iPhone testing (F)
- **Not built yet (designed):**
  - terrain/tree processing
  - the renderer, the overlay-alignment test
  - the V3 app (GPS, flyover view, green view port, scoring port, storage isolation test)

## Hole 2 prototype (15 Nov)
- **Review page:** private claude.ai page "Pocasset V3 Hole 2".
- **Views:** Tee view and Approach view with live labels; GREEN tab shows the approved green unchanged.
- **Simulated positions:** Gold and Blue tees, plus 250/200/150/100/60 yd on the line. Tap the picture to measure a spot.
- **Process doc:** rendering process in docs/RENDERING_STANDARD.md (draft until the owner approves Hole 2).

## Next steps (in order)
1. Owner decisions below (especially 1, 2, 3, 6).
2. Hole 2 imagery check with `data/holes/hole02/checks/hole02_check.kml` → `verification.json` (checkpoint B).
3. Lidar download for Hole 2 (owner, guided) → terrain + tree tools → checkpoint A complete.
4. Shared style file + renderer → Hole 2 Tee and Approach views + alignment test → owner review (C).
5. V3 app shell: storage isolation, GPS (V2.3.1 logic), green view port, simulated GPS → tests (D, E).
6. With approval: create the `pocasset-caddie-v3` repository + Pages → iPhone test (F) → promote Hole 2 v1.
7. Freeze HOLE_BUILD_STANDARD v1.0 from what Hole 2 taught us → then other holes.

## Owner decisions (15 Nov 2026, answered)
1 V2.3.1 protected; V2.2.1 archived · 2 pin-sheet updates continue · 3 style reference received (`reference/`) · 4 still images + live overlays approved · 5 no invented trees · 6 Documents/Pocasset_Caddie_V3 (owner grants that folder) · 7 Claude may research elevation via browser, report before use · 8 all tee sets eventually, Green and Blue primary, no invented tee coordinates. Still open: 9 hazard display rules, 11 when to create the GitHub repository.

## Decisions as originally asked
| # | Decision | Recommendation |
|---|---|---|
| 1 | Production baseline: protect the **live V2.3.1** (what you play with), with V2.2.1 kept at /v2.2.1/? Your documents still say V2.2.1 | Yes, V2.3.1 |
| 2 | Pin sheets: may Claude still push daily pin-sheet loads to the live app, or stop (pins typed on the phone still work)? | Your call. V3 will have its own pin loading |
| 3 | Style reference image (not received yet) | Send it |
| 4 | Flyover v1 as **still images + live overlays** (light on battery, exactly what you approve), or live 3D from the start | Still images first |
| 5 | Holes where reliable tree data is missing: leave trees out (with a "trees not shown" note), or wait until lidar is in | Wait for lidar; never invent |
| 6 | Mac folder: create an empty `Documents/Pocasset_Caddie_V3` and add it to this chat, or allow Claude access to `Documents` to create it | Create the empty folder (narrower access) |
| 7 | Lidar download: you download one tile with guided steps, or let Claude try with the browser built into the desktop app (needs your OK for each download) | Either |
| 8 | Layout verification (B): who signs off, and is a Google Earth imagery check enough, or do you also want an on-course GPS check of bunkers? | Imagery for all; on-course spot check for Hole 2 |
| 9 | Hazards shown: ahead of you, within ±40 yd of your line, nearest 4; optional "+5 for GPS" margin on carries | As proposed, margin off by default |
| 10 | Which tee set to use for Hole 2 markers and the camera, given that only Gold and Blue tees are mapped (Green/White/Bronze/Silver need capturing) | Tell me which tees you play |
| 11 | When to create the GitHub repository and test site | After the Hole 2 prototype review |
