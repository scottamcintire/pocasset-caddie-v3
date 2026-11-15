# Changelog (V3)

Significant changes and the reasons for them. Newest first.

## 2026-11-15 — Documented, repeatable process (owner's development-standards request)
- Added the documentation set:
  - PROJECT_STATUS
  - ARCHITECTURE
  - HOLE_BUILD_STANDARD
  - DATA_SOURCES (extended; the first table is kept unchanged in §6)
  - HOLE_VALIDATION
  - GREEN_ASSET_PROTECTION
  - this CHANGELOG
  - HOLE_PROGRESS (generated)

  *Why:* the project must be resumable without chat history, and every hole must follow one process.
- Added `tools/pcv3.py` (standardize, check, inventory, verify-greens, promote, files) and `tests/test_tools.py`.
  - *Why:* turns the Hole 2 steps into commands that work for any hole, with stops instead of guesses.
- Added the standard data format `pocasset-v3/hole@1`, `data/course/course.json` (scorecard from V2.2.1), `data/sources/SOURCES.lock.json`, and `data/greens/approved_manifest.json` (112 approved green files, SHA-256 from the Mac master).
- **Hole 2:** first extract moved, byte-identical, to `data/holes/hole02/source/initial_2026-11-15/` (features.geojson, hole02_check.kml, hole02_mapped_data_topdown.png).
  - The standardized `features.geojson` has the same geometry for all 13 features (checked).
  - Added `status.json` and `verification.json`.
  - *Why:* preserve the starting point; separate generated files from manual records.
- `tools/extract_hole.py` is superseded by `pcv3.py standardize` and kept for history.
- Hazard position labels:
  - green-front/back/… within 40 m of the green
  - `across` for hazards crossing the playing line, measured along the line
  - L/R elsewhere

  *Why:* "left/right" was ambiguous for bunkers beside and behind the green and for the pond.

## 2026-11-15 — V3 project started
- Local V3 folder + git repository (no remote). V3_PLAN_2026-11-15.md (findings + plan), DATA_SOURCES, DECISIONS, FILE_INVENTORY, README.
- Hole 2 data extract, top-down diagram and Google Earth check file.
- *Why:* owner request to build V3 as a separate future production app without touching production.
