# Hole 14 — automated check (2026-11-17)

Result: **OK to continue (flags need review)** · 11 pass · 4 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Blue, White, Silver |
| PASS | green area | 359 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H14-TE-01 vs scorecard | 388 yd → Gold |
| PASS | tee H14-TE-03 vs scorecard | 359 yd → Green |
| PASS | tee H14-TE-06 vs scorecard | 298 yd → Bronze |
| FLAG | features awaiting verification | 15 of 15 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_14/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H14-TE-01 | green F/C/B (production method) | 370 / 383 / 395 |
| H14-TE-01 | H14-BK-01 (green-front-left) | reach 347 · carry 358  (line through hazard) |
| H14-TE-01 | H14-BK-02 (green-front-left) | reach 360 · carry 365  (line through hazard) |
| H14-TE-01 | H14-BK-03 (green-front-right) | reach 364 · carry 380  (line through hazard) |
| H14-TE-03 | green F/C/B (production method) | 340 / 353 / 365 |
| H14-TE-03 | H14-BK-01 (green-front-left) | reach 318 · carry 328  (line through hazard) |
| H14-TE-03 | H14-BK-02 (green-front-left) | reach 330 · carry 335  (line through hazard) |
| H14-TE-03 | H14-BK-03 (green-front-right) | reach 334 · carry 351  (line through hazard) |
| H14-TE-06 | green F/C/B (production method) | 281 / 293 / 305 |
| H14-TE-06 | H14-BK-01 (green-front-left) | reach 259 · carry 269  (line through hazard) |
| H14-TE-06 | H14-BK-02 (green-front-left) | reach 271 · carry 276  (line through hazard) |
| H14-TE-06 | H14-BK-03 (green-front-right) | reach 274 · carry 290  (line through hazard) |
