# Hole Validation

*Quality control for every hole. A hole's stage is "approved" only when A–F all pass. Each checkpoint result goes into the hole's `status.json`, with the date, who checked it and a note.*

**Stages:**
- **awaiting data:** A not passed.
- **in development:** A passed or in progress; working on B–E.
- **awaiting approval:** B, D and E pass; waiting for the owner on C and F.
- **approved:** A–F pass and the hole is promoted (`approved/vN`).

**Any failed check** moves the hole back to "in development", with the reason recorded.

---

## A. Geographic data complete

| Check | Pass rule | How |
|---|---|---|
| Required classes | Playing line, green, ≥1 tee, ≥1 fairway (not needed on par 3) | `pcv3.py check` (automatic) |
| Gaps documented | Every class not in the source is listed in `hole.json → missing`, and the owner has seen the list | check report + owner |
| Terrain + trees | Lidar-derived height grid and tree positions exist for the hole, **or** the owner has explicitly accepted "flat / no trees" for this version | Stage 3 tools |
| Tee sets | Each scorecard tee set either has a mapped tee or is listed as unmapped | `pcv3.py check` |
| Source integrity | Source checksum matches `SOURCES.lock.json` | automatic, every run |

## B. Geographic layout verified

| Check | Pass rule | How |
|---|---|---|
| Imagery review | Every green, bunker, water and tee outline compared with imagery taken **after the bunker and tee restoration**, with the imagery date recorded | `checks/holeNN_check.kml` in Google Earth Pro (History slider shows dates) |
| Per-feature record | Every hazard has a `verification.json` record: verified (≤2 yd), approximate (≤5 yd) or wrong | owner + Claude |
| No wrong features | 0 features marked `wrong` remain. Wrong → new source → re-standardize | |
| Missing features | Any hazard seen on imagery or on the course but absent from the data is recorded, and captured before approval | |
| Optional on-course spot check | 3+ points (bunker edges, green front) captured with the phone; median difference ≤3 yd | V3 test page (after publishing approval) |

## C. Flyover visually approved

| Check | Pass rule |
|---|---|
| Style | Matches the shared style reference: camera angle, grass, sand, water, trees, light, labels |
| Truth | Every hazard in the image is at its mapped position (automatic alignment test: projected outlines within 2 px of the rendered edges). Nothing in the image is absent from the data, and nothing in the data is missing from the image |
| Owner sign-off | Owner compares Tee and Approach views with the real hole. "Looks good" alone is not a pass if any hazard is misplaced |

## D. GPS calculations validated

| Check | Pass rule | How |
|---|---|---|
| Green F/C/B | Identical to the production method for ≥50 simulated positions along the hole | automated test |
| Hazard reach/carry | Match the reference table from `pcv3.py check` (±1 yd) at each tee and at 150/100 yd points | automated test |
| Side / across labels | Every displayed hazard's label matches its `position` | automated test |
| Uncertainty display | Numbers dim at accuracy worse than ±10 yd | automated test |
| On course | At 3+ spots, app yardages within ±5 yd of a rangefinder or sprinkler head | owner, on course |

## E. Green system preserved

| Check | Pass rule | How |
|---|---|---|
| Originals | All 112 approved files match `approved_manifest.json` | `pcv3.py verify-greens --master …` |
| V3 copies | Byte-identical to the originals | automated test |
| Pin model | Flag within 0.06 px of the approved page for the sample pin; today's-pin flag yardage identical to V2.3.1 | automated test |
| Independence | Green view shows no flyover drawing; the flyover never modifies green code or files | automated test + review |

## F. iPhone testing completed

| Check | Pass rule |
|---|---|
| Loads on the V3 test site | Safari on the iPhone, from a clean start and offline after one load |
| Views | Tee view, Approach view and GREEN button all work; no zoom on fast taps; readable in sunlight |
| GPS | Live GPS stays on (weak signal, unlock, reload); distances update while walking |
| Isolation | Production app still works and still shows the same round afterwards |
| Owner sign-off | Owner confirms on the course |

---

## Recording a result (example)

```json
"B_layout_verified": {"state": "pass", "date": "2026-11-20", "by": "owner + Claude",
  "note": "Google Earth imagery 2026-06; 2 bunkers verified (≤2 yd), pond verified, tees approximate"}
```

**States:** `pending`, `in_progress`, `pass`, `fail`. The 18-hole table ([HOLE_PROGRESS.md](HOLE_PROGRESS.md)) is regenerated from these files with `pcv3.py inventory`.
