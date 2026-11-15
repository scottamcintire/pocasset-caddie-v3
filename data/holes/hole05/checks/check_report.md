# Hole 5 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 9 pass · 6 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| FLAG | not mapped in source: path | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | White, Bronze, Silver |
| PASS | green area | 501 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H05-TE-01 vs scorecard | 335 yd → Gold, Blue, Green |
| FLAG | tee H05-TE-02 vs scorecard | 2 yd → no card tee within 10 yd |
| FLAG | features awaiting verification | 10 of 10 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_05/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H05-TE-01 | green F/C/B (production method) | 318 / 333 / 348 |
| H05-TE-01 | H05-BK-01 (R) | reach 246 · carry 251  (line through hazard) |
| H05-TE-01 | H05-BK-02 (green-front-right) | reach 301 · carry 310  (line through hazard) |
| H05-TE-01 | H05-BK-03 (green-front-left) | reach 308 · carry 313  (line through hazard) |
| H05-TE-01 | H05-BK-04 (green-front-left) | reach 309 · carry 314  (line through hazard) |
| H05-TE-01 | H05-BK-05 (green-front-left) | reach 318 · carry 324  (line through hazard) |
| H05-TE-02 | green F/C/B (production method) | 28 / 41 / 53 |
| H05-TE-02 | H05-BK-01 (R) | reach 110 · carry 123  (line through hazard) |
| H05-TE-02 | H05-BK-02 (green-front-right) | reach 67 · carry 73  (line through hazard) |
| H05-TE-02 | H05-BK-03 (green-front-left) | reach 40 · carry 50  (line through hazard) |
| H05-TE-02 | H05-BK-04 (green-front-left) | reach 36 · carry 44  (line through hazard) |
| H05-TE-02 | H05-BK-05 (green-front-left) | reach 29 · carry 36  (line through hazard) |
