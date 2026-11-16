# Hole 15 — automated check (2026-11-16)

Result: **OK to continue (flags need review)** · 10 pass · 4 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| FLAG | not mapped in source: path | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| PASS | green area | 628 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H15-TE-01 vs scorecard | 175 yd → Gold |
| PASS | tee H15-TE-02 vs scorecard | 143 yd → Blue, Green, White |
| PASS | tee H15-TE-03 vs scorecard | 121 yd → Bronze, Silver |
| FLAG | features awaiting verification | 8 of 8 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_15/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H15-TE-01 | green F/C/B (production method) | 137 / 159 / 178 |
| H15-TE-01 | H15-BK-01 (green-front-left) | reach 124 · carry 140  (line through hazard) |
| H15-TE-01 | H15-BK-02 (green-left) | reach 147 · carry 164  (line through hazard) |
| H15-TE-02 | green F/C/B (production method) | 105 / 128 / 147 |
| H15-TE-02 | H15-BK-01 (green-front-left) | reach 93 · carry 108  (line through hazard) |
| H15-TE-02 | H15-BK-02 (green-left) | reach 116 · carry 133  (line through hazard) |
| H15-TE-03 | green F/C/B (production method) | 83 / 106 / 125 |
| H15-TE-03 | H15-BK-01 (green-front-left) | reach 71 · carry 87  (line through hazard) |
| H15-TE-03 | H15-BK-02 (green-left) | reach 94 · carry 112  (line through hazard) |
