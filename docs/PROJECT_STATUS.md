# Project Status — Pocasset AI Caddie V3

*Last updated: 16 Nov 2026. This file is the place to resume from on any computer or in any Claude session. Read it first, then HOLE_BUILD_STANDARD.md.*

## Resume checkpoint (16 Nov 2026, afternoon) — v5.0.0: all 18 holes
- **All 18 flyovers live** in /play/ and on /hole01/–/hole18/, each "Published — awaiting your review". Back-nine notes, tee corrections and the one alignment exception: RELEASES.md ("Back nine"), DATA_SOURCES §2h, reviews/hole10–18.md.
- **Next:** owner review on the course (tees marked candidate, Hole 10 pond outline, Hole 11 Green tee, Hole 15 Green tee position, rebuilt bunkers); confirm the club's current card; possible later: offline mode, V2.3.1 round import.

## Earlier checkpoint (16 Nov 2026, morning) — v4.0.0 integrated round page
- **/play/** is live: https://scottamcintire.github.io/pocasset-caddie-v3/play/ — start round → confirm tee (Green default) → hole → FLYOVER (live GPS + hazards) → GREEN (approved heat map + EZLocator pin) → SCORE. All 18 holes for GPS/green/scoring; flyovers + hazards Holes 1–9. Plan and as-built notes: **docs/INTEGRATION_PLAN.md**; tests and rollback: **docs/RELEASES.md** (v4.0.0).
- Scorecard: **data/scorecard/pocasset_scorecard.json** — published card preserved; owner's newer Green 5,986 / Blue 6,301 are **provisional** until the club's card confirms them (DATA_SOURCES §2g; H13 Blue 295 < Green 308 worth checking).
- **Next:** owner tries /play/ on the course; confirm the club-issued card; owner review of Holes 1–9; Holes 10–18 flyovers/tees/hazards need the third lidar + canopy download when approved; possible later: offline mode (pcv3- caches), controlled import of V2.3.1 rounds.

## Earlier checkpoint (15 Nov 2026, evening)
- **Holes 1–9 are on the V3 test site**, each "Published — awaiting your review": https://scottamcintire.github.io/pocasset-caddie-v3/ . Releases, commits, tests and data concerns: **docs/RELEASES.md** (central table, Holes 1–18). Owner feedback: **docs/reviews/holeNN.md**. Problems found while repeating the process: **docs/PROBLEM_REPORT.md**.
- Source: `main` of `scottamcintire/pocasset-caddie-v3` (latest source commit is in RELEASES.md); site: `gh-pages`. Local working copies: `/home/claude/Pocasset_Caddie_V3` (source) and `/home/claude/pocasset-caddie-v3` (site).
- Data locked: course GeoJSON; 2021 lidar for Hole 2's area **and** for Holes 1, 5–9's area; NAIP 2023 canopy for both areas; V2.3.1 green build data. Each hole uses the first locked grid that covers it (Holes 2–4 keep the Hole 2 grid).
- **Latest (15 Nov, night):** release v3.8.0 = visual baseline **v1.1** (owner-approved: illustrative trees 8 m instead of 13 m) on all nine holes; v3.7.0 added the owner-reported **Hole 8 pond** (traced from lidar, unverified). Terrain audit + previews: audits/ and previews/ (strong shading, thinner woods and camera moves previewed, not adopted).
- **Next:** owner review of Holes 1–9 (record in docs/reviews, set status in data/release/status.json); owner decision on problem-report item 1 (tree crowns over play); on-course checks of the flagged tees/bunkers; Holes 10–18 need a third lidar + canopy download (Mac browser, awake) when that scope is approved.
- Production V2.3.1 untouched throughout (no change to its repo, site, GPS, scoring or saved data).

## Where things stand

| Area | Status |
|---|---|
| Stage | Holes 1–9 published for owner review (rolling releases v3.2.0 → v3.8.0). Visual baseline v1.1 (owner-approved 15 Nov: shorter trees); v1.0 kept on file |
| Production app | **V2.3.1 is the protected production baseline**; V3 never modifies it. Only the established daily pin-sheet update is authorized there |
| V3 location | GitHub `scottamcintire/pocasset-caddie-v3` (`main` = source, `gh-pages` = test site) plus Claude's workspace copy. Mac folder still not created (decision 6) |
| GitHub / website | Live: https://scottamcintire.github.io/pocasset-caddie-v3/ (homepage shows each hole's review status) |
| Holes 1–9 | Published — awaiting review (none approved). Hole 2: visual style approved; Green tee still a candidate |
| Holes 10–18 | Flyovers, terrain, woods, hazards published 16 Nov (v4.1.0–v4.9.0); awaiting owner review |
| Integrated app | /play/ v4.0.0 published 16 Nov (38/38 tests); awaiting owner trial |

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
  - fetching lidar and canopy for a new area (a browser step on the Mac, HOLE_BUILD_STANDARD.md §5a; then automatic)
  - capturing missing features (forward tees, any bunker not in OSM)
  - camera fine-tuning
  - visual approval (C)
  - on-course GPS checks (D)
  - iPhone testing (F)
- **Built since (15 Nov):** terrain tool, illustrative woods, renderer v0.2, overlay-alignment test, prototype viewer with 3D overlays.
- **Not built yet (designed):** the full V3 app (live GPS port of V2.3.1, all-hole navigation, scoring port, storage isolation test, service worker).

## Visual approval (15 Nov 2026)
The owner approved the Hole 2 V2 visual appearance as the standard for Pocasset AI Caddie V3 ("I particularly like the terrain elevations, wooded areas, fairway appearance, and the improved three-dimensional perspective").
- **Preserved:** style, renderer and terrain code copied read-only to `style/approved/`; Hole 2 reference renders in `data/holes/hole02/render/approved_visual_v1.0/`; checksums in `style/approved/VISUAL_BASELINE_v1.0.json`; git tag `v3.1.0-visual-baseline`.
- **Enforced:** the renderer stops on any unapproved change to the shared style; `tests/test_visual_baseline.py --render` proves Hole 2 still renders byte-identical.
- **Rule:** no significant visual changes without discussing them with the owner.
- **Visual approval only:** outlines, rebuilt bunkers, Green tee coordinates, GPS calculations and iPhone function still need their own checks. Approved green heat maps and EZLocator pins unchanged.

## Hole 2 visual prototype V2 (15 Nov, later)
- **Review page:** new private claude.ai page "Pocasset V3 Hole 2 · V2"; v0.1 page unchanged for comparison.
- **Elevation:** 2021 USGS 3DEP QL1 lidar for Hole 2's area, locked in `data/sources/elevation/` (DATA_SOURCES.md §2b). Ground drawn at 1.5× height (stated); distances stay flat GPS distances.
- **Woods:** canopy from NAIP imagery of 22 Aug 2023, locked in `data/sources/canopy/` (§2c). Drawn only where canopy was seen, never on playing surfaces; trees themselves are illustrative.
- **Green tee:** H02-TE-03 re-assigned from the source's Hole 4 (`source_corrections.json`): 367 yd vs card 368, on a built platform in the 2021 lidar. **Candidate** until confirmed (imagery after the rebuild or on-course). Bronze candidate likewise. Silver still unmapped.
- **Views:** Tee view from behind the Green tee; Approach view ~110 yd out with pond, bunkers and green. Overlays projected in 3D on the terrain.
- **Tests:** alignment (material IDs + colours) and prototype tests (F/C/B vs V2.3.1 and V2.2.1, projection vs renderer, tap round trip). See CHANGELOG.

## Hole 2 prototype v0.1 (15 Nov)
- **Review page:** private claude.ai page "Pocasset V3 Hole 2".
- **Views:** Tee view and Approach view with live labels; GREEN tab shows the approved green unchanged.
- **Simulated positions:** Gold and Blue tees, plus 250/200/150/100/60 yd on the line. Tap the picture to measure a spot.
- **Process doc:** rendering process in docs/RENDERING_STANDARD.md (draft until the owner approves Hole 2).

## Waiting on the owner
- ~~Visual review of Hole 2 V2 (checkpoint C)~~ approved 15 Nov.
- Confirm the Green tee position on the course (or point to post-rebuild imagery), and whether the woods near Hole 2 still look like 2023.
- ~~Approval to use the 2021 QL1 lidar~~ (approved and done 15 Nov).
- Folder access to `Documents/Pocasset_Caddie_V3` (create the empty folder, then add it in the desktop app). Then Claude transfers the project, verifies every file, and checks all 112 approved green checksums on the Mac.
- Hole 2 outline check (checkpoint B) with `checks/hole02_check.kml`.

## Next steps (in order, owner 15 Nov)
1. ~~Owner review of Hole 2 V2 (C)~~ approved; preserved and versioned as visual baseline v1.0.
1a. Trial the approved style on two more holes with different layouts; document problems before the remaining holes.
2. Hole 2 verification (B) with post-rebuild imagery or an on-course walk → `verification.json`; Green tee candidate → confirmed.
3. ~~Lidar for Hole 2~~ (done) · ~~terrain + woods~~ (done; woods illustrative) · ~~renderer + alignment test~~ (v0.2 done).
4. V3 app shell: storage isolation, GPS (V2.3.1 logic), green view port, simulated GPS → tests (D, E).
5. With approval: create the `pocasset-caddie-v3` repository + Pages → iPhone test (F) → promote Hole 2 v1.
6. Freeze HOLE_BUILD_STANDARD v1.0 from what Hole 2 taught us → then other holes.

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
