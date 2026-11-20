# pdf.js 6.2.108 (Mozilla, Apache-2.0) — legacy build

Used only by /play/ to read the text of an uploaded EZLocator pin-sheet PDF on the phone (Holes → Upload Pins PDF).
Loaded on demand when a file is chosen; nothing else in the app uses it.

- Files: `legacy/build/pdf.min.mjs`, `legacy/build/pdf.worker.min.mjs` and `LICENSE`, copied unmodified from the npm
  package `pdfjs-dist@6.2.108`. The legacy build is the one Mozilla publishes for older browsers (incl. iOS Safari).
- `SHA256SUMS` is checked by `tools/build_play.py`; the build stops if a file differs.
