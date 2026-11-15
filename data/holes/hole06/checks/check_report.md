# Hole 6 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 8 pass · 6 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| FLAG | not mapped in source: path | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Blue, Green, White, Bronze, Silver |
| PASS | green area | 411 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H06-TE-01 vs scorecard | 208 yd → Gold |
| FLAG | tee H06-TE-02 vs scorecard | 1 yd → no card tee within 10 yd |
| FLAG | features awaiting verification | 9 of 9 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_06/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H06-TE-01 | green F/C/B (production method) | 196 / 211 / 226 |
| H06-TE-01 | H06-BK-01 (L) | reach 116 · carry 126  (line through hazard) |
| H06-TE-01 | H06-BK-02 (green-front-left) | reach 180 · carry 200  (line through hazard) |
| H06-TE-01 | H06-BK-03 (green-front-right) | reach 183 · carry 193  (line through hazard) |
| H06-TE-01 | H06-BK-04 (green-front-right) | reach 197 · carry 206  (line through hazard) |
| H06-TE-02 | green F/C/B (production method) | 37 / 49 / 58 |
| H06-TE-02 | H06-BK-01 (L) | reach 94 · carry 105  (line through hazard) |
| H06-TE-02 | H06-BK-02 (green-front-left) | reach 35 · carry 48  (line through hazard) |
| H06-TE-02 | H06-BK-03 (green-front-right) | reach 62 · carry 71  (line through hazard) |
| H06-TE-02 | H06-BK-04 (green-front-right) | reach 63 · carry 68  (line through hazard) |
