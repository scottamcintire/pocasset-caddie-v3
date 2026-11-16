# V3 test-site releases and central progress table

*Test site: https://scottamcintire.github.io/pocasset-caddie-v3/ (repository `scottamcintire/pocasset-caddie-v3`: source on `main`, published site on `gh-pages`). Production V2.3.1 (`scottamcintire/pocasset_caddie`) is never touched by these releases.*

Release versions are recorded here and in the commit messages. The GitHub proxy rejects tag pushes, so there are no remote tags; the commits are the record.

## Central progress table (Holes 1–18)

Review status is the owner's: only the owner moves a hole to **Approved** or **Needs revision** (data/release/status.json, feedback in docs/reviews/holeNN.md). Publishing never approves a hole.

| Hole | Par | URL | Latest release | Site commit | Source commit | Release tests | Review status | Data concerns (see review log) |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 | /hole01/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; 24 hazards; alignment) | Published — awaiting review | Silver tee unmapped; no water mapped; outlines pre-rebuild |
| 2 | 4 | /hole02/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 12 hazards; alignment; visual baseline byte-identical) | Published — awaiting review (visual style approved) | Green/Bronze tees are candidates (re-assigned from Hole 4); Silver unmapped |
| 3 | 3 | /hole03/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 4 hazards; alignment) | Published — awaiting review | Green tee 138 yd vs card 147 (within 10 yd); re-rendered with length-scaled camera |
| 4 | 4 | /hole04/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 5 hazards; alignment) | Published — awaiting review | Only Green/White tee mapped; two source tees moved to Hole 2 |
| 5 | 4 | /hole05/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 10 hazards; alignment) | Published — awaiting review | White/Bronze/Silver unmapped; H05-TE-02 matches no card tee |
| 6 | 3 | /hole06/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 8 hazards; alignment) | Published — awaiting review | Only Gold tee mapped (app opens there); H06-TE-02 matches no card tee; a greenside bunker hidden by illustrative woods in the tee view |
| 7 | 4 | /hole07/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 14 hazards; alignment) | Published — awaiting review | White/Bronze/Silver unmapped |
| 8 | 4 | /hole08/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; pond hazard from 3 tees; alignment) | Published — awaiting review | Pond added from lidar (unverified); only mapped bunker lies 112 m left beside the tee (probably another hole's) |
| 9 | 5 | /hole09/ | v3.8.0-visual-v1.1 | c9048be | 5ddd9de | PASS (60/60; 41 hazards; alignment) | Published — awaiting review | Bronze/Silver unmapped; H09-TE-06 matches no card tee |
| 10–18 | | — | — | — | — | — | Not started (outside the current scope) | Need course-area lidar + canopy for their area |

All holes: bunker and tee outlines come from OpenStreetMap traced before the spring 2026 rebuild and are **unverified**; woods are illustrative (2023 imagery); ground shape is 2021 lidar.

## Release checklist (run for every release)
1. `python3 tools/render_flyover.py --hole N` (style guard stops on any unapproved style change)
2. `python3 tests/test_alignment.py --hole N` — every visible hazard/green sample lands on its own surface (hidden-behind-woods samples reported, not failed)
3. `python3 -I tools/build_prototype.py --hole N` then `HOLE=N node tests/test_prototype.js`:
   - front/centre/back identical to **V2.3.1 and V2.2.1** at 60 positions
   - hazard reach/carry equal to the build-time reference table
   - browser projection = renderer projection (< 0.05 px); tap round trip < 0.5 px
   - approved green image byte-identical to the approved manifest (SHA-256)
   - no storage outside `pocasset_v3:`; no console errors
4. Re-run steps 2–3 for every already-published hole when shared code (app, tests, renderer) changed; `python3 tests/test_visual_baseline.py` for Hole 2.
5. `data/release/status.json` → `python3 -I tools/build_site.py --holes …` → commit + push `main` → copy `site/` to `gh-pages` → commit + push.
6. Verify the live site (homepage lists every hole with the right status; each published hole loads).

## Rollback
Each release is one commit on `gh-pages`. To restore the previous site: `git revert <release commit>` on `gh-pages` and push (the previous site commit is named in every release message). Source history on `main` is never rewritten.

## Release log
| Version | Date | Holes | Site commit (gh-pages) | Source commit (main) | Notes |
|---|---|---|---|---|---|
| v3.0 test site | 15 Nov 2026 | 2, 3 | 401c563 | 90a57c9 | First test site (owner created the repo and enabled Pages) |
| v3.2.0-hole04 | 15 Nov 2026 | 4 + homepage statuses | 71ca408 | b1c76b7 | Generic per-hole release test; Holes 2–4 PASS |
| v3.3.0-hole01 | 15 Nov 2026 | 1 | e0d6f0b | 0431071 | Course-area lidar + canopy locked; alignment test tells hidden-behind-woods from misaligned |
| v3.4.0-holes05-06 | 15 Nov 2026 | 5, 6 (+ app fix on all) | 019fd00 | 50be7e6 | Fix: never open at a mapped tee that matches no card tee |
| v3.5.0-holes07-08 | 15 Nov 2026 | 7, 8 | 0925a46 | aaebec1 | |
| v3.6.0-hole09 | 15 Nov 2026 | 9 | caf87bc | 2b58586 | Holes 1–9 all on the test site |
| v3.6.1-hole03 | 15 Nov 2026 | 3 (camera) + docs | c1eb778 | 13d56e2 | Hole 3 re-rendered with the length-scaled camera used by all other holes; earlier render kept in `render/trial_unscaled_camera/` |
| v3.7.0-hole08-pond | 15 Nov 2026 | 8 (+ Hole 9 tee view) | 5dc1bf3 | bd0275b | Owner-reported pond traced from 2021 lidar; locked lidar-derived source |
| v3.8.0-visual-v1.1 | 15 Nov 2026 | 1–9 | c9048be | 5ddd9de | Owner-approved visual baseline v1.1: trees 8 m instead of 13 m; all holes re-rendered and re-tested |

No release failed; no rollback has been needed.
