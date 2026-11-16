# Hole 12 — automated check (2026-11-16)

Result: **OK to continue (flags need review)** · 10 pass · 5 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| FLAG | not mapped in source: path | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Gold |
| PASS | green area | 455 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H12-TE-01 vs scorecard | 121 yd → Blue, Green |
| PASS | tee H12-TE-02 vs scorecard | 119 yd → Blue, Green |
| PASS | tee H12-TE-03 vs scorecard | 97 yd → White, Bronze, Silver |
| FLAG | features awaiting verification | 11 of 11 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_12/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H12-TE-01 | green F/C/B (production method) | 104 / 118 / 133 |
| H12-TE-01 | H12-BK-01 (green-front) | reach 87 · carry 102  (line through hazard) |
| H12-TE-01 | H12-BK-02 (green-front) | reach 88 · carry 100  (line through hazard) |
| H12-TE-01 | H12-BK-03 (green-front-left) | reach 96 · carry 109  (line through hazard) |
| H12-TE-01 | H12-BK-04 (green-front-right) | reach 107 · carry 120  (line through hazard) |
| H12-TE-01 | H12-BK-05 (green-back) | reach 140 · carry 145  (line through hazard) |
| H12-TE-02 | green F/C/B (production method) | 98 / 112 / 128 |
| H12-TE-02 | H12-BK-01 (green-front) | reach 84 · carry 98  (line through hazard) |
| H12-TE-02 | H12-BK-02 (green-front) | reach 86 · carry 97  (line through hazard) |
| H12-TE-02 | H12-BK-03 (green-front-left) | reach 95 · carry 108  (line through hazard) |
| H12-TE-02 | H12-BK-04 (green-front-right) | reach 102 · carry 116  (line through hazard) |
| H12-TE-02 | H12-BK-05 (green-back) | reach 137 · carry 142  (line through hazard) |
| H12-TE-03 | green F/C/B (production method) | 79 / 93 / 109 |
| H12-TE-03 | H12-BK-01 (green-front) | reach 61 · carry 76  (line through hazard) |
| H12-TE-03 | H12-BK-02 (green-front) | reach 64 · carry 74  (line through hazard) |
| H12-TE-03 | H12-BK-03 (green-front-left) | reach 72 · carry 85  (line through hazard) |
| H12-TE-03 | H12-BK-04 (green-front-right) | reach 80 · carry 94  (line through hazard) |
| H12-TE-03 | H12-BK-05 (green-back) | reach 114 · carry 119  (line through hazard) |
