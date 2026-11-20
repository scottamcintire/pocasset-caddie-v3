# V3 test-site releases and central progress table

*Test site: https://scottamcintire.github.io/pocasset-caddie-v3/ (repository `scottamcintire/pocasset-caddie-v3`: source on `main`, published site on `gh-pages`). Production V2.3.1 (`scottamcintire/pocasset_caddie`) is never touched by these releases.*

Release versions are recorded here and in the commit messages. The GitHub proxy rejects tag pushes, so there are no remote tags; the commits are the record.

## Central progress table (Holes 1–18)

Review status is the owner's: only the owner moves a hole to **Approved** or **Needs revision** (data/release/status.json, feedback in docs/reviews/holeNN.md). Publishing never approves a hole.

| Hole | Par | URL | Latest release | Site commit | Source commit | Release tests | Review status | Data concerns (see review log) |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 | /hole01/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; 18 hazards; alignment) | Published — awaiting review | A misfiled tee removed (owner-approved); Silver tee unmapped; no water mapped |
| 2 | 4 | /hole02/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 12 hazards; alignment; visual baseline byte-identical) | Published — awaiting review (visual style approved) | Green/Bronze tees are candidates (re-assigned from Hole 4); Silver unmapped |
| 3 | 3 | /hole03/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 4 hazards; alignment) | Published — awaiting review | Green tee 138 yd vs card 147 (within 10 yd); re-rendered with length-scaled camera |
| 4 | 4 | /hole04/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 5 hazards; alignment) | Published — awaiting review | Only Green/White tee mapped; two source tees moved to Hole 2 |
| 5 | 4 | /hole05/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 10 hazards; alignment) | Published — awaiting review | White/Bronze/Silver unmapped; H05-TE-02 matches no card tee |
| 6 | 3 | /hole06/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 8 hazards; alignment) | Published — awaiting review | Only Gold tee mapped (app opens there); H06-TE-02 matches no card tee; a greenside bunker hidden by illustrative woods in the tee view |
| 7 | 4 | /hole07/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 14 hazards; alignment) | Published — awaiting review | White/Bronze/Silver unmapped |
| 8 | 4 | /hole08/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; pond hazard from 3 tees; alignment) | Published — awaiting review | Pond added from lidar (unverified); only mapped bunker lies 112 m left beside the tee (probably another hole's) |
| 9 | 5 | /hole09/ | v3.9.0 | 3ef5687 | 7f59c7f | PASS (60/60; 41 hazards; alignment) | Published — awaiting review | Bronze/Silver unmapped; H09-TE-06 matches no card tee |
| 10 | 4 | /hole10/ + /play/ | v4.1.0 | f262fe7 | eaffcab | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | pond (lidar, approximate); only Gold/Blue tee mapped |
| 11 | 4 | /hole11/ + /play/ | v4.2.0 | 12a95be | 14f70cd | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | Green tee 43 m off line (may be Hole 14); Bronze/Silver candidate from Hole 14 |
| 12 | 3 | /hole12/ + /play/ | v4.3.0 | 3999286 | 493f2da | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | Gold tee not mapped |
| 13 | 4 | /hole13/ + /play/ | v4.4.0 | 8175e42 | f4c6328 | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | only Green + Bronze (candidate) tees mapped; newer card Blue 295 < Green 308 |
| 14 | 4 | /hole14/ + /play/ | v4.5.0 | eceffbb | f25735e | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | only Gold and Green tees mapped; three tees moved to Holes 11/16 |
| 15 | 3 | /hole15/ + /play/ | v4.6.0 | 7815cc6 | 41303f0 | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | Green tee 143 yd along line vs newer card 132 |
| 16 | 5 | /hole16/ + /play/ | v4.7.0 | a8fe9b3 | 93e4161 | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | White/Bronze candidates from Hole 14; Blue/Silver not mapped |
| 17 | 5 | /hole17/ + /play/ | v4.8.0 | 8dbe3ad | b43bc85 | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | Silver not mapped; standard camera replaced a trial camera |
| 18 | 4 | /hole18/ + /play/ | v4.9.0 | c0f1f2b | 549cae2 | PASS (60/60 F/C/B vs V2.3.1 + V2.2.1; hazards; alignment; /play/ 38/38) | Published — awaiting review | White/Bronze/Silver candidate from Hole 15; behind-green bunker hidden in tee view (documented exception) |

All holes: bunker and tee outlines come from OpenStreetMap traced before the spring 2026 rebuild and are **unverified**; woods are illustrative (2023 imagery); ground shape is 2021 lidar.

## Integrated round page /play/ (v4.0.0, 16 Nov 2026)
| Release | Site commit | Source commit | Rollback to | Tests |
|---|---|---|---|---|
| v4.0.0 | 46c7100 | 8dc2081 | site 3ef5687 (v3.9.0): `git revert 46c7100` on gh-pages | test_play.js 38/38 PASS; test_scorecard.py PASS; nine hole pages PASS (screenshots pixel-identical); visual baseline v1.2 PASS; tool tests PASS; live check PASS |

test_play.js (vs production V2.3.1, read-only copy sha in `prototype/screenshots_play/test_play_result.json`):
- GPS front/centre/back + flag identical at 749 positions on 18 holes incl. off-course; flyover overlay = header on Holes 1–9 (380 positions)
- automatic hole identical after each of 413 fixes walking all 18 holes
- EZLocator placement identical for 216 pins; flag drawn at V2.3.1's position on all 18 greens; 18 approved images byte-identical
- hazard front/carry from every mapped tee = reference tables (115 checks); live hazard table follows position, all marked UNVERIFIED
- scoring identical to V2.3.1 for 77 taps (strokes, putts, totals); scorecard OUT/IN/TOT; CSV; finish round → V3 history
- tee: Green default; Blue at start and Gold mid-round persist across reloads; GPS independent of tee
- simulated positions labelled; Hole 6 states its Green tee is unmapped and never substitutes Gold
- GPS controller: ask, live fix, weak-signal retry, watch reopened, away-from-course, resume after reload, permission denied
- V2.3.1 saved round and pins byte-identical after a full V3 session; V3 wrote only `pocasset_v3:` keys
Live (16 Nov): /play/ loads over https; all 18 green images hash-match; hole data 200; homepage links /play/; with the owner's real V2.3.1 data present on the site, a V3 session left it unchanged.

## Back nine (16 Nov 2026): data and method notes
- Holes 11–14 use a new locked lidar + canopy area (same 2021 USGS survey, same 2023 NAIP classifier), fetched in the Mac browser and checksum-verified in parts. Holes 10, 16, 17, 18 opt into `terrain_options.json` (mosaic): where the primary grid ends, heights come from the other locked grids instead of a nearest-height fill or haze (front nine unaffected; terrain.json and screenshots byte-identical).
- Hole 10 pond traced from the lidar after the owner's report (second locked derived file; the 15 Nov file unchanged).
- Tee audit: 7 tees re-filed (source_corrections.json in Holes 11–18), 2 removed from Hole 18.
- One documented alignment exception (tests/alignment_exceptions.json): H18-BK-06 in the tee view.
- Final regression (16 Nov): 18/18 hole-page tests PASS; alignment 18/18 PASS; /play/ 38/38 PASS with 18 flyovers; visual baseline v1.2 PASS; tool tests PASS; scorecard PASS; front-nine screenshots pixel-identical; production V2.3.1 repo unchanged (e8b22e4).

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
| v3.9.0 | 15 Nov 2026 | 1–9 | 3ef5687 | 7f59c7f | Hole 1 opens at its real tee; crown clearance (visual baseline v1.2); both owner-approved |

| v4.1.0-hole10 | 16 Nov 2026 | 10 (+ /play/) | f262fe7 | eaffcab | pond (lidar, approximate); only Gold/Blue tee mapped |
| v4.2.0-hole11 | 16 Nov 2026 | 11 (+ /play/) | 12a95be | 14f70cd | Green tee 43 m off line (may be Hole 14); Bronze/Silver candidate from Hole 14 |
| v4.3.0-hole12 | 16 Nov 2026 | 12 (+ /play/) | 3999286 | 493f2da | Gold tee not mapped |
| v4.4.0-hole13 | 16 Nov 2026 | 13 (+ /play/) | 8175e42 | f4c6328 | only Green + Bronze (candidate) tees mapped; newer card Blue 295 < Green 308 |
| v4.5.0-hole14 | 16 Nov 2026 | 14 (+ /play/) | eceffbb | f25735e | only Gold and Green tees mapped; three tees moved to Holes 11/16 |
| v4.6.0-hole15 | 16 Nov 2026 | 15 (+ /play/) | 7815cc6 | 41303f0 | Green tee 143 yd along line vs newer card 132 |
| v4.7.0-hole16 | 16 Nov 2026 | 16 (+ /play/) | a8fe9b3 | 93e4161 | White/Bronze candidates from Hole 14; Blue/Silver not mapped |
| v4.8.0-hole17 | 16 Nov 2026 | 17 (+ /play/) | 8dbe3ad | b43bc85 | Silver not mapped; standard camera replaced a trial camera |
| v4.9.0-hole18 | 16 Nov 2026 | 18 (+ /play/) | c0f1f2b | 549cae2 | White/Bronze/Silver candidate from Hole 15; behind-green bunker hidden in tee view (documented exception) |
| **v5.0.0** | 16 Nov 2026 | all 18 | c0f1f2b | (this docs commit) | All 18 flyovers in /play/; full regression PASS |
| v5.0.1-hole09-camera | 16 Nov 2026 | 9 (tee view only) | 9af9785 | a5c0eb0 | Owner feedback: Hole 9 tee view re-aimed down its dogleg corridor; tests PASS |
| v5.0.2-hole11-green-tee | 17 Nov 2026 | 11, 14 (data + page code) | a64a877 | 8b3f712 | Owner: Hole 11 Green tee at the front of the Gold/Blue box; off-line box → Hole 14 Bronze; 18/18 hole pages + /play/ 38/38 PASS |
| v5.3.0-minimal-hole02 | 19 Nov 2026 | 2 in /play/ (page code only) | 5bf7e42 | 22ec66d | Minimalist display Phase 1: centre-only header and no hazard labels beyond 250 yd; ≤3 hazard labels at 250 or closer; SIMULATE collapsed. test_minimal 86/86, test_play 38/38, test_zoom 202/202 (byte-identical to v5.2.0). Rollback: revert 5bf7e42 on gh-pages (back to 6e155f2, v5.2.0). Awaiting owner review |
| v5.3.1-hole02-hazard-reach | 19 Nov 2026 | 2 in /play/ (page code only) | 9b28764 | 761e7a2 | Hazard labels by golfer-to-hazard distance (near edge ≤250 yd, ahead, max 3), independent of green distance; no label for water the golfer is inside. test_minimal 82/82 (Move Me + live), test_play 38/38, test_zoom 202/202. Rollback: revert 9b28764 (back to 5bf7e42). Awaiting owner review |
| v5.4.0-pinsheet-upload | 19 Nov 2026 | /play/ (all 18 greens; page code + pinsheet.js + vendored pdf.js) | bc7ee3e | 42a1701 | Holes menu → Upload Pins PDF → review → apply; CURRENT / EXPIRED / FUTURE DATE by the phone's calendar date; never auto-deleted. test_pinsheet 38/38, test_play 38/38, test_zoom 202/202, test_minimal 82/82. iPhone Safari not yet checked. Rollback: revert bc7ee3e (back to 9b28764). Awaiting owner review |

No release failed; no rollback has been needed. Rollback for the back nine: revert gh-pages commits after 46c7100 (v4.0.0, front-nine flyovers + /play/).
