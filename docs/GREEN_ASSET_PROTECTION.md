# Green Asset Protection

*Which green assets are approved, where the originals live, what depends on them, and how V3 uses them without changing them. 15 Nov 2026.*

## 1. The rule

The approved green heat maps and the EZLocator pin system are **finished, approved project assets**.

**V3 never:**
- regenerates, recolours, re-renders, crops, resizes or edits them
- moves or renames the originals

**V3 only ever:**
- **reads** them
- **copies** them byte-for-byte into `greens/`, and checks each copy against the master checksum

**Ask first:** any change that would touch green images, the pin model or the green display code needs the owner's approval *before* the work starts.

## 2. Originals (source of truth)

**Location:** Mac, `Documents/Pocasset AI Caddie/Pocasset_AI_Master/03_greens/hole_NN/approved/`.

- **Approval:** all 18 were visually approved by the owner, and the interactive pages were approved on the iPhone, by 26 Oct 2026. The Mac master's `00_INDEX/DECISIONS_LOG.md` has the details.
- **Checksums:** 112 approved files are listed with SHA-256 in `data/greens/approved_manifest.json`, taken from the master's `00_INDEX/SHA256SUMS.txt` on 15 Nov 2026.

Each folder holds:
- the approved green image at 2× and 1× (PNG)
- `index.html`, the approved interactive page, which carries the pin model
- `registration.json`
- `README.md`
- its own `SHA256SUMS.txt`

Hole 2's folder is the October "recovery master" and also holds extra QA layers (10 files).

| Hole | Master folder | Files | Approved images | Pin model | Model vs EZLocator dot (yd) |
|---|---|---|---|---|---|
| 1 | `03_greens/hole_01/approved/` | 6 | Pocasset_Hole01_Green_1876x2360.png<br>Pocasset_Hole01_Green_938x1180.png | course map | 0.84 |
| 2 | `03_greens/hole_02/approved/` | 10 | Pocasset_Hole02_Green_1400x1576.png<br>Pocasset_Hole02_Green_700x788.png | course map (image fit) | — |
| 3 | `03_greens/hole_03/approved/` | 6 | Pocasset_Hole03_Green_700x788.png | course map | 0.51 |
| 4 | `03_greens/hole_04/approved/` | 6 | Pocasset_Hole04_Green_1090x1103.png<br>Pocasset_Hole04_Green_2180x2206.png | course map | 0.31 |
| 5 | `03_greens/hole_05/approved/` | 6 | Pocasset_Hole05_Green_1726x2206.png<br>Pocasset_Hole05_Green_863x1103.png | course map | 1.06 |
| 6 | `03_greens/hole_06/approved/` | 6 | Pocasset_Hole06_Green_1660x2226.png<br>Pocasset_Hole06_Green_830x1113.png | course map | 0.13 |
| 7 | `03_greens/hole_07/approved/` | 6 | Pocasset_Hole07_Green_1662x2578.png<br>Pocasset_Hole07_Green_831x1289.png | course map | 0.40 |
| 8 | `03_greens/hole_08/approved/` | 6 | Pocasset_Hole08_Green_1964x2014.png<br>Pocasset_Hole08_Green_982x1007.png | course map | 1.18 |
| 9 | `03_greens/hole_09/approved/` | 6 | Pocasset_Hole09_Green_1990x1986.png<br>Pocasset_Hole09_Green_995x993.png | course map | 0.82 |
| 10 | `03_greens/hole_10/approved/` | 6 | Pocasset_Hole10_Green_1726x2056.png<br>Pocasset_Hole10_Green_863x1028.png | course map | 0.43 |
| 11 | `03_greens/hole_11/approved/` | 6 | Pocasset_Hole11_Green_1996x2312.png<br>Pocasset_Hole11_Green_998x1156.png | course map | 0.76 |
| 12 | `03_greens/hole_12/approved/` | 6 | Pocasset_Hole12_Green_1840x2246.png<br>Pocasset_Hole12_Green_920x1123.png | course map | 1.22 |
| 13 | `03_greens/hole_13/approved/` | 6 | Pocasset_Hole13_Green_1060x1069.png<br>Pocasset_Hole13_Green_2120x2138.png | course map | 0.73 |
| 14 | `03_greens/hole_14/approved/` | 6 | Pocasset_Hole14_Green_1972x2116.png<br>Pocasset_Hole14_Green_986x1058.png | EZLocator outline | 0.68* |
| 15 | `03_greens/hole_15/approved/` | 6 | Pocasset_Hole15_Green_1332x2212.png<br>Pocasset_Hole15_Green_666x1106.png | EZLocator outline | 0.70* |
| 16 | `03_greens/hole_16/approved/` | 6 | Pocasset_Hole16_Green_1031x1085.png<br>Pocasset_Hole16_Green_2062x2170.png | EZLocator outline | 0.78* |
| 17 | `03_greens/hole_17/approved/` | 6 | Pocasset_Hole17_Green_1580x2138.png<br>Pocasset_Hole17_Green_790x1069.png | course map | 0.73 |
| 18 | `03_greens/hole_18/approved/` | 6 | Pocasset_Hole18_Green_1025x1042.png<br>Pocasset_Hole18_Green_2050x2084.png | EZLocator outline | 0.77* |

\* not independent: the pin model *is* EZLocator's outline (rule: course map unless it is more than 1.5 yd from the dated PDF dot).

**Hole 2's master README notes:**
- Hole 2's `index.html` was recovered from the ChatGPT library copy of the refined test page.
- Its byte-match to the live `hold2-test/index.html` had not been confirmed at the time.
- **Now confirmed (15 Nov 2026):** its SHA-256 (6e17a845b3bc2334…) is identical to the live `hold2-test/index.html` in the production repository, so the two are the same file.

## 3. Derived copies that already exist (not originals)

| Copy | Where | Made how | Status |
|---|---|---|---|
| WebP display images, all 18 (q86, long side ≤1600 px) | production `greens/`, `greens-test/img/` | converted from the 2× masters, 26 Oct | Display copies. Pixels were checked visually, not byte-identical. Never a source for V3 |
| Pin model data (points, t, geoT, depth, sample) | embedded in production V2.3.1 `index.html` | parsed from each approved `index.html` + calibration v2 | Verified: flags within 0.064 px of the approved pages |

## 4. Dependencies (what the green view needs)

1. The approved image (protected copy).
2. The pin model per hole: `points` (green outline in pin-frame metres), `t` (image transform), `geoT` (course-map transform; for 14/15/16/18 the v2 calibration fit), depth.
3. The pin frame: origin, bearing, R = 6,371,008.8 m. This is the same frame the flyover uses (ARCHITECTURE.md §1).
4. EZLocator pin numbers: front, side, L/R, depth; typed or loaded from a dated sheet.
5. The display rule: rotate by −t.rotation_deg so the approach is at the bottom. The master images stay unrotated.

**Outstanding dependencies for V3:**
- V3's protected copies in `greens/` are not made yet (planned at Stage 4).
- The verbatim port of the pin model module is not made yet.
- **No hole is missing an approved green.**

## 5. How protection is checked

| Check | Command / test | When |
|---|---|---|
| Originals unchanged | `python3 -I tools/pcv3.py verify-greens --master "<path to Pocasset_AI_Master>"` (all 112 must match) | Before each build session and before any promotion |
| V3 copies identical to originals | Stage 4 test: SHA-256 of every file in `greens/` equals the manifest entry | Every test run |
| Flag positions unchanged | Stage 4 test: for each hole, V3 flag position equals the approved page's to within 0.06 px for the Oct 21 sample pins | Every test run |
| Green view not drawn on | Stage 4 test: the Green view's DOM contains no flyover layer | Every test run |
| No writes | The build tools never open master or `greens/` files for writing (code review rule; the test suite runs on a copy) | Always |
