# Flyover Rendering Standard

**Version 1.0: approved visual baseline (owner, 15 Nov 2026).** The Hole 2 V2 appearance is the standard look for every V3 hole: lighting, textures, colours, mowing, sand, water, illustrative woods, sky and haze, 1.5× terrain exaggeration, and the camera approach (§7). Locked in `style/approved/VISUAL_BASELINE_v1.0.json`.

> **Change rule:** no significant visual change without discussing it with the owner first. `tools/render_flyover.py` stops if `style/flyover_style.json` differs from the approved copy, unless the run names an owner-approved change recorded in DECISIONS.md (`PCV3_STYLE_CHANGE_APPROVED`). Renderer code changes must keep `tests/test_visual_baseline.py --render` passing (Hole 2 re-renders byte-identical) or be discussed first. Per-hole camera distances may be tuned so a hole fits; the approach stays the same.
>
> **Scope:** visual approval only. Outlines, rebuilt bunkers, the Green tee position, GPS calculations and iPhone behaviour are approved separately through HOLE_VALIDATION.md checkpoints. Approved green heat maps and the EZLocator pin system are untouched by rendering.

*History: draft 0.1 (flat ground, no trees), draft 0.2 (this renderer) approved as v1.0 without changes.*
*Draft 0.1 (flat ground, no trees) is preserved: code `tools/archive/render_flyover_v0.1.py`, style `style/archive/flyover_style_v0.1.json`, renders `data/holes/hole02/render/v0.1/`, prototype `prototype/hole02_v0.1/`.*

## 1. Principle: independent layers

| Layer | Files | Who changes it | What it can change |
|---|---|---|---|
| **Geography** | `data/holes/holeNN/features.geojson`, `hole.json` (from `pcv3.py standardize`) | Data process only (HOLE_BUILD_STANDARD.md) | Where things are |
| **Terrain** | locked lidar grid → `data/holes/holeNN/terrain.json` (`tools/terrain.py grid`) | Data process only | The shape of the ground |
| **Woods (illustrative)** | locked canopy grid (`data/sources/canopy/`) | Data process only | *Where* woods may be drawn |
| **Appearance** | `style/flyover_style.json` (one file for all 18 holes) + `tools/render_flyover.py` | Style work, at any time | Colours, mowing, sand, water, lighting, shadows, haze, tree crowns and height, vertical exaggeration, cosmetic edge shapes |
| **Camera** | `data/holes/holeNN/camera.json` (one per hole) | Framing per hole | What part of the hole each view shows |
| **Live overlays** | `app/geo.js` (distances, projection), app page (labels) | App work | Numbers and markers drawn on top at runtime, never baked into the picture |

**Consequences:**
- **Improving the look does not touch geography, terrain or GPS:** edit `style/flyover_style.json`, then re-render.
- **Correcting a bunker does not touch the style:** fix the data, then re-standardize and re-render.
- **Distances never come from the picture or from the terrain.** They come from the coordinates (flat GPS distances, as in production V2.3.1).

## 2. Inputs and outputs per view

**Inputs:** this hole's standardized features; neighbouring holes' mapped features (same locked source, drawn muted); the locked lidar grid; the locked canopy grid; the style file; the hole's camera settings.

**Outputs** (in `data/holes/holeNN/render/`):

| File | Content |
|---|---|
| `holeNN_<view>.jpg` | The illustration, 1170 px wide (3× an iPhone width); Tee 1170 × 1440 and Approach 1170 × 1400, so a whole view fits an iPhone screen under the yardage header without scrolling |
| `holeNN_<view>.json` | The **projection** (schema `flyover-projection@2`): a 3×4 camera matrix mapping hole-frame (u, v, z) to pixels, the **height model** (terrain.json, its SHA-256, z reference, vertical exaggeration), the camera, the hole frame, and SHA-256 of every input (features, camera, style, course source, elevation source, canopy source) |
| `holeNN_<view>_ids.png` | Material ID per pixel (rough, fairway, green, tee, bunker, water, path, tree, …), used by the alignment test |
| `holeNN_<view>_alignment.png` | QA: every mapped outline of the hole drawn in red through the stored projection |

**How the app uses the projection:** `pixel = M · [u, v, z, 1]` with `z = (terrain(u,v) − z_ref) × exaggeration` (`app/geo.js` `View.project`). A tap is converted back to the ground by marching the camera ray over the same terrain (`View.unproject`). Overlays sit on the ground (bare earth), never on tree tops.

## 3. How the picture is made (`tools/render_flyover.py`)

1. **World rasters (0.5 m, whole lidar tile, hole frame):**
   - bare ground from the lidar, relative to the green centre, × `terrain.vertical_exaggeration` (1.5 for Pocasset's gentle ground; stated in every projection JSON);
   - outside the lidar tile: heights held at the nearest measured value and drawn as haze, never as invented land;
   - woods: canopy fraction from the canopy grid, **cleared from every mapped playing surface plus `trees.clear_buffer_m`** (fairways, greens, tees, bunkers, water, paths). Crowns are world-anchored cells (`crown_cell_m`); each crown exists only if the canopy grid shows canopy at its centre; its height is `trees.height_m` × random 0.8–1.2 with a rounded profile (`crown_shape`). All of that is illustrative;
   - sun shadows (marched toward the light over ground + crowns) and ambient occlusion.
2. **Camera from plain settings** (`camera.json`): the tee to look from (or a distance short of the green), distance back, height above that ground, ground to show behind the tee and beyond the green, optional side shift and output height. The tool solves pitch and field of view using the real ground heights at those points.
3. **Ray-march:** every output pixel's ray (at 2× supersampling) finds its first intersection with ground + crowns (160 steps + 8 bisections). Rays that hit nothing show sky; distance gives haze.
4. **Textures (top-down, hole frame, baked lighting):**
   - a *detail* canvas over the visible part of the hole at the view's `texture_px_per_m` (Tee 7, Approach 24; capped at `max_canvas_px`), and a *distance* canvas over the whole tile at `coarse_px_per_m`, blended over 25 m;
   - painted from outlines only, in this order: rough (patchy, with drier patches), off-course land (muted), fairways (mowing bands across each hole's own line + light cross-cut) and first cut, cart paths, water (depth tint + bank), tees (striped), green collar and green (fine diagonal mowing), bunkers (grass lip, sand grain, shaded faces), neighbouring holes muted, illustrative crowns;
   - noise octaves finer than ~2.5 texels are dropped so distant ground never aliases into a grid;
   - lighting: lidar ground (smoothed by `shade_smooth_m`, since the lidar is 2 m) × `shade_gain`, + cosmetic edge shapes × `relief_exaggeration`, + crowns; sun from the camera's front-left (same for every hole), with shadows and ambient occlusion.
5. **Compose (screen space):** mip-mapped texture lookup; foliage detail and darker crown bases on tree pixels (no stretched texture on crown sides); fine grass texture near the camera; water Fresnel sky reflection and sparkle; sky; distance haze; gentle grade; vignette; downsample to output.
6. **Never drawn:** flags (today's pin is a live overlay), labels, the player, yardages (all live overlays). Trees are never drawn from imagination: only where the canopy grid says.

## 4. What is real and what is style

| Element | Real (data) | Style / illustrative |
|---|---|---|
| Fairway, green, tee, bunker, water, path outlines | ✔ positions and shapes (OSM-derived, unverified) | colours, mowing patterns, lip, grain |
| Ground shape | ✔ 2021 lidar (2 m) | 1.5× vertical exaggeration; smoothing for lighting |
| Bunker depth, tee/green edge shapes | — (the lidar predates the rebuild and is too coarse) | ✔ cosmetic |
| Where woods are | ✔ 2023 imagery canopy (approximate, unverified) | — |
| Individual trees, heights, crown shapes, colours | — | ✔ illustrative |
| Shadows | follow the illustrative trees and real ground | ✔ |

## 5. Alignment guarantees (automated)

| Test | Rule |
|---|---|
| `tests/test_alignment.py` | Points inside every bunker, water and green outline (1.5 m in from the edge) are projected exactly as the app does (matrix + terrain). At each pixel the material ID must be that surface (≥95%) and the colour must be in its family. Points hidden behind illustrative woods are reported, not failed. |
| `*_alignment.png` | Red outlines (projected with terrain) sit on painted edges |
| `tests/test_prototype.js` | Browser projection = Python renderer projection (< 0.05 px); tap → ground → picture round trip < 0.5 px |

## 6. Commands

Approved files: `style/approved/flyover_style_v1.0.json`, `render_flyover_v1.0.py`, `terrain_v1.0.py` (read-only copies), Hole 2 reference renders in `data/holes/hole02/render/approved_visual_v1.0/`.

```
python3 tools/terrain.py check --hole 2       # lidar registration QA (once per hole)
python3 tools/terrain.py grid  --hole 2       # terrain.json for renderer and app
python3 tools/render_flyover.py --hole 2      # both views (about 2 min each on 2 CPU cores)
python3 tests/test_alignment.py --hole 2
python3 -I tools/build_prototype.py --hole 2
node tests/test_prototype.js
python3 tests/test_visual_baseline.py [--render]   # approved look unchanged
```

The renderer needs `numpy`, `scipy`, `opencv-python`. The data tools (`pcv3.py`) still need only Python's standard library; `terrain.py` needs numpy.

## 7. Per-hole checklist (v1.0)

1. **Data ready:** `standardize` and `check` done; the hole's area lies inside the locked lidar and canopy grids (`terrain.py grid` stops if it does not; then fetch the next tile the same way, HOLE_BUILD_STANDARD.md §5a).
2. **Terrain QA:** `terrain.py check`: tees and greens should sit on flat platforms; water on flat (hydro-flattened) ground. Look at `checks/terrain_registration.png`.
3. **Camera:** copy Hole 2's `camera.json` pattern. Tee view: look from the owner's primary tee (Green), back ≈ 95 m, height ≈ 105 m; adjust until the whole hole and the green fit. Approach: about 100–110 m short of the green, 1170 × 1400.
4. **Render and test:** both views; the alignment test must pass.
5. **Review:** the owner compares with the real hole and the style reference (checkpoint C).
6. **Freeze:** `pcv3.py promote` freezes the approved renders with their projections.

## 8. Known limits of v1.0
- **Trees are illustrative** (positions from 2023 imagery; shapes invented). Tree removal since 2023 is not reflected.
- **Lidar is 2021**, before the bunker and tee rebuild; bunker depths and tee shapes are cosmetic.
- **Exaggeration 1.5×** makes slopes look steeper than they are (deliberate, stated).
- **Heightfield trees** cannot show trunks or overhangs; crown sides are textured in screen space.
- **Render time** about 2 minutes per view on 2 cores; fine for pre-rendering, not for live use.

## Additions after v1.0 (15 Nov 2026), no change to the approved look
- **Camera per hole:** `tools/make_camera.py` applies the approved Hole 2 camera pattern scaled by hole length (k = L/336 m, clamped). Hole 2 keeps its approved camera.
- **QA output:** the renderer also writes `holeNN_<view>_depth.npz` (ray distance per pixel). It is not part of the picture and lets the alignment test report hazards hidden behind illustrative woods as *hidden* rather than misaligned. Pictures and material-ID images are byte-identical with and without it (checked on Hole 1; visual baseline test PASS).
- **Grids:** each hole uses the first locked lidar/canopy grid that covers it (DATA_SOURCES.md §2e).
- Open question for the owner: crown clearance over playing surfaces (PROBLEM_REPORT.md item 1). It stays off until approved.

## Terrain and visual-consistency audit (15 Nov 2026) — findings; proposals awaiting owner approval
Owner asked why Holes 4 and 8 look flatter than Hole 2. Tool: `python3 tools/terrain_audit.py --holes 1 2 … 9` (elevation at the tee and green, corridor range ±40 m of the line, profile, across-hole relief after removing the along-line trend, slope, camera pitch, on-screen relief). Results: `audits/terrain_2026-11-15/`; previews: `previews/terrain_2026-11-15/`; review page "Pocasset V3 terrain review".
- **Not the cause (checked):** lidar is valid on every hole (no flat fallback; only Hole 1's tee view shows 0.6% ground past the lidar edge); exaggeration 1.5x everywhere; light is camera-relative so identical; same style file; camera pitch 33–34° with the same 44.5° lens on Holes 2, 4, 8.
- **Causes:** (1) real terrain direction — Hole 2 falls 16 m into a valley with ponds, seen from above; Hole 4 climbs 12 m (gently, then ~7 m steeply to the green) with the slope facing the camera; (2) woods — 7% of Hole 2's tee picture vs 31% (4), 46% (8), up to 63% (6).
- **Learned about cameras:** moving the camera further back while lowering it narrows the lens (telephoto) and flattens the picture; closer **and** lower keeps a wide lens and adds perspective. Use that pattern when a hole-specific camera is needed.
- **Shared settings:** 1.0x / 1.5x / 2.0x and a side light change Hole 4 very little → recommendation: keep 1.5x and the current light (owner to confirm).
- **Proposed (not applied):** Hole 4 tee camera back 45/up 55; Hole 8 tee back 50/up 70/side +15 and approach back 5/up 40. Candidate previews next for Holes 1, 6, 7, 9 (most wooded). Published renders change only after owner approval, as a new release.
