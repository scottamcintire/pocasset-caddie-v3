# Look options + Hole 8 pond (15 Nov 2026) — PREVIEWS ONLY, NOT APPROVED, NOT PUBLISHED

Review page: claude.ai "Pocasset V3 look options" (copy: look_options.html).

- **Hole 8 pond** (owner: "a small pond right in front of the tee box"): missing from the OpenStreetMap source. Found in the 2021 lidar as a basin with a dead-flat floor at 5.0 m, ~28 x 44 m (~1,000 m2), 25-45 m in front of the tees, left of the line. Outline: connected area within 0.15 m of the flat surface, smoothed (`hole08_pond_lidar_derived.geojson`). If approved: a separate locked "lidar-derived features" source merged at standardize time (the OSM file is never edited); status unverified until confirmed on the course; it adds Hole 8 hazard yardages.
- **Option A woods** (S1): trees.height_m 13 -> 8, trees.threshold 0.45 -> 0.6. Visible gain on Holes 4 and 8; removes most of the Hole 2 knoll trees (small group below the threshold). Suggested next: height only.
- **Option B shading** (S2 moderate: shade_gain 2.0, relief_exaggeration 11; S2b strong: + ambient 0.42, diffuse 0.75, shade_gain 2.8, relief_exaggeration 14). Only the strong version is noticeable.
All rendered in isolated copies; the published site, Hole 2 approved artwork, greens, EZLocator, GPS and V2.3.1 unchanged.

## Round 2 (owner: "keep pond, preview the shorter only, show me strong shading")
- Pond: approved and published (release v3.7.0-hole08-pond).
- **S4 shorter only**: trees.height_m 13 -> 8, density unchanged. Hole 2 keeps every knoll tree (3% of pixels change); Hole 4 12%, Hole 8 20%.
- **S2b strong shading** on Holes 2 and 8: Hole 2 knoll/valley much stronger and slightly darker (5%); Hole 8 little change (3%).
Review page v2: look_options_v2.html. Awaiting the owner's decision.
