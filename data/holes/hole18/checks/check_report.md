# Hole 18 — automated check (2026-11-16)

Result: **OK to continue (flags need review)** · 11 pass · 3 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| PASS | green area | 574 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H18-TE-01 vs scorecard | 410 yd → Gold, Blue |
| PASS | tee H18-TE-02 vs scorecard | 386 yd → Green |
| PASS | tee H18-TE-05 vs scorecard | 324 yd → White, Bronze, Silver |
| FLAG | features awaiting verification | 16 of 16 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_18/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H18-TE-01 | green F/C/B (production method) | 401 / 416 / 430 |
| H18-TE-01 | H18-BK-01 (L) | reach 218 · carry 230  (line through hazard) |
| H18-TE-01 | H18-BK-02 (green-front) | reach 377 · carry 391  (line through hazard) |
| H18-TE-01 | H18-BK-03 (green-front-left) | reach 386 · carry 402  (line through hazard) |
| H18-TE-01 | H18-BK-04 (green-front-right) | reach 389 · carry 401  (line through hazard) |
| H18-TE-01 | H18-BK-05 (L) | reach 491 · carry 497  (line through hazard) |
| H18-TE-01 | H18-BK-06 (green-back-left) | reach 418 · carry 424  (line through hazard) |
| H18-TE-02 | green F/C/B (production method) | 369 / 384 / 398 |
| H18-TE-02 | H18-BK-01 (L) | reach 193 · carry 205  (line through hazard) |
| H18-TE-02 | H18-BK-02 (green-front) | reach 353 · carry 366  (line through hazard) |
| H18-TE-02 | H18-BK-03 (green-front-left) | reach 361 · carry 378  (line through hazard) |
| H18-TE-02 | H18-BK-04 (green-front-right) | reach 365 · carry 377  (line through hazard) |
| H18-TE-02 | H18-BK-05 (L) | reach 467 · carry 472  (line through hazard) |
| H18-TE-02 | H18-BK-06 (green-back-left) | reach 393 · carry 400  (line through hazard) |
| H18-TE-05 | green F/C/B (production method) | 308 / 323 / 337 |
| H18-TE-05 | H18-BK-01 (L) | reach 131 · carry 143  (line through hazard) |
| H18-TE-05 | H18-BK-02 (green-front) | reach 292 · carry 305  (line through hazard) |
| H18-TE-05 | H18-BK-03 (green-front-left) | reach 299 · carry 316  (line through hazard) |
| H18-TE-05 | H18-BK-04 (green-front-right) | reach 304 · carry 316  (line through hazard) |
| H18-TE-05 | H18-BK-05 (L) | reach 405 · carry 410  (line through hazard) |
| H18-TE-05 | H18-BK-06 (green-back-left) | reach 332 · carry 338  (line through hazard) |
