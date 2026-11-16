# V3 integration plan — flyover + live GPS + hazards + green/EZLocator + scorekeeping (16 Nov 2026)

Owner brief: "Integrate GPS, Green & Blue tee yardages, and scorekeeping" (16 Nov 2026). Front nine first; all 18 holes in the scorecard. Production V2.3.1 is read only; nothing here deploys to it.

**Checkpoint before changes:** release v3.9.0 — source `main` a00e495, site `gh-pages` 3ef5687. Rollback = revert later `gh-pages` commits; the existing `/holeNN/` pages stay published unchanged.

## 1. What exists
| Capability | V2.3.1 (production, read-only review) | V3 today |
|---|---|---|
| Live GPS | `watchPosition` high accuracy; retry on weak signal; 45 s watchdog; resume on return/reload (3 h); permission-denied and non-HTTPS messages; screen wake lock; "away from course" (> 180 m from every line) blanks yardages; accuracy ± yd shown | Simple watch per hole page, no retry/watchdog |
| Front / centre / back | Line of sight through green centre (`intersectionExtents`) | Same math (`app/geo.js`), proven identical at 60 positions per hole for Holes 1–9 |
| Flag yardage | From today's EZLocator pin | Sample pin only |
| Automatic hole | Nearest playing line, switches only if > 48 m off current line, nearest ≤ 45 m and ≥ 18 m clear of the next, 2 consecutive fixes | — |
| Hazards | — | Bunker/water front (reach) and carry, ±40 yd corridor, nearest 4, from mapped outlines |
| Green view | 18 approved images + EZLocator pins (per-hole entry, 18-pin sheet, daily rollover, sheet preload) | Approved images Holes 1–9, sample pin |
| Scoring | One round: strokes, putts, tee shot (hit/left/right/other), notes, pin note per hole; strokes, to-par, putts totals; scorecard table; tee + date; CSV export; fresh round. Key `pocasset_caddie_v1` | — |
| Pins storage | `pocasset_pins_v1` | — |
| Offline | Service worker, caches named `pocasset-caddie-*` (deletes only its own) | none |
| Scorecard | 6 tees, Green 6,015 / Blue 6,318 | per hole `card_yards` |

## 2. What to build (V3 only)
1. **Central scorecard** `data/scorecard/pocasset_scorecard.json`: 18 holes, par, handicap, six tees from the published card (preserved as `original`), plus the owner's newer Green/Blue figures as **provisional** (no club-issued confirmation found; sources and dates recorded). The app shows the provisional Green/Blue values, labelled, with the original available for comparison.
2. **Course data for all 18 holes**: GPS uses V2.3.1's own 18-hole green outlines and playing lines (locked copy, proven identical to the V2.3.1 page). Approved greens + EZLocator pin models ported for Holes 10–18 (checksum-verified, unchanged). Flyovers, mapped tees and hazards stay Holes 1–9 (Holes 10–18 say so on screen; standardizing them is the next build step).
3. **Integrated app** `/play/` (the existing `/holeNN/` pages stay):
   - Start/resume a round; confirm tee (Green default; Blue; all six available).
   - Header: hole, par, **CARD yardage for the selected tee** (fixed) kept visually separate from **LIVE GPS** front/centre/back (+ flag), with GPS status and accuracy.
   - Tabs **FLYOVER** (Tee/Approach art with live overlays and hazard list; Holes 10–18 show "flyover not built yet" + distances) · **GREEN** (approved image, EZLocator pin entry and 18-pin sheet) · **SCORE** (V2.3.1 fields and totals, scorecard, CSV, finish round → history).
   - Live GPS engine ported from V2.3.1 (same retry/watchdog/wake/permission behaviour, same away-from-course rule, same auto-hole thresholds); manual Previous/Next; simulated positions labelled; GPS position independent of the selected tee.
   - Tee positions: mapped tee for the selected set when it exists; otherwise the card yardage is shown with "GPS tee position not mapped"; a simulated start from another tee is labelled with its colour (never silently Gold for Green).
   - Hazards: reach/carry from the live position, every hazard tagged **unverified** (pre-2026-rebuild outlines; Hole 8 pond lidar-derived, approximate).
4. **Storage** (V3 keys only): `pocasset_v3:prefs` (tee, auto-hole, wake), `pocasset_v3:round`, `pocasset_v3:history`, `pocasset_v3:pins`. V2.3.1 keys are never read for writing, never written, never removed. A future score import from V2.3.1 would be a separate, explicit, read-only copy step.

## 3. Tests before publishing
Scorecard totals/values; live F/C/B and auto-hole vs V2.3.1 at sample points on all 18 holes; tee selection and persistence across reload; simulated positions; hazard reach/carry vs the build-time tables (Holes 1–9); approved green images byte-identical (SHA-256); EZLocator pin placement identical to V2.3.1 for the same pin numbers; score entry and totals vs V2.3.1 rules; V2.3.1 storage unchanged after a full V3 session; all nine `/holeNN/` pages still pass their release tests.

## 4. Risks
| Risk | Mitigation |
|---|---|
| **Same web address as V2.3.1** (both on scottamcintire.github.io): browser storage is shared by origin | V3 uses only `pocasset_v3:` keys; a test seeds V2.3.1 data, runs a V3 session and proves V2.3.1 data is byte-identical |
| Offline service worker could interfere with V2.3.1 caches | No V3 service worker in this release (V2.3.1's worker deletes only its own caches). Offline V3 later, with `pcv3-` caches and its own scope |
| Automatic hole picks a neighbouring hole where holes run side by side | V2.3.1's conservative rule unchanged; manual override always available; tested at points on every hole |
| Data not yet verified (outlines pre-rebuild; several tees unmapped; provisional scorecard) | Every number labelled by kind (CARD / LIVE GPS / UNVERIFIED hazard); missing tees stated, never invented |
| Pins entered in V2.3.1 don't appear in V3 (separate storage) | Enter pins in V3 while testing; a controlled import can come later |
| Page weight on the phone (flyover art, full-size greens for Holes 10–17) | Load per hole, on demand |
| iPhone background limits on GPS | Same behaviour as V2.3.1: resumes when the page is reopened; screen kept on while GPS runs |

## 5. As built (v4.0.0, 16 Nov 2026)
- Shared code: `app/caddie.js` (V2.3.1 GPS/auto-hole/pins/scoring rules + V3 storage + GPS controller), `app/flyover.js` (overlay drawing moved out of the hole page unchanged — hole-page screenshots pixel-identical), `app/green.js` (+ V2.3.1's dashed sample flag), `app/geo.js`.
- Page: `prototype/play_src/index.html`, built by `tools/build_play.py` into `/play/`.
- Scorecard: `data/scorecard/pocasset_scorecard.json` (tests/test_scorecard.py).
- Tests: `tests/test_play.js` — 38 checks (see RELEASES.md v4.0.0), plus all nine hole-page release tests.
- Not included: offline service worker (deliberately, to stay clear of V2.3.1's), club distances list, pin-sheet photo, migration of V2.3.1 rounds (only an explicit read-only copy of *today's pins*).
