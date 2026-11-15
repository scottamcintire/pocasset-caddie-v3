# Hole 7 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 10 pass · 4 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | White, Bronze, Silver |
| PASS | green area | 352 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H07-TE-01 vs scorecard | 382 yd → Gold, Blue |
| PASS | tee H07-TE-02 vs scorecard | 350 yd → Green |
| FLAG | features awaiting verification | 16 of 16 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_07/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H07-TE-01 | green F/C/B (production method) | 356 / 370 / 386 |
| H07-TE-01 | H07-BK-01 (R) | reach 221 · carry 236  (line through hazard) |
| H07-TE-01 | H07-BK-02 (R) | reach 244 · carry 256  (line through hazard) |
| H07-TE-01 | H07-BK-03 (L) | reach 276 · carry 291  (line through hazard) |
| H07-TE-01 | H07-BK-04 (L) | reach 320 · carry 332  (line through hazard) |
| H07-TE-01 | H07-BK-05 (R) | reach 306 · carry 323  (line through hazard) |
| H07-TE-01 | H07-BK-06 (green-front-right) | reach 343 · carry 354  (line through hazard) |
| H07-TE-01 | H07-BK-07 (green-front-left) | reach 362 · carry 374  (line through hazard) |
| H07-TE-02 | green F/C/B (production method) | 325 / 339 / 355 |
| H07-TE-02 | H07-BK-01 (R) | reach 189 · carry 204  (line through hazard) |
| H07-TE-02 | H07-BK-02 (R) | reach 212 · carry 224  (line through hazard) |
| H07-TE-02 | H07-BK-03 (L) | reach 244 · carry 259  (line through hazard) |
| H07-TE-02 | H07-BK-04 (L) | reach 288 · carry 300  (line through hazard) |
| H07-TE-02 | H07-BK-05 (R) | reach 275 · carry 291  (line through hazard) |
| H07-TE-02 | H07-BK-06 (green-front-right) | reach 312 · carry 322  (line through hazard) |
| H07-TE-02 | H07-BK-07 (green-front-left) | reach 330 · carry 342  (line through hazard) |
