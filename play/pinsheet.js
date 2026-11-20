/* Pocasset AI Caddie V3 — EZLocator pin-sheet PDF reader (read-only; never changes saved pins itself).
   parse(pages)  pages = [[{str,x,y,size,w}, ...], ...]  (text items from pdf.js, PDF points, y up)
                 → {date:'YYYY-MM-DD', dateText, pins:{1..18:{front,edge,side,depth}}, copies:{n:k}, errors:[...]}
   The sheet is a grid: big hole number, "D: depth" to its right, "front, sideL|R" below the depth. Values are
   matched to holes by position, never by reading order. A sheet printed more than once on the page must agree.
   validate(sheet, greens, placePin) → {ok, errors:[...], warnings:[...], rows:[...]}  (V2.3.1 placePin, unchanged)
   status(dateStr, now) → 'current' | 'expired' | 'future'  (device's local calendar date) */
(function (root) {
  'use strict';
  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  var DATE_RE = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi;
  var D_RE = /^D\s*:\s*(\d{1,2}(?:\.\d+)?)$/i;
  var PIN_RE = /^(\d{1,2}(?:\.\d+)?)\s*,?\s*(\d{1,2}(?:\.\d+)?)\s*([LR])$/i;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function localDate(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cx(it) { return it.x + (it.w || 0) / 2; }

  function parsePage(items, out) {
    items = items.map(function (i) { return { str: String(i.str).replace(/\s+/g, ' ').trim(), x: i.x, y: i.y, size: i.size, w: i.w || 0 }; })
      .filter(function (i) { return i.str && i.str !== ','; });            // the comma is drawn as its own piece of text
    var labels = items.filter(function (i) { return /^\d{1,2}$/.test(i.str) && +i.str >= 1 && +i.str <= 18 && i.size >= 13; });
    var ds = items.filter(function (i) { return D_RE.test(i.str); });
    // pin text: "15", "8L" (and the comma) may arrive as separate pieces or already joined ("15 8L")
    var PART_RE = /^(\d{1,2}(?:\.\d+)?)$|^(\d{1,2}(?:\.\d+)?\s*[LR])$|^(\d{1,2}(?:\.\d+)?\s*,?\s*\d{1,2}(?:\.\d+)?\s*[LR])$/i;
    var parts = items.filter(function (i) { return PART_RE.test(i.str.replace(/,/g, ' ').trim()) && labels.indexOf(i) < 0 && i.size < 13; });
    var usedD = [], usedP = [];
    labels.forEach(function (L) {
      var s = L.size, n = +L.str;
      var d = ds.filter(function (q) { return Math.abs(q.y - L.y) < s && q.x > L.x && q.x - L.x < 8 * s; })
        .sort(function (a, b) { return (a.x - L.x) - (b.x - L.x); })[0];
      if (!d) { out.errors.push('Hole ' + n + ': green depth (D:) not found next to the hole number.'); return; }
      var near = parts.filter(function (q) { return q.y < L.y - 2 * s && q.y > L.y - 8 * s && Math.abs(cx(q) - cx(d)) < 3 * s; });
      if (!near.length) { out.errors.push('Hole ' + n + ': pin (front, side) not found below the depth.'); return; }
      var top = Math.max.apply(null, near.map(function (q) { return q.y; }));
      var line = near.filter(function (q) { return Math.abs(q.y - top) < 2; }).sort(function (a, b) { return a.x - b.x; });
      if (near.some(function (q) { return line.indexOf(q) < 0; })) { out.errors.push('Hole ' + n + ': more than one line of pin text; sheet is ambiguous.'); return; }
      var txt = line.map(function (q) { return q.str.replace(/,/g, ' '); }).join(' ').replace(/\s+/g, ' ').trim(), m = txt.match(PIN_RE);
      if (!m) { out.errors.push('Hole ' + n + ': pin "' + txt + '" is not in the form "front, side L/R".'); return; }
      if (usedD.indexOf(d) >= 0 || line.some(function (q) { return usedP.indexOf(q) >= 0; })) { out.errors.push('Hole ' + n + ': its values are shared with another hole; sheet is ambiguous.'); return; }
      usedD.push(d); usedP.push.apply(usedP, line);
      (out.found[n] = out.found[n] || []).push({ front: +m[1], edge: +m[2], side: m[3].toUpperCase(), depth: +d.str.match(D_RE)[1] });
    });
    parts.forEach(function (q) { if (usedP.indexOf(q) < 0 && /[LR]$/i.test(q.str)) out.errors.push('Unmatched pin entry "' + q.str + '" (not next to a hole number).'); });
    ds.forEach(function (q) { if (usedD.indexOf(q) < 0) out.errors.push('Unmatched depth "' + q.str + '" (not next to a hole number).'); });
    return items;
  }

  function parse(pages) {
    var out = { errors: [], found: {}, pins: {}, copies: {}, date: null, dateText: null }, text = [];
    (pages || []).forEach(function (items) {
      var it = parsePage(items || [], out);
      text.push(it.slice().sort(function (a, b) { return Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x; }).map(function (i) { return i.str; }).join(' '));
    });
    var dates = {}, m, all = text.join(' ');
    DATE_RE.lastIndex = 0;
    while ((m = DATE_RE.exec(all))) {
      var mo = MONTHS.indexOf(m[2].toLowerCase()) + 1, dd = +m[3], yy = +m[4], dt = new Date(yy, mo - 1, dd);
      if (dt.getFullYear() !== yy || dt.getMonth() !== mo - 1 || dt.getDate() !== dd) { out.errors.push('Pin-sheet date "' + m[0] + '" is not a real date.'); continue; }
      var wd = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dt.getDay()];
      if (wd !== m[1].toLowerCase()) out.errors.push('Pin-sheet date "' + m[0] + '": weekday does not match the date.');
      dates[yy + '-' + pad(mo) + '-' + pad(dd)] = m[0];
    }
    var keys = Object.keys(dates);
    if (!keys.length) out.errors.push('Pin-sheet date not found (expected e.g. "Tuesday, November 3, 2026").');
    else if (keys.length > 1) out.errors.push('More than one date on the sheet: ' + keys.join(', ') + '.');
    else { out.date = keys[0]; out.dateText = dates[keys[0]]; }
    for (var n = 1; n <= 18; n++) {
      var f = out.found[n];
      if (!f) { out.errors.push('Hole ' + n + ': not found on the sheet.'); continue; }
      var a = JSON.stringify(f[0]);
      if (f.some(function (x) { return JSON.stringify(x) !== a; })) { out.errors.push('Hole ' + n + ': the copies on the sheet disagree (' + f.map(function (x) { return x.front + ', ' + x.edge + x.side + ' D' + x.depth; }).join(' vs ') + ').'); continue; }
      out.pins[n] = f[0]; out.copies[n] = f.length;
    }
    delete out.found;
    return out;
  }

  function validate(sheet, greens, placePin) {
    var errors = (sheet.errors || []).slice(), warnings = [], rows = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sheet.date || '')) errors.push('No valid pin-sheet date.');
    for (var n = 1; n <= 18; n++) {
      var p = sheet.pins && sheet.pins[n], M = greens[n - 1], row = { hole: n, pin: p || null, ok: false };
      if (p) {
        if (!(p.depth >= 10 && p.depth <= 60)) row.err = 'depth ' + p.depth + ' yd is outside 10–60';
        else if (!(p.front >= 0 && p.front <= p.depth)) row.err = 'front ' + p.front + ' yd is not between 0 and the depth';
        else if (!(p.edge >= 0 && p.edge <= 40)) row.err = 'side ' + p.edge + ' yd is outside 0–40';
        else { var r = placePin(M, p); if (r.err) row.err = r.err; else { row.ok = true; row.uv = r.uv; } }
        if (row.err) errors.push('Hole ' + n + ': ' + row.err + '.');
        if (row.ok && M && M.depth != null && p.depth !== M.depth) { row.warn = 'sheet depth ' + p.depth + ' yd vs approved green ' + M.depth + ' yd'; warnings.push('Hole ' + n + ': ' + row.warn + '.'); }
      }
      rows.push(row);
    }
    return { ok: !errors.length && rows.every(function (r) { return r.ok; }), errors: errors, warnings: warnings, rows: rows };
  }

  function status(dateStr, now) { var t = localDate(now); return dateStr === t ? 'current' : dateStr < t ? 'expired' : 'future'; }

  var api = { parse: parse, validate: validate, status: status, localDate: localDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PPinSheet = api;
})(this);
