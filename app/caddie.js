/* Pocasset V3 — caddie engine for the integrated /play/ page.
   GPS, automatic hole, green front/center/back, flag yardage, pins and scoring rules are PORTED UNCHANGED from
   production V2.3.1 (index.html at e8b22e4, read only): same formulas, same thresholds, same messages where shown.
   Course data (green centres/outlines, playing lines, pin models) comes from data/sources/production/v231_greens_data.json
   (locked; proven identical to the V2.3.1 page). Storage: ONLY keys starting "pocasset_v3:" — V2.3.1's keys
   (pocasset_caddie_v1, pocasset_pins_v1) are never written or removed; they are read only by the explicit
   "copy today's pins from V2.3.1" action. */
(function (root) {
  'use strict';
  var R_EARTH = 6371008.8, YARDS_PER_METER = 1.0936132983, deg = Math.PI / 180;

  // ---------- geometry (V2.3.1 verbatim) ----------
  function xy(point, ref) { return { x: (point[0] - ref[0]) * deg * R_EARTH * Math.cos(ref[1] * deg), y: (point[1] - ref[1]) * deg * R_EARTH }; }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function ptSegDist(pt, a, b) { var vx = b.x - a.x, vy = b.y - a.y, den = vx * vx + vy * vy; var t = den ? Math.max(0, Math.min(1, ((pt.x - a.x) * vx + (pt.y - a.y) * vy) / den)) : 0; return Math.hypot(pt.x - a.x - t * vx, pt.y - a.y - t * vy); }
  function yd(m) { return Math.round(m * YARDS_PER_METER); }

  function Course(data) {   // data: {green_map:{n:{center,ring}}, hole_paths:{n:[[lon,lat]..]}, greens:[18 pin models]}
    this.GREEN_MAP = data.green_map; this.HOLE_PATHS = data.hole_paths; this.GREENS = data.greens;
  }
  Course.prototype.lineDist = function (point, number) {
    var ref = this.GREEN_MAP[number].center, q = xy(point, ref), path = this.HOLE_PATHS[number].map(function (p) { return xy(p, ref); }), best = Infinity;
    for (var i = 1; i < path.length; i++) best = Math.min(best, ptSegDist(q, path[i - 1], path[i]));
    return best;
  };
  Course.prototype.nearestHole = function (point) {
    var self = this, c = [];
    for (var i = 0; i < 18; i++) c.push({ number: i + 1, d: self.lineDist(point, i + 1) });
    c.sort(function (a, b) { return a.d - b.d; });
    return c;
  };
  // V2.3.1 intersectionExtents (route = HOLE_PATHS of the selected hole)
  Course.prototype.intersectionExtents = function (hole, player) {
    var center = this.GREEN_MAP[hole].center, ring = this.GREEN_MAP[hole].ring;
    var v = xy(player, center), r = Math.hypot(v.x, v.y);
    var route = this.HOLE_PATHS[hole], prev = xy(route[Math.max(0, route.length - 2)], center);
    var ux = r > 0.5 ? v.x / r : -prev.x / Math.max(0.01, Math.hypot(prev.x, prev.y)), uy = r > 0.5 ? v.y / r : -prev.y / Math.max(0.01, Math.hypot(prev.x, prev.y));
    var points = ring.map(function (p) { return xy(p, center); }), pos = [], neg = [];
    for (var i = 0; i < points.length; i++) {
      var a = points[i], b = points[(i + 1) % points.length], ex = b.x - a.x, ey = b.y - a.y;
      var denom = ex * uy - ey * ux; if (Math.abs(denom) < 1e-9) continue;
      var seg = (a.y * ux - a.x * uy) / denom;
      if (seg < -1e-8 || seg > 1 + 1e-8) continue;
      var s = { x: a.x + seg * ex, y: a.y + seg * ey }, t = s.x * ux + s.y * uy;
      if (t >= 0) pos.push(t); else neg.push(t);
    }
    var front = pos.length ? Math.max.apply(null, pos) : Math.max.apply(null, points.map(function (p) { return p.x * ux + p.y * uy; }));
    var back = neg.length ? Math.min.apply(null, neg) : Math.min.apply(null, points.map(function (p) { return p.x * ux + p.y * uy; }));
    return { r: r, front: front, back: back, position: v };
  };
  /* Everything V2.3.1's renderGps shows, as numbers (yards) and flags. mode: 'live' | 'sim'.
     pinLL: today's pin [lon,lat] or null. Off course (> 180 m from every playing line) only blanks LIVE readings. */
  Course.prototype.readout = function (hole, point, mode, accuracy, pinLL) {
    var found = this.nearestHole(point), onCourse = found[0].d <= 180;
    if (!onCourse && mode === 'live') return { onCourse: false };
    var gm = this.GREEN_MAP[hole], e = this.intersectionExtents(hole, point);
    var frontDistance = Math.abs(e.r - e.front), backDistance = Math.abs(e.r - e.back);
    return { onCourse: true, front: yd(frontDistance), center: yd(e.r), back: yd(backDistance),
             flag: pinLL ? yd(distance(xy(point, gm.center), xy(pinLL, gm.center))) : null,
             onGreen: e.r <= Math.max(e.front, 0) && mode === 'live', wide: !!(accuracy && accuracy > 18), accuracyYd: accuracy ? yd(accuracy) : null };
  };
  /* A point on the V2.3.1 playing line `yards` back from the green centre (for simulated positions). */
  Course.prototype.alongFromGreen = function (hole, yards) {
    var c = this.GREEN_MAP[hole].center, P = this.HOLE_PATHS[hole].slice().reverse(), m = yards / YARDS_PER_METER;
    var pts = [{ x: 0, y: 0 }].concat(P.map(function (p) { return xy(p, c); })), acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var d = distance(pts[i - 1], pts[i]);
      if (acc + d >= m) { var f = (m - acc) / d, x = pts[i - 1].x + f * (pts[i].x - pts[i - 1].x), y = pts[i - 1].y + f * (pts[i].y - pts[i - 1].y); return toLL(x, y, c); }
      acc += d;
    }
    return null;
  };
  Course.prototype.pathLengthYd = function (hole) {
    var c = this.GREEN_MAP[hole].center, P = [c].concat(this.HOLE_PATHS[hole].slice().reverse()).map(function (p) { return xy(p, c); }), s = 0;
    for (var i = 1; i < P.length; i++) s += distance(P[i - 1], P[i]);
    return s * YARDS_PER_METER;
  };
  function toLL(x, y, ref) { return [ref[0] + x / (deg * R_EARTH * Math.cos(ref[1] * deg)), ref[1] + y / (deg * R_EARTH)]; }

  /* V2.3.1 suggestHole as a small state machine. Returns the new hole number, or 0 for "no change". */
  function AutoHole(course) { this.c = course; this.stableHole = 0; this.stableCount = 0; }
  AutoHole.prototype.reset = function () { this.stableHole = 0; this.stableCount = 0; };
  AutoHole.prototype.step = function (point, current, enabled, mode) {
    if (!enabled || mode !== 'live') return 0;
    var found = this.c.nearestHole(point), closest = found[0], second = found[1], currentDistance = this.c.lineDist(point, current);
    // Avoid switches where holes run alongside each other. Never switch when clearly still on selected hole.
    if (closest.number === current || currentDistance < 48 || closest.d > 45 || second.d - closest.d < 18) { this.reset(); return 0; }
    if (this.stableHole === closest.number) this.stableCount++; else { this.stableHole = closest.number; this.stableCount = 1; }
    if (this.stableCount >= 2) { this.reset(); return closest.number; }
    return 0;
  };

  // ---------- pins (V2.3.1 rules; V3 storage) ----------
  var pdeg = Math.PI / 180;
  function uv2ll(H, u, v) { var b = H.bearing * pdeg, e = u * Math.cos(b) + v * Math.sin(b), n = -u * Math.sin(b) + v * Math.cos(b); return [H.origin[0] + e / (6371008.8 * Math.cos(H.origin[1] * pdeg)) / pdeg, H.origin[1] + n / 6371008.8 / pdeg]; }
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function Pins(store, greens, placePin) { this.s = store; this.G = greens; this.place = placePin; this.P = store.get('pins') || {}; var P = this.P; P.pins = P.pins || {}; P.depths = P.depths || {}; P.sideDraft = P.sideDraft || {}; this.rollover(); }
  Pins.prototype.save = function () { this.s.set('pins', this.P); };
  Pins.prototype.rollover = function (now) { var t = todayStr(now), P = this.P; if (P.date !== t) { if (Object.keys(P.pins).length) P.previous = { date: P.date, pins: P.pins }; P.pins = {}; P.date = t; this.save(); return true; } return false; };
  Pins.prototype.pinFor = function (n) { var p = this.P.pins[n]; return p ? { src: 'today', p: p } : { src: 'sample', p: this.G[n - 1].sample }; };
  Pins.prototype.depthFor = function (n) { var p = this.P.pins[n]; return p && p.depth != null ? p.depth : this.P.depths[n] != null ? this.P.depths[n] : this.G[n - 1].depth; };
  Pins.prototype.set = function (n, f, e, side, d) {   // V2.3.1 readEntry
    if (d !== '' && d != null) this.P.depths[n] = +d;
    if (f === '' || e === '' || d === '' || f == null || e == null || d == null) delete this.P.pins[n];
    else this.P.pins[n] = { front: +f, edge: +e, side: side, depth: +d, entered: new Date().toISOString() };
    this.save();
  };
  Pins.prototype.clear = function (n) { delete this.P.pins[n]; this.save(); };
  Pins.prototype.clearAll = function () { this.P.pins = {}; this.save(); };
  Pins.prototype.placed = function (n) { var st = this.pinFor(n), H = this.G[n - 1], r = this.place(H, st.p); return { src: st.src, p: st.p, res: r, ll: r.px ? uv2ll(H, r.uv[0], r.uv[1]) : null }; };
  Pins.prototype.todayPinLL = function (n) { var x = this.placed(n); return x.src === 'today' ? x.ll : null; };
  /* Read-only copy of TODAY's pins from V2.3.1's storage (never writes V2.3.1's key). Returns the number copied. */
  Pins.prototype.copyFromV231 = function (ls) {
    var raw; try { raw = JSON.parse(ls.getItem('pocasset_pins_v1')); } catch (e) { raw = null; }
    if (!raw || raw.date !== todayStr() || !raw.pins) return 0;
    var n = 0; for (var k in raw.pins) { var p = raw.pins[k]; if (p && isFinite(p.front) && isFinite(p.edge) && isFinite(p.depth)) { this.P.pins[k] = { front: +p.front, edge: +p.edge, side: p.side === 'R' ? 'R' : 'L', depth: +p.depth, entered: 'copied from V2.3.1 ' + new Date().toISOString() }; n++; } }
    this.save(); return n;
  };

  // ---------- storage: V3 keys only ----------
  var PREFIX = 'pocasset_v3:';
  function Store(ls) { this.ls = ls; }
  Store.prototype.key = function (k) { if (!/^[a-z0-9_]+$/.test(k)) throw new Error('bad key'); return PREFIX + k; };
  Store.prototype.get = function (k) { try { return JSON.parse(this.ls.getItem(this.key(k))); } catch (e) { return null; } };
  Store.prototype.set = function (k, v) { try { this.ls.setItem(this.key(k), JSON.stringify(v)); return true; } catch (e) { return false; } };
  Store.prototype.remove = function (k) { try { this.ls.removeItem(this.key(k)); } catch (e) { } };

  // ---------- scoring (V2.3.1 rules) ----------
  function newRound(tee, date) {
    var h = []; for (var i = 0; i < 18; i++) h.push({ strokes: null, putts: null, fairway: '', notes: '', pin: '' });
    return { id: 'r' + Date.now(), started: new Date().toISOString(), date: date || todayStr(), tee: tee, hole: 1, holes: h };
  }
  function adjust(round, n, field, delta, pars) {   // V2.3.1 adjust: first tap sets par (strokes) / 2 (putts)
    var h = round.holes[n - 1], v = h[field];
    if (v === null) { v = field === 'strokes' ? pars[n - 1] : 2; if (delta < 0) v -= 1; } else v += delta;
    h[field] = Math.max(field === 'strokes' ? 1 : 0, v);
    return h[field];
  }
  function totals(round, pars, from, to) {   // V2.3.1 totals (to-par counts only scored holes); optional hole range
    from = from || 1; to = to || 18; var strokes = 0, par = 0, putts = 0, scored = 0, fw = 0, fwHit = 0;
    for (var i = from - 1; i < to; i++) { var h = round.holes[i]; if (h.strokes !== null) { strokes += h.strokes; par += pars[i]; scored++; } putts += h.putts || 0; if (pars[i] > 3 && h.fairway) { fw++; if (h.fairway === 'hit') fwHit++; } }
    var rel = strokes - par;
    return { scored: scored, strokes: scored ? strokes : null, toPar: scored ? (rel > 0 ? '+' + rel : rel === 0 ? 'E' : String(rel)) : 'E', putts: putts, fairways: fw ? fwHit + '/' + fw : '—' };
  }
  function escCSV(s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; }
  function csv(round, pars, yards, cardLabel) {   // same columns as V2.3.1, plus which card the yardage came from
    var rows = [['Date', 'Tee', 'Hole', 'Par', 'Tee Yards', 'Strokes', 'Putts', 'Fairway', 'Pin Notes', 'Hole Notes', 'Yardage source']];
    round.holes.forEach(function (h, i) { rows.push([round.date, round.tee, i + 1, pars[i], yards[i], h.strokes == null ? '' : h.strokes, h.putts == null ? '' : h.putts, h.fairway, h.pin, h.notes, cardLabel]); });
    return rows.map(function (r) { return r.map(escCSV).join(','); }).join('\r\n');
  }

  // ---------- scorecard ----------
  function Card(sc) { this.sc = sc; this.par = sc.par; }
  Card.prototype.tees = function () { return Object.keys(this.sc.original.tees); };
  Card.prototype.source = function (tee) { return this.sc.display.use[tee] === 'provisional' && this.sc.provisional.tees[tee] ? 'provisional' : 'original'; };
  Card.prototype.yards = function (tee) { if (!this.sc.original.tees[tee]) return null; return this.source(tee) === 'provisional' ? this.sc.provisional.tees[tee].yards : this.sc.original.tees[tee].yards; };
  Card.prototype.original = function (tee) { return this.sc.original.tees[tee].yards; };

  /* ---------- live GPS controller (V2.3.1 behaviour) ----------
     Stays on until Stop. Weak signal / timeout retry in 3 s; 45 s watchdog (checked every 15 s); permission denied stops
     with iPhone instructions; resumes on return to the page and after reload within 3 h; screen wake lock while on.
     ui: {onFix(point, accuracy), onStatus(text, kind), onStop()} ; gpsState persisted under pocasset_v3:gps. */
  function Gps(store, ui, env) {
    this.s = store; this.ui = ui; this.env = env || root; this.st = store.get('gps') || {}; this.watchId = null; this.lastFix = 0; this.watchdog = null; this.restartT = null; this.wakeLock = null;
    var prefs = store.get('prefs') || {}; this.wakeOn = prefs.wake !== false; this.opens = 0;
  }
  Gps.prototype.wanted = function () { return !!this.st.on; };
  Gps.prototype.setWanted = function (on) { this.st.on = on; if (on) this.st.onAt = Date.now(); this.s.set('gps', this.st); };
  Gps.prototype.clearWatch = function () { if (this.watchId !== null) { try { this.env.navigator.geolocation.clearWatch(this.watchId); } catch (e) { } this.watchId = null; } };
  Gps.prototype.ago = function () { return Math.max(0, Math.round((Date.now() - this.lastFix) / 1000)); };
  Gps.prototype.open = function () {
    var self = this; this.clearWatch(); this.opens++;
    try { this.watchId = this.env.navigator.geolocation.watchPosition(function (p) { self.fix(p); }, function (e) { self.error(e); }, { enableHighAccuracy: true, maximumAge: 3000 }); }
    catch (e) { this.watchId = null; this.ui.onStatus('GPS restarting… (' + e.message + ')', 'warn'); this.restart(5000); }
  };
  Gps.prototype.restart = function (ms) { var self = this; clearTimeout(this.restartT); this.restartT = setTimeout(function () { if (self.wanted() && self.env.document.visibilityState === 'visible') self.open(); }, ms); };
  Gps.prototype.fix = function (p) {
    if (!this.wanted()) return; this.lastFix = Date.now();
    if (!this.st.fixAt || this.lastFix - this.st.fixAt > 60000) { this.st.fixAt = this.lastFix; this.s.set('gps', this.st); }
    this.ui.onStatus('● LIVE GPS · accuracy approximately ±' + yd(p.coords.accuracy) + ' yd. GPS stays on until you tap Stop GPS.', 'live');
    this.ui.onFix([p.coords.longitude, p.coords.latitude], p.coords.accuracy);
  };
  Gps.prototype.error = function (e) {
    if (!this.wanted()) return;
    if (e.code === 1) {
      this.stop(true);
      this.ui.onStatus('GPS ERROR 1: Location permission denied. On iPhone, open Settings → Privacy & Security → Location Services; allow Safari Websites, then in Safari tap aA / Page Menu → Website Settings → Location → Allow.', 'error');
      return;
    }
    // Weak signal (2) or timeout (3): keep GPS on, keep the last yardages, and try again shortly.
    this.ui.onStatus(this.lastFix ? '◌ Weak GPS signal — retrying. Last fix ' + this.ago() + ' s ago; GPS stays on.' : '◌ Searching for GPS signal… GPS stays on.', 'warn');
    this.restart(3000);
  };
  Gps.prototype.start = function (auto) {
    var self = this, env = this.env;
    if (!env.isSecureContext) { this.ui.onStatus('GPS BLOCKED: this page is not in a secure (https) browser context. Open the published https://scottamcintire.github.io/pocasset-caddie-v3/play/ address directly in Safari.', 'error'); return false; }
    if (!env.navigator.geolocation) { this.ui.onStatus('GPS unavailable in this browser. Use Safari on your iPhone and check Location Services.', 'error'); return false; }
    this.setWanted(true);
    if (this.watchId !== null) return true;
    this.ui.onStatus(auto === true ? 'Resuming live GPS…' : 'Requesting iPhone location… If asked, tap Allow While Using.', 'warn');
    setTimeout(function () { self.wake(); }, 0);
    this.open();
    clearInterval(this.watchdog); this.watchdog = setInterval(function () {
      if (!self.wanted() || env.document.visibilityState !== 'visible') return;
      var silent = self.lastFix ? Date.now() - self.lastFix : Infinity;
      if (self.watchId === null || silent > 45000) { if (self.lastFix) self.ui.onStatus('◌ Waiting for GPS… last fix ' + self.ago() + ' s ago. GPS stays on.', 'warn'); self.open(); }
    }, 15000);
    return true;
  };
  Gps.prototype.stop = function (silent) {
    this.setWanted(false); clearInterval(this.watchdog); this.watchdog = null; clearTimeout(this.restartT); this.releaseWake(); this.clearWatch();
    if (!silent) this.ui.onStatus('GPS stopped.', 'off'); this.ui.onStop();
  };
  Gps.prototype.wake = function () {
    var self = this, nav = this.env.navigator;
    if (!this.wakeOn || !('wakeLock' in nav) || !this.wanted()) return; if (this.wakeLock && !this.wakeLock.released) return;
    nav.wakeLock.request('screen').then(function (w) { self.wakeLock = w; w.addEventListener('release', function () { setTimeout(function () { if (self.env.document.visibilityState === 'visible' && self.wanted()) self.wake(); }, 1000); }); }).catch(function () { });
  };
  Gps.prototype.releaseWake = function () { try { this.wakeLock && this.wakeLock.release(); } catch (e) { } this.wakeLock = null; };
  Gps.prototype.setWake = function (on) { this.wakeOn = on; var p = this.s.get('prefs') || {}; p.wake = on; this.s.set('prefs', p); if (on) this.wake(); else this.releaseWake(); };
  Gps.prototype.attach = function () {   // resume rules
    var self = this, doc = this.env.document;
    doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible' && self.wanted()) { if (self.watchId === null) self.start(true); else self.open(); self.wake(); } });
    this.env.addEventListener('pageshow', function (e) { if (e.persisted && self.wanted()) self.start(true); });
    if (this.st.on) { var last = Math.max(this.st.fixAt || 0, this.st.onAt || 0); if (Date.now() - last < 3 * 3600 * 1000) setTimeout(function () { self.start(true); }, 0); else { this.st.on = false; this.s.set('gps', this.st); } }
  };

  var api = { R_EARTH: R_EARTH, YARDS_PER_METER: YARDS_PER_METER, xy: xy, yd: yd, uv2ll: uv2ll, todayStr: todayStr, Course: Course, AutoHole: AutoHole, Pins: Pins, Store: Store, PREFIX: PREFIX,
              newRound: newRound, adjust: adjust, totals: totals, csv: csv, Card: Card, Gps: Gps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PCaddie = api;
})(this);
