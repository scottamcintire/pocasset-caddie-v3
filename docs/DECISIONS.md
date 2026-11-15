# Decisions log (V3)

| Date | Decision | By |
|---|---|---|
| 2026-11-15 | Build "Pocasset AI Caddie V3" as the future production app: repo `pocasset-caddie-v3`, Mac folder `Documents/Pocasset_Caddie_V3`, test site …/pocasset-caddie-v3/ (none created until approved) | Owner |
| 2026-11-15 | Production app is frozen and read-only from V3 work. (Pending owner confirmation that the baseline is the live V2.3.1; exact V2.2.1 is at /v2.2.1/) | Owner / pending |
| 2026-11-15 | V3 storage prefix `pocasset_v3:`; cache prefix `pcv3-` (V2.3.1's service worker deletes any `pocasset-caddie-*` cache) | Proposed |
| 2026-11-15 | Flyover = data-driven 2.5D renderer in one local metre frame per hole; AI imagery only for textures, never geometry | Proposed |
| 2026-11-15 | Start with Hole 2; verify bunkers/tees against post-restoration imagery before illustrating | Owner / proposed |
| 2026-11-15 | Repeatable hole process: every hole follows HOLE_BUILD_STANDARD.md and passes checkpoints A–F (HOLE_VALIDATION.md); a hole is never approved for looks alone; missing data stops or flags, never guesses | Owner |
| 2026-11-15 | Hole frame = the approved greens' pin frame (green-centre origin, approach axis, metres), so flyover, GPS and green flag share one coordinate system | Proposed |
| 2026-11-15 | Storage in WGS84 lon/lat GeoJSON, unchanged from source; corrections only via new source files, never hand edits | Proposed |
| 2026-11-15 | Stable feature IDs (H02-BK-01 …), append-only; manual records never written by tools; approved/vN append-only | Proposed |
| 2026-11-15 | Build tools use only the Python standard library so they run on the Mac without installs | Proposed |
| 2026-11-15 | Not building other holes until the Hole 2 process is approved | Owner |
| 2026-11-15 | **Production baseline = V2.3.1** (live at /pocasset_caddie/), protected completely; exact V2.2.1 preserved as an archived version at /pocasset_caddie/v2.2.1/ | Owner |
| 2026-11-15 | **Daily pin-sheet updates to production continue** as the established, authorized process (dated sheet preload into V2.3.1). No other production change without approval | Owner |
| 2026-11-15 | Visual standard = owner's ChatGPT 3D-style illustration (`reference/style_reference_chatgpt_hole11.jpg`); a style reference only, not Hole 11 data | Owner |
| 2026-11-15 | Flyover v1 = pre-rendered 3D-style images + live GPS yardage overlays, with rendered positions tied to geographic coordinates | Owner (approved recommendation) |
| 2026-11-15 | No invented trees; trees added only when reliable positions exist (lidar canopy). No invented tee coordinates | Owner |
| 2026-11-15 | Support every tee set eventually; Green and Blue are the primary tees | Owner |
| 2026-11-15 | Mac location = Documents/Pocasset_Caddie_V3 (owner grants access to that folder only) | Owner |
| 2026-11-15 | Claude may research public elevation data via the browser; nothing downloaded outside the V3 project; source and accuracy reported before use | Owner |
| 2026-11-15 | Appearance must be improvable without rebuilding geographic data or GPS (renderer is a separate stage with its own style file) | Owner |
| 2026-11-15 | **Lidar approved and used:** 2021 USGS/MassGIS QL1 lidar for general ground shape only; never replaces the green heat maps; never assumed to show rebuilt bunkers or tees | Owner |
| 2026-11-15 | **Trees:** approximate wooded areas allowed if clearly labelled illustrative; positions only from a documented source (chosen: 2023 NAIP canopy classification; OSM woods as cross-check) | Owner (approach); source choice by Claude, documented |
| 2026-11-15 | Vertical exaggeration 1.5× for ground shape in renders (style setting, stated in every projection file and in the app); distances unaffected | Claude (proposed; owner may change) |
| 2026-11-15 | Source tees filed under the wrong hole are re-assigned via `source_corrections.json` (never hand-edited); shown as **candidate** until verified | Claude (proposed) |
| 2026-11-15 | V3 defaults to the Green tee; other mapped tees selectable; distances from live GPS | Owner |
| 2026-11-15 | **Visual baseline approved (v1.0):** the Hole 2 V2 appearance (terrain elevations, woods, fairway look, 3D perspective, lighting, textures, 1.5× exaggeration, camera approach) is the standard for every V3 hole. Locked in `style/approved/VISUAL_BASELINE_v1.0.json`; tag v3.1.0-visual-baseline | Owner |
| 2026-11-15 | No further significant visual changes without discussing them with the owner first (renderer guard + visual baseline test enforce it) | Owner |
| 2026-11-15 | The visual approval does **not** approve geographic outlines, rebuilt bunkers, Green tee coordinates, GPS calculations or iPhone function; those pass their own checks. Approved green heat maps and the EZLocator pin system stay unchanged | Owner |
| 2026-11-15 | Next: preserve V2; finish Hole 2 geographic verification; prepare the independent V3 app for iPhone testing; trial the approved style on two more holes with different layouts; document problems before the remaining holes. Production V2.3.1 not modified or deployed | Owner |
