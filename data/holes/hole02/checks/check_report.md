# Hole 2 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 12 pass · 3 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Silver |
| PASS | green area | 520 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H02-TE-01 vs scorecard | 462 yd → Gold |
| PASS | tee H02-TE-02 vs scorecard | 422 yd → Blue |
| PASS | tee H02-TE-03 vs scorecard | 367 yd → Green, White |
| PASS | tee H02-TE-04 vs scorecard | 344 yd → Bronze |
| FLAG | features awaiting verification | 15 of 15 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_02/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H02-TE-01 | green F/C/B (production method) | 442 / 456 / 472 |
| H02-TE-01 | H02-BK-01 (green-front) | reach 420 · carry 437  (line through hazard) |
| H02-TE-01 | H02-BK-02 (green-back) | reach 474 · carry 482  (line through hazard) |
| H02-TE-01 | H02-WA-01 (across) | reach 386 · carry 413  (along playing line from the tee) |
| H02-TE-02 | green F/C/B (production method) | 402 / 416 / 432 |
| H02-TE-02 | H02-BK-01 (green-front) | reach 380 · carry 398  (line through hazard) |
| H02-TE-02 | H02-BK-02 (green-back) | reach 435 · carry 443  (line through hazard) |
| H02-TE-02 | H02-WA-01 (across) | reach 345 · carry 372  (along playing line from the tee) |
| H02-TE-03 | green F/C/B (production method) | 352 / 366 / 381 |
| H02-TE-03 | H02-BK-01 (green-front) | reach 328 · carry 347  (line through hazard) |
| H02-TE-03 | H02-BK-02 (green-back) | reach 384 · carry 392  (line through hazard) |
| H02-TE-03 | H02-WA-01 (across) | reach 293 · carry 320  (along playing line from the tee) |
| H02-TE-04 | green F/C/B (production method) | 329 / 344 / 359 |
| H02-TE-04 | H02-BK-01 (green-front) | reach 306 · carry 324  (line through hazard) |
| H02-TE-04 | H02-BK-02 (green-back) | reach 362 · carry 370  (line through hazard) |
| H02-TE-04 | H02-WA-01 (across) | reach 270 · carry 297  (along playing line from the tee) |
