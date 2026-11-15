# Flyover Rendering Standard

*Draft 0.1 (15 Nov 2026), proven on Hole 2. It becomes version 1.0 when the owner approves the Hole 2 flyover; after that, every hole is rendered exactly this way.*

## 1. Principle: three independent layers

| Layer | Files | Who changes it | What it can change |
|---|---|---|---|
| **Geography** | `data/holes/holeNN/features.geojson`, `hole.json` (from `pcv3.py standardize`) | Data process only (HOLE_BUILD_STANDARD.md) | Where things are |
| **Appearance** | `style/flyover_style.json` (one file for all 18 holes) + `tools/render_flyover.py` | Style work, at any time | Colours, grass stripes, sand, water, lighting, haze, cosmetic edge bevels, image size |
| **Camera** | `data/holes/holeNN/camera.json` (one per hole) | Framing per hole | What part of the hole each view shows |
| **Live overlays** | `app/geo.js` (distances), app page (labels) | App work | Numbers and markers drawn on top at runtime, never baked into the picture |

**Consequences:**
- **Improving the look does not touch geography or GPS:** edit `style/flyover_style.json`, then re-render.
- **Correcting a bunker does not touch the style:** fix the data, then re-standardize and re-render.
- **Distances never come from the picture.** They come from the coordinates.

## 2. Inputs and outputs per view

**Inputs:**
- this hole's standardized features
- neighbouring holes' mapped features from the same locked source, drawn slightly muted so the hole reads first
- the style file
- the hole's camera settings

**Outputs** (in `data/holes/holeNN/render/`):

| File | Content |
|---|---|
| `holeNN_<view>.jpg` | The illustration (default 1170 × 1800 px; 3× an iPhone width) |
| `holeNN_<view>.json` | The **projection**: a 3×3 matrix mapping hole-frame metres (u, v) to image pixels, plus the camera, the hole frame, and SHA-256 of every input (features, camera, style, course source) |
| `holeNN_<view>_alignment.png` | QA: every mapped outline drawn in red through the stored projection |

## 3. How the picture is made (`tools/render_flyover.py`)

1. **Camera from plain settings** (`camera.json`):
   - **Positioning:** the tee to look from (or a distance short of the green for the Approach view), the camera's distance back and height, and how much ground to show behind the tee and beyond the green.
   - **Solved by the tool:** pitch and field of view.
2. **Ground canvas** in the hole frame, covering exactly what the camera sees, at `texture_px_per_m` (default 8; a view may override it, e.g. Approach 18).
3. **Painted from outlines only, in this order:**
   1. rough
   2. off-course land, darker; nothing invented there
   3. fairways, with mowing stripes across each hole's own line, and the first cut
   4. cart paths
   5. water with a bank
   6. tees
   7. green collar and green
   8. bunkers, with a grass lip and sand
   9. neighbouring holes slightly muted

   Edges are anti-aliased from exact signed distances to each outline.
4. **Cosmetic relief (appearance only):**
   - small bevels at feature edges: bunkers dished, greens and tees slightly raised
   - lit from upper-left of the view, the same for every hole
   - no invented slopes or mounds
   - replaced by real lidar heights once elevation is approved
5. **Perspective:**
   - the canvas is projected through the camera, with mip-mapping so distant stripes don't shimmer
   - light distance haze and a soft vignette are added
   - rendered at 2× and downsampled
6. **Never drawn:**
   - trees (no tree-position source yet)
   - flags (today's pin is a live overlay)
   - labels, the player or yardages (all live overlays)

## 4. Alignment guarantees (automated)

| Test | Rule | Hole 2 result |
|---|---|---|
| `tests/test_alignment.py` | Inside every bunker, water and green outline (1.5 m in from the edge), ≥95% of rendered pixels are that surface | 100% for every feature in both views |
| Alignment image | Red outlines sit on painted edges | Visual check: exact |
| `tests/test_prototype.js` | Browser projection = renderer projection | 0.000 px difference |

## 5. Commands

```
python3 tools/render_flyover.py --hole 2 --view tee
python3 tools/render_flyover.py --hole 2 --view approach
python3 tests/test_alignment.py --hole 2
python3 -I tools/build_prototype.py --hole 2
node tests/test_prototype.js
```

The renderer needs `numpy`, `scipy`, `opencv-python` and `Pillow`, which are available in Claude's workspace. The data tools still need only Python's standard library.

## 6. Per-hole checklist (once v1.0 is approved)

1. **Data ready:** `standardize` and `check` done.
2. **Camera:** copy Hole 2's `camera.json` pattern, set the tee to look from, and adjust the back/height/behind/beyond values until the whole hole fits, as in Hole 2.
3. **Render and test:** render both views; the alignment test must pass.
4. **Review:** the owner compares with the real hole and the style reference (checkpoint C).
5. **Freeze:** `pcv3.py promote` freezes the approved renders with their projections.

## 7. Known limits of v0.1
- **No trees** (by decision) and **flat ground**. These are the two biggest gaps against the reference image, and both depend on the elevation decision.
- **Neighbouring holes are drawn** because they are real and mapped. They are muted, never removed.
- **Long holes:** the green is small in the tee view. The Approach view and the live labels compensate.
