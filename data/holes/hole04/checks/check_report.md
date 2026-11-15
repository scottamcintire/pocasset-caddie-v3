# Hole 4 — automated check (2026-11-15)

Result: **OK to continue (flags need review)** · 9 pass · 4 flag · 0 stop

| Level | Check | Detail |
|---|---|---|
| PASS | required class: hole |  |
| PASS | required class: green |  |
| PASS | required class: tee |  |
| PASS | required class: fairway |  |
| FLAG | not mapped in source: water | confirm on imagery/course whether it truly does not exist |
| PASS | layer source: terrain | lidar (flown 20 Mar - 24 Apr 2021 (leaf-off)); hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | layer source: trees | illustrative woods from imagery canopy (not surveyed trees); label as illustrative; hole area must lie inside the locked grid (tools/terrain.py grid stops if not) |
| FLAG | tee sets without a mapped tee | Gold, Blue, Bronze, Silver |
| PASS | green area | 395 m² |
| PASS | centerline ends on the green |  |
| PASS | tee H04-TE-01 vs scorecard | 323 yd → Green, White |
| FLAG | features awaiting verification | 10 of 10 |
| PASS | approved green asset recorded | Pocasset_AI_Master/03_greens/hole_04/approved/ |

## Distances from mapped tees (unverified data; for review)

| Tee | Feature | Yards |
|---|---|---|
| H04-TE-01 | green F/C/B (production method) | 308 / 320 / 333 |
| H04-TE-01 | H04-BK-01 (L) | reach 168 · carry 180  (line through hazard) |
| H04-TE-01 | H04-BK-02 (L) | reach 184 · carry 195  (line through hazard) |
| H04-TE-01 | H04-BK-03 (R) | reach 207 · carry 224  (line through hazard) |
| H04-TE-01 | H04-BK-04 (R) | reach 218 · carry 230  (line through hazard) |
| H04-TE-01 | H04-BK-05 (R) | reach 244 · carry 251  (line through hazard) |
