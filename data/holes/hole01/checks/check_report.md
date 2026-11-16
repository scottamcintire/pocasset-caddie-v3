# Hole 1 — automated check (2026-11-15)

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
| PASS | green area | 353 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H01-TE-02 vs scorecard | 475 yd → Gold, Blue, Green, White |
| PASS | tee H01-TE-03 vs scorecard | 473 yd → Gold, Blue, Green, White |
| PASS | tee H01-TE-04 vs scorecard | 449 yd → Bronze |
| FLAG | features awaiting verification | 16 of 16 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_01/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H01-TE-02 | green F/C/B (production method) | 455 / 468 / 482 |
| H01-TE-02 | H01-BK-01 (R) | reach 264 · carry 298  (line through hazard) |
| H01-TE-02 | H01-BK-02 (L) | reach 403 · carry 406  (line through hazard) |
| H01-TE-02 | H01-BK-03 (L) | reach 409 · carry 414  (line through hazard) |
| H01-TE-02 | H01-BK-04 (R) | reach 417 · carry 426  (line through hazard) |
| H01-TE-02 | H01-BK-05 (green-front-right) | reach 435 · carry 452  (line through hazard) |
| H01-TE-02 | H01-BK-06 (green-left) | reach 466 · carry 481  (line through hazard) |
| H01-TE-03 | green F/C/B (production method) | 453 / 466 / 480 |
| H01-TE-03 | H01-BK-01 (R) | reach 258 · carry 292  (line through hazard) |
| H01-TE-03 | H01-BK-02 (L) | reach 401 · carry 405  (line through hazard) |
| H01-TE-03 | H01-BK-03 (L) | reach 408 · carry 413  (line through hazard) |
| H01-TE-03 | H01-BK-04 (R) | reach 415 · carry 424  (line through hazard) |
| H01-TE-03 | H01-BK-05 (green-front-right) | reach 433 · carry 450  (line through hazard) |
| H01-TE-03 | H01-BK-06 (green-left) | reach 464 · carry 479  (line through hazard) |
| H01-TE-04 | green F/C/B (production method) | 429 / 442 / 455 |
| H01-TE-04 | H01-BK-01 (R) | reach 238 · carry 272  (line through hazard) |
| H01-TE-04 | H01-BK-02 (L) | reach 377 · carry 381  (line through hazard) |
| H01-TE-04 | H01-BK-03 (L) | reach 383 · carry 389  (line through hazard) |
| H01-TE-04 | H01-BK-04 (R) | reach 391 · carry 400  (line through hazard) |
| H01-TE-04 | H01-BK-05 (green-front-right) | reach 409 · carry 426  (line through hazard) |
| H01-TE-04 | H01-BK-06 (green-left) | reach 440 · carry 455  (line through hazard) |
