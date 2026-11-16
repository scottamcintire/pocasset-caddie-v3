# Hole 13 — automated check (2026-11-16)

Result: **OK to continue (flags need review)** · 10 pass · 5 flag · 0 stop

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
| FLAG | tee sets without a mapped tee | Gold, Blue, White, Silver |
| PASS | green area | 390 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H13-TE-01 vs scorecard | 300 yd → Green |
| PASS | tee H13-TE-02 vs scorecard | 260 yd → Bronze |
| FLAG | features awaiting verification | 17 of 17 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_13/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H13-TE-01 | green F/C/B (production method) | 283 / 295 / 308 |
| H13-TE-01 | H13-BK-01 (R) | reach 175 · carry 186  (line through hazard) |
| H13-TE-01 | H13-BK-02 (R) | reach 188 · carry 198  (line through hazard) |
| H13-TE-01 | H13-BK-03 (L) | reach 214 · carry 235  (line through hazard) |
| H13-TE-01 | H13-BK-04 (L) | reach 223 · carry 244  (line through hazard) |
| H13-TE-01 | H13-BK-05 (R) | reach 232 · carry 239  (line through hazard) |
| H13-TE-01 | H13-BK-06 (green-front-right) | reach 264 · carry 267  (line through hazard) |
| H13-TE-01 | H13-BK-07 (green-front-left) | reach 274 · carry 282  (line through hazard) |
| H13-TE-01 | H13-BK-08 (green-right) | reach 283 · carry 290  (line through hazard) |
| H13-TE-01 | H13-BK-09 (green-left) | reach 287 · carry 301  (line through hazard) |
| H13-TE-01 | H13-BK-10 (green-back-right) | reach 306 · carry 311  (line through hazard) |
| H13-TE-01 | H13-BK-11 (green-right) | reach 295 · carry 305  (line through hazard) |
| H13-TE-02 | green F/C/B (production method) | 244 / 256 / 269 |
| H13-TE-02 | H13-BK-01 (R) | reach 136 · carry 147  (line through hazard) |
| H13-TE-02 | H13-BK-02 (R) | reach 149 · carry 159  (line through hazard) |
| H13-TE-02 | H13-BK-03 (L) | reach 175 · carry 196  (line through hazard) |
| H13-TE-02 | H13-BK-04 (L) | reach 184 · carry 204  (line through hazard) |
| H13-TE-02 | H13-BK-05 (R) | reach 193 · carry 200  (line through hazard) |
| H13-TE-02 | H13-BK-06 (green-front-right) | reach 224 · carry 227  (line through hazard) |
| H13-TE-02 | H13-BK-07 (green-front-left) | reach 234 · carry 242  (line through hazard) |
| H13-TE-02 | H13-BK-08 (green-right) | reach 244 · carry 250  (line through hazard) |
| H13-TE-02 | H13-BK-09 (green-left) | reach 248 · carry 261  (line through hazard) |
| H13-TE-02 | H13-BK-10 (green-back-right) | reach 267 · carry 272  (line through hazard) |
| H13-TE-02 | H13-BK-11 (green-right) | reach 255 · carry 265  (line through hazard) |
