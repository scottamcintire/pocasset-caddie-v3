# Hole 11 — automated check (2026-11-17)

Result: **OK to continue (flags need review)** · 12 pass · 3 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| PASS | green area | 447 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H11-TE-01 vs scorecard | 392 yd → Gold, Blue |
| PASS | tee H11-TE-03 vs scorecard | 343 yd → White |
| PASS | tee H11-TE-04 vs scorecard | 308 yd → Bronze, Silver |
| PASS | owner-reported tee position H11-TP-GREEN (Green) | 374 yd along the line (card 380); Owner, 17 Nov 2026: app screenshot with the simulated position placed on the Green tee (readout F/C/B 355/369/382, which is exactly the front end of H11-TE-01) |
| FLAG | features awaiting verification | 19 of 19 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_11/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H11-TE-01 | green F/C/B (production method) | 374 / 388 / 400 |
| H11-TE-01 | H11-BK-01 (L) | reach 167 · carry 182  (line through hazard) |
| H11-TE-01 | H11-BK-02 (green-front-left) | reach 353 · carry 362  (line through hazard) |
| H11-TE-01 | H11-BK-03 (green-front-right) | reach 353 · carry 364  (line through hazard) |
| H11-TE-01 | H11-BK-04 (green-right) | reach 375 · carry 386  (line through hazard) |
| H11-TE-01 | H11-BK-05 (green-left) | reach 382 · carry 388  (line through hazard) |
| H11-TE-01 | H11-BK-06 (green-right) | reach 388 · carry 393  (line through hazard) |
| H11-TE-01 | H11-BK-07 (green-back) | reach 404 · carry 410  (line through hazard) |
| H11-TE-01 | H11-BK-08 (green-back) | reach 405 · carry 412  (line through hazard) |
| H11-TE-01 | H11-BK-09 (green-back-left) | reach 408 · carry 413  (line through hazard) |
| H11-TE-03 | green F/C/B (production method) | 323 / 337 / 350 |
| H11-TE-03 | H11-BK-01 (L) | reach 122 · carry 135  (line through hazard) |
| H11-TE-03 | H11-BK-02 (green-front-left) | reach 304 · carry 313  (line through hazard) |
| H11-TE-03 | H11-BK-03 (green-front-right) | reach 303 · carry 315  (line through hazard) |
| H11-TE-03 | H11-BK-04 (green-right) | reach 325 · carry 337  (line through hazard) |
| H11-TE-03 | H11-BK-05 (green-left) | reach 333 · carry 339  (line through hazard) |
| H11-TE-03 | H11-BK-06 (green-right) | reach 338 · carry 343  (line through hazard) |
| H11-TE-03 | H11-BK-07 (green-back) | reach 354 · carry 360  (line through hazard) |
| H11-TE-03 | H11-BK-08 (green-back) | reach 356 · carry 363  (line through hazard) |
| H11-TE-03 | H11-BK-09 (green-back-left) | reach 359 · carry 363  (line through hazard) |
| H11-TE-04 | green F/C/B (production method) | 288 / 302 / 315 |
| H11-TE-04 | H11-BK-01 (L) | reach 92 · carry 103  (line through hazard) |
| H11-TE-04 | H11-BK-02 (green-front-left) | reach 269 · carry 278  (line through hazard) |
| H11-TE-04 | H11-BK-03 (green-front-right) | reach 268 · carry 279  (line through hazard) |
| H11-TE-04 | H11-BK-04 (green-right) | reach 290 · carry 301  (line through hazard) |
| H11-TE-04 | H11-BK-05 (green-left) | reach 298 · carry 304  (line through hazard) |
| H11-TE-04 | H11-BK-06 (green-right) | reach 303 · carry 308  (line through hazard) |
| H11-TE-04 | H11-BK-07 (green-back) | reach 319 · carry 325  (line through hazard) |
| H11-TE-04 | H11-BK-08 (green-back) | reach 321 · carry 327  (line through hazard) |
| H11-TE-04 | H11-BK-09 (green-back-left) | reach 324 · carry 328  (line through hazard) |
| H11-TP-GREEN | green F/C/B (production method) | 355 / 369 / 382 |
| H11-TP-GREEN | H11-BK-01 (L) | reach 150 · carry 165  (line through hazard) |
| H11-TP-GREEN | H11-BK-02 (green-front-left) | reach 336 · carry 345  (line through hazard) |
| H11-TP-GREEN | H11-BK-03 (green-front-right) | reach 336 · carry 347  (line through hazard) |
| H11-TP-GREEN | H11-BK-04 (green-right) | reach 357 · carry 369  (line through hazard) |
| H11-TP-GREEN | H11-BK-05 (green-left) | reach 365 · carry 371  (line through hazard) |
| H11-TP-GREEN | H11-BK-06 (green-right) | reach 370 · carry 376  (line through hazard) |
| H11-TP-GREEN | H11-BK-07 (green-back) | reach 386 · carry 392  (line through hazard) |
| H11-TP-GREEN | H11-BK-08 (green-back) | reach 388 · carry 395  (line through hazard) |
| H11-TP-GREEN | H11-BK-09 (green-back-left) | reach 391 · carry 395  (line through hazard) |
