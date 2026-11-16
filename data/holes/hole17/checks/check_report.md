# Hole 17 — automated check (2026-11-16)

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
| FLAG | tee sets without a mapped tee | Silver |
| PASS | green area | 341 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H17-TE-01 vs scorecard | 530 yd → Gold, Blue |
| PASS | tee H17-TE-02 vs scorecard | 490 yd → Green, White |
| PASS | tee H17-TE-03 vs scorecard | 456 yd → Bronze |
| FLAG | features awaiting verification | 11 of 11 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_17/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H17-TE-01 | green F/C/B (production method) | 493 / 505 / 519 |
| H17-TE-01 | H17-BK-01 (L) | reach 331 · carry 345  (line through hazard) |
| H17-TE-01 | H17-BK-02 (L) | reach 375 · carry 386  (line through hazard) |
| H17-TE-01 | H17-BK-03 (green-front-right) | reach 494 · carry 502  (line through hazard) |
| H17-TE-02 | green F/C/B (production method) | 462 / 475 / 489 |
| H17-TE-02 | H17-BK-01 (L) | reach 298 · carry 314  (line through hazard) |
| H17-TE-02 | H17-BK-02 (L) | reach 344 · carry 355  (line through hazard) |
| H17-TE-02 | H17-BK-03 (green-front-right) | reach 462 · carry 471  (line through hazard) |
| H17-TE-03 | green F/C/B (production method) | 427 / 441 / 455 |
| H17-TE-03 | H17-BK-01 (L) | reach 263 · carry 279  (line through hazard) |
| H17-TE-03 | H17-BK-02 (L) | reach 309 · carry 320  (line through hazard) |
| H17-TE-03 | H17-BK-03 (green-front-right) | reach 428 · carry 436  (line through hazard) |
