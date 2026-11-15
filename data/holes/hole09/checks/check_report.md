# Hole 9 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 13 pass · 5 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Bronze, Silver |
| PASS | green area | 425 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H09-TE-01 vs scorecard | 504 yd → Gold |
| PASS | tee H09-TE-02 vs scorecard | 504 yd → Gold |
| PASS | tee H09-TE-03 vs scorecard | 504 yd → Gold |
| PASS | tee H09-TE-04 vs scorecard | 498 yd → Gold, Blue |
| PASS | tee H09-TE-05 vs scorecard | 466 yd → Green, White |
| FLAG | tee H09-TE-06 vs scorecard | 105 yd → no card tee within 10 yd |
| FLAG | features awaiting verification | 19 of 19 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_09/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H09-TE-01 | green F/C/B (production method) | 447 / 459 / 471 |
| H09-TE-01 | H09-BK-01 (R) | reach 220 · carry 234  (line through hazard) |
| H09-TE-01 | H09-BK-02 (L) | reach 265 · carry 273  (line through hazard) |
| H09-TE-01 | H09-BK-03 (L) | reach 386 · carry 395  (line through hazard) |
| H09-TE-01 | H09-BK-04 (R) | reach 390 · carry 399  (line through hazard) |
| H09-TE-01 | H09-BK-05 (R) | reach 405 · carry 412  (line through hazard) |
| H09-TE-01 | H09-BK-06 (green-front) | reach 414 · carry 419  (line through hazard) |
| H09-TE-01 | H09-BK-07 (green-front-right) | reach 436 · carry 441  (line through hazard) |
| H09-TE-02 | green F/C/B (production method) | 450 / 461 / 472 |
| H09-TE-02 | H09-BK-01 (R) | reach 241 · carry 256  (line through hazard) |
| H09-TE-02 | H09-BK-02 (L) | reach 295 · carry 302  (line through hazard) |
| H09-TE-02 | H09-BK-03 (L) | reach 402 · carry 409  (line through hazard) |
| H09-TE-02 | H09-BK-04 (R) | reach 399 · carry 408  (line through hazard) |
| H09-TE-02 | H09-BK-05 (R) | reach 413 · carry 420  (line through hazard) |
| H09-TE-02 | H09-BK-06 (green-front) | reach 421 · carry 426  (line through hazard) |
| H09-TE-02 | H09-BK-07 (green-front-right) | reach 441 · carry 445  (line through hazard) |
| H09-TE-03 | green F/C/B (production method) | 447 / 458 / 470 |
| H09-TE-03 | H09-BK-01 (R) | reach 228 · carry 243  (line through hazard) |
| H09-TE-03 | H09-BK-02 (L) | reach 278 · carry 285  (line through hazard) |
| H09-TE-03 | H09-BK-03 (L) | reach 393 · carry 401  (line through hazard) |
| H09-TE-03 | H09-BK-04 (R) | reach 394 · carry 403  (line through hazard) |
| H09-TE-03 | H09-BK-05 (R) | reach 408 · carry 415  (line through hazard) |
| H09-TE-03 | H09-BK-06 (green-front) | reach 417 · carry 422  (line through hazard) |
| H09-TE-03 | H09-BK-07 (green-front-right) | reach 437 · carry 443  (line through hazard) |
| H09-TE-04 | green F/C/B (production method) | 424 / 436 / 448 |
| H09-TE-04 | H09-BK-01 (R) | reach 197 · carry 210  (line through hazard) |
| H09-TE-04 | H09-BK-02 (L) | reach 241 · carry 249  (line through hazard) |
| H09-TE-04 | H09-BK-03 (L) | reach 364 · carry 373  (line through hazard) |
| H09-TE-04 | H09-BK-04 (R) | reach 369 · carry 378  (line through hazard) |
| H09-TE-04 | H09-BK-05 (R) | reach 384 · carry 391  (line through hazard) |
| H09-TE-04 | H09-BK-06 (green-front) | reach 394 · carry 399  (line through hazard) |
| H09-TE-04 | H09-BK-07 (green-front-right) | reach 415 · carry 421  (line through hazard) |
| H09-TE-05 | green F/C/B (production method) | 398 / 410 / 422 |
| H09-TE-05 | H09-BK-01 (R) | reach 166 · carry 179  (line through hazard) |
| H09-TE-05 | H09-BK-02 (L) | reach 209 · carry 218  (line through hazard) |
| H09-TE-05 | H09-BK-03 (L) | reach 334 · carry 343  (line through hazard) |
| H09-TE-05 | H09-BK-04 (R) | reach 341 · carry 350  (line through hazard) |
| H09-TE-05 | H09-BK-05 (R) | reach 356 · carry 364  (line through hazard) |
| H09-TE-05 | H09-BK-06 (green-front) | reach 366 · carry 371  (line through hazard) |
| H09-TE-05 | H09-BK-07 (green-front-right) | reach 389 · carry 395  (line through hazard) |
| H09-TE-06 | green F/C/B (production method) | 83 / 95 / 107 |
| H09-TE-06 | H09-BK-01 (R) | reach 159 · carry 169  (line through hazard) |
| H09-TE-06 | H09-BK-02 (L) | reach 180 · carry 186  (line through hazard) |
| H09-TE-06 | H09-BK-03 (L) | reach 74 · carry 80  (line through hazard) |
| H09-TE-06 | H09-BK-04 (R) | reach 38 · carry 46  (line through hazard) |
| H09-TE-06 | H09-BK-05 (R) | reach 46 · carry 52  (line through hazard) |
| H09-TE-06 | H09-BK-06 (green-front) | reach 53 · carry 58  (line through hazard) |
| H09-TE-06 | H09-BK-07 (green-front-right) | reach 74 · carry 81  (line through hazard) |
