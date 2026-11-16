# Hole 16 — automated check (2026-11-16)

Result: **OK to continue (flags need review)** · 12 pass · 5 flag · 0 stop

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
| FLAG | tee sets without a mapped tee | Blue, Silver |
| PASS | green area | 450 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H16-TE-01 vs scorecard | 496 yd → Gold |
| PASS | tee H16-TE-02 vs scorecard | 472 yd → Green |
| PASS | tee H16-TE-03 vs scorecard | 448 yd → White |
| PASS | tee H16-TE-04 vs scorecard | 426 yd → Bronze |
| FLAG | features awaiting verification | 10 of 10 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_16/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H16-TE-01 | green F/C/B (production method) | 481 / 495 / 508 |
| H16-TE-01 | H16-BK-01 (R) | reach 231 · carry 256  (line through hazard) |
| H16-TE-01 | H16-BK-02 (green-back) | reach 512 · carry 515  (line through hazard) |
| H16-TE-02 | green F/C/B (production method) | 457 / 471 / 484 |
| H16-TE-02 | H16-BK-01 (R) | reach 208 · carry 232  (line through hazard) |
| H16-TE-02 | H16-BK-02 (green-back) | reach 488 · carry 491  (line through hazard) |
| H16-TE-03 | green F/C/B (production method) | 433 / 446 / 459 |
| H16-TE-03 | H16-BK-01 (R) | reach 183 · carry 208  (line through hazard) |
| H16-TE-03 | H16-BK-02 (green-back) | reach 463 · carry 467  (line through hazard) |
| H16-TE-04 | green F/C/B (production method) | 411 / 425 / 437 |
| H16-TE-04 | H16-BK-01 (R) | reach 163 · carry 187  (line through hazard) |
| H16-TE-04 | H16-BK-02 (green-back) | reach 442 · carry 445  (line through hazard) |
