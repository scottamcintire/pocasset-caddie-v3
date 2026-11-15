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
