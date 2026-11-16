# Hole 9 — review log

URL: https://scottamcintire.github.io/pocasset-caddie-v3/hole09/ · Par 5 · card Gold 499, Blue 490, Green 469, White 460, Bronze 437, Silver 380
Current release: v3.9.0 (see docs/RELEASES.md) · Review status: **Published — awaiting your review**

Mapped tees: H09-TE-01 504 yd (Gold); H09-TE-02 504 yd (Gold); H09-TE-03 504 yd (Gold); H09-TE-04 498 yd (Gold/Blue); H09-TE-05 466 yd (Green/White); H09-TE-06 105 yd (no card tee)

## Owner feedback
*(Newest first. Record what the owner said, date, and where. Only the owner sets Approved / Needs revision in data/release/status.json.)*

- 16 Nov 2026 (chat): "the image appears too zoomed out. There are multiple fairways visible, and I cannot immediately tell which one belongs to Hole 9." Asked for camera-only correction centred on the tee-to-green corridor; approach view to stay useful; H09-TE-06 not to drive the camera.

## Corrections made in response to feedback
*(Kept separate from unrelated development: each correction names the feedback it answers, the commit and the release.)*

- 16 Nov 2026, v5.0.1 (answers the 16 Nov feedback): **cause** — Hole 9 is a dogleg; its playing line runs up to 90 m left of the straight tee-to-green line and its fairway centre sits 65 m left of it (Holes 1/16/17: 14/3/42 m). The standard camera aims tee → green centre, so Hole 9's fairway was on the left edge and a neighbouring fairway filled the centre. **Fix (camera only):** tee view aimed through the centre of Hole 9's own fairway (new optional `aim_through_uv` in camera.json, used only by Hole 9; 17° left of the old aim), closer and a little steeper (back 120→90 m, height 133→125 m, beyond green 89→50 m). Camera still behind H09-TE-05 (Green/White, 466 yd); H09-TE-06 never used. Approach view unchanged (already on Hole 9's final leg, same framing as Holes 1/17). GPS, hazards, greens and every other hole unchanged (Hole 2 fresh re-render byte-identical).

## Data concerns to check on the course
- Bronze/Silver tees not mapped; one mapped tee matches no card tee
- Bunker and tee outlines predate the spring 2026 rebuild (unverified); woods are illustrative (2023 imagery).
