# Hole 3 — review log

URL: https://scottamcintire.github.io/pocasset-caddie-v3/hole03/ · Par 3 · card Gold 170, Blue 170, Green 147, White 142, Bronze 142, Silver 142
Current release: v3.9.0 (see docs/RELEASES.md) · Review status: **Published — awaiting your review**

Mapped tees: H03-TE-01 165 yd (Gold/Blue); H03-TE-02 138 yd (Green/White/Bronze/Silver)

## Owner feedback
*(Newest first. Record what the owner said, date, and where. Only the owner sets Approved / Needs revision in data/release/status.json.)*

- 15 Nov 2026 (chat): "hole 3 has a tree in the middle of the tee box" → "Fix both".

## Corrections made in response to feedback
*(Kept separate from unrelated development: each correction names the feedback it answers, the commit and the release.)*

- v3.9.0: crown clearance (visual baseline v1.2) — trees whose crowns reached the tee box are no longer drawn.

## Data concerns to check on the course
- Outlines predate the spring 2026 rebuild (unverified).
- Bunker and tee outlines predate the spring 2026 rebuild (unverified); woods are illustrative (2023 imagery).
- Green tee measures 138 yd vs the card's 147.

## Development notes
- 15 Nov 2026: re-rendered with the length-scaled camera (`tools/make_camera.py`) used by every other new hole; the first trial render is kept in `data/holes/hole03/render/trial_unscaled_camera/` for comparison.
