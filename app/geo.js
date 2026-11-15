/* Pocasset V3 — geographic calculations (no drawing code here).
   Hole frame: origin = green-pin-frame origin, v = toward the green along the last leg, u = golfer's right, metres.
   Same Earth radius and equirectangular conversion as production V2.x and the approved green pin model.
   Works in browsers (window.PGeo) and in Node (module.exports) so tests can run without a browser. */
(function (root) {
  'use strict';
  var R = 6371008.8, DEG = Math.PI / 180, YD = 0.9144;

  function Frame(origin, bearingDeg) {
    this.lon0 = origin[0]; this.lat0 = origin[1]; this.k = Math.cos(this.lat0 * DEG);
    this.b = bearingDeg * DEG;
  }
  Frame.prototype.toUV = function (lon, lat) {
    var e = (lon - this.lon0) * DEG * R * this.k, n = (lat - this.lat0) * DEG * R;
    return [e * Math.cos(this.b) - n * Math.sin(this.b), e * Math.sin(this.b) + n * Math.cos(this.b)];
  };
  Frame.prototype.toLonLat = function (u, v) {
    var e = u * Math.cos(this.b) + v * Math.sin(this.b), n = -u * Math.sin(this.b) + v * Math.cos(this.b);
    return [this.lon0 + e / (R * this.k) / DEG, this.lat0 + n / R / DEG];
  };

  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function centroid(P) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0; i < P.length - 1; i++) {
      var cr = P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1]; a += cr;
      cx += (P[i][0] + P[i + 1][0]) * cr; cy += (P[i][1] + P[i + 1][1]) * cr;
    }
    return Math.abs(a) < 1e-9 ? P[0] : [cx / (3 * a), cy / (3 * a)];
  }
  /* Where the ray from p0 through `through` enters and leaves polygon ring P (production front/back method). */
  function rayExtents(p0, through, P) {
    var dx = through[0] - p0[0], dy = through[1] - p0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ts = [];
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i], b = P[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], den = ux * ey - uy * ex;
      if (Math.abs(den) < 1e-12) continue;
      var t = ((a[0] - p0[0]) * ey - (a[1] - p0[1]) * ex) / den, s = ((a[0] - p0[0]) * uy - (a[1] - p0[1]) * ux) / den;
      if (s >= 0 && s <= 1 && t > 0) ts.push(t);
    }
    if (!ts.length) return null;
    return [Math.min.apply(null, ts), Math.max.apply(null, ts), ux, uy];
  }
  /* Distances along polyline L (from its first point) where it crosses polygon P. */
  function lineCrossings(P, L) {
    var out = [], acc = 0;
    for (var i = 0; i < L.length - 1; i++) {
      var a = L[i], b = L[i + 1], seg = dist(a, b);
      for (var j = 0; j < P.length - 1; j++) {
        var c = P[j], d = P[j + 1];
        var den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
        if (Math.abs(den) < 1e-12) continue;
        var t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
        var u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push(acc + t * seg);
      }
      acc += seg;
    }
    return out.sort(function (x, y) { return x - y; });
  }
  function pointAlong(L, m) {        // point at distance m along polyline L
    for (var i = 0; i < L.length - 1; i++) {
      var s = dist(L[i], L[i + 1]);
      if (m <= s) { var t = m / s; return [L[i][0] + t * (L[i + 1][0] - L[i][0]), L[i][1] + t * (L[i + 1][1] - L[i][1])]; }
      m -= s;
    }
    return L[L.length - 1].slice();
  }
  function length(L) { var s = 0; for (var i = 0; i < L.length - 1; i++) s += dist(L[i], L[i + 1]); return s; }
  function alongLine(q, L) {          // [distance along L to q's projection, perpendicular distance]
    var best = null, acc = 0;
    for (var i = 0; i < L.length - 1; i++) {
      var a = L[i], b = L[i + 1], ax = b[0] - a[0], ay = b[1] - a[1], LL = ax * ax + ay * ay;
      var t = LL ? Math.max(0, Math.min(1, ((q[0] - a[0]) * ax + (q[1] - a[1]) * ay) / LL)) : 0;
      var d = Math.hypot(q[0] - a[0] - t * ax, q[1] - a[1] - t * ay);
      if (!best || d < best[1]) best = [acc + t * Math.sqrt(LL), d];
      acc += Math.sqrt(LL);
    }
    return best;
  }

  /* Production V2.2.1 intersectionExtents, ported line for line. Inputs lon/lat; output metres.
     center = production green centre point; ring = green outline; route = playing line (fallback direction). */
  function prodGreenExtents(center, ring, player, route) {
    var deg = DEG;
    function xy(point, ref) { return { x: (point[0] - ref[0]) * deg * R * Math.cos(ref[1] * deg), y: (point[1] - ref[1]) * deg * R }; }
    var v = xy(player, center), r = Math.hypot(v.x, v.y);
    var prev = xy(route[Math.max(0, route.length - 2)], center);
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
    return { r: r, front: front, back: back, ux: ux, uy: uy };
  }

  /* Build a hole model from the standardized features (lon/lat) and the hole frame. */
  function Hole(holeJson, featureCollection) {
    var F = new Frame(holeJson.frame.origin_lonlat, holeJson.frame.playing_bearing_deg), self = this;
    this.frame = F; this.feats = [];
    featureCollection.features.forEach(function (f) {
      var g = f.geometry, pts = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'LineString' ? g.coordinates : null;
      if (!pts) return;
      var uv = pts.map(function (c) { return F.toUV(c[0], c[1]); });
      self.feats.push({ id: f.properties.id, cls: f.properties['class'], position: f.properties.position,
                        status: f.properties.geometry_status, type: g.type, uv: uv });
    });
    this.line = this.feats.filter(function (f) { return f.cls === 'centerline'; })[0].uv;
    this.green = this.feats.filter(function (f) { return f.cls === 'green'; })[0].uv;
    this.lineLen = length(this.line);
    this.greenLL = featureCollection.features.filter(function (f) { return f.properties['class'] === 'green'; })[0].geometry.coordinates[0].slice(0, -1);
    this.lineLL = featureCollection.features.filter(function (f) { return f.properties['class'] === 'centerline'; })[0].geometry.coordinates;
    this.centerLL = holeJson.production_green_center;
    this.centerUV = this.centerLL ? F.toUV(this.centerLL[0], this.centerLL[1]) : [0, 0];
  }
  /* Green front/center/back along the line from the player through the green centre (origin). */
  Hole.prototype.greenFCB = function (p) {
    // Production method on the production green centre (identical yardages to V2.3.1).
    var ll = this.frame.toLonLat(p[0], p[1]), e = prodGreenExtents(this.centerLL, this.greenLL, ll, this.lineLL), F = this.frame, c = this.centerLL;
    function at(t) {   // point on the line through the centre at signed distance t (toward the player) -> hole frame
      var lon = c[0] + (e.ux * t) / (DEG * R * Math.cos(c[1] * DEG)), lat = c[1] + (e.uy * t) / (DEG * R); return F.toUV(lon, lat);
    }
    return { front: Math.abs(e.r - e.front), center: e.r, back: Math.abs(e.r - e.back), fp: at(e.front), bp: at(e.back), cp: this.centerUV };
  };
  /* Current target: the dogleg point while short of it, otherwise the green centre. */
  Hole.prototype.route = function (p) {
    var al = alongLine(p, this.line)[0], pts = [p];
    var acc = 0;
    for (var i = 1; i < this.line.length - 1; i++) { acc += dist(this.line[i - 1], this.line[i]); if (al < acc - 5) pts.push(this.line[i]); }
    pts.push(this.centerUV);
    return pts;
  };
  /* Hazards ahead and near the player's line of play.  rule = {corridor_m, max} */
  Hole.prototype.hazards = function (p, rule) {
    var route = this.route(p), out = [], self = this;
    this.feats.forEach(function (f) {
      if (f.cls !== 'bunker' && f.cls !== 'water') return;
      var reach, carry, how, anchor;
      if (f.position === 'across') {
        var xs = lineCrossings(f.uv, route);
        if (!xs.length) return;
        reach = xs[0]; carry = xs[xs.length - 1]; how = 'along line'; anchor = pointAlong(route, (reach + carry) / 2);
      } else {
        var c = centroid(f.uv), e = rayExtents(p, c, f.uv);
        if (!e) return;
        reach = e[0]; carry = e[1]; how = 'through hazard';
        // lateral distance of the hazard centre from the line of play
        var lat = alongLine(c, route)[1];
        if (lat > rule.corridor_m) return;
        // must be ahead: projection along route beyond the player
        if (alongLine(c, route)[0] < 5) return;
        anchor = c;
      }
      out.push({ id: f.id, cls: f.cls, position: f.position, status: f.status, reach: reach, carry: carry, how: how, anchor: anchor });
    });
    out.sort(function (a, b) { return a.reach - b.reach; });
    return out.slice(0, rule.max);
  };
  Hole.prototype.alongFromGreen = function (yards) {   // a point on the playing line `yards` from the green centre
    return pointAlong(this.line, Math.max(0, this.lineLen - yards * YD));
  };

  /* Projection: hole-frame metres -> image pixels for one rendered view (null if behind the camera). */
  function project(H, u, v) {
    var w = H[2][0] * u + H[2][1] * v + H[2][2];
    if (w <= 1e-9) return null;
    return [(H[0][0] * u + H[0][1] * v + H[0][2]) / w, (H[1][0] * u + H[1][1] * v + H[1][2]) / w];
  }
  function invert3(m) {
    var a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], g = m[2][0], h = m[2][1], i = m[2][2];
    var A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
    return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
  }

  /* Terrain (renderer v0.2+): bilinear heights from terrain.json (row i = v0 + i*cell, column j = u0 + j*cell, decimetres).
     Same formula as tools/render_flyover.py TerrainLookup. Used only to place overlays on the picture, never for distances. */
  function Terrain(t) {
    this.t = t; this.z = t.z_dm;
  }
  Terrain.prototype.h = function (u, v) {
    var t = this.t, x = (u - t.u0) / t.cell_m, y = (v - t.v0) / t.cell_m;
    x = Math.max(0, Math.min(t.cols - 1.0001, x)); y = Math.max(0, Math.min(t.rows - 1.0001, y));
    var i = Math.floor(y), j = Math.floor(x), fx = x - j, fy = y - i, Z = this.z;
    return ((Z[i][j] * (1 - fx) + Z[i][j + 1] * fx) * (1 - fy) + (Z[i + 1][j] * (1 - fx) + Z[i + 1][j + 1] * fx) * fy) / 10;
  };
  /* One rendered view: projection with the stored 3x4 camera matrix + height model, and the inverse (tap -> ground)
     by marching the camera ray over the terrain. */
  function View(pj, terrain) {
    this.pj = pj; this.M = pj.camera_matrix; this.T = terrain;
    this.zref = pj.height_model.z_ref_m; this.ex = pj.height_model.vertical_exaggeration;
    var M = this.M, A = [[M[0][0], M[0][1], M[0][2]], [M[1][0], M[1][1], M[1][2]], [M[2][0], M[2][1], M[2][2]]];
    this.Ai = invert3(A);
    var p4 = [M[0][3], M[1][3], M[2][3]], Ai = this.Ai;
    this.C = [0, 1, 2].map(function (r) { return -(Ai[r][0] * p4[0] + Ai[r][1] * p4[1] + Ai[r][2] * p4[2]); });
  }
  View.prototype.z = function (u, v) { return (this.T.h(u, v) - this.zref) * this.ex; };
  View.prototype.project = function (u, v) {
    var M = this.M, z = this.z(u, v);
    var w = M[2][0] * u + M[2][1] * v + M[2][2] * z + M[2][3];
    if (w <= 1e-9) return null;
    return [(M[0][0] * u + M[0][1] * v + M[0][2] * z + M[0][3]) / w, (M[1][0] * u + M[1][1] * v + M[1][2] * z + M[1][3]) / w];
  };
  View.prototype.unproject = function (x, y) {       // image pixel -> ground (u, v) on the terrain, or null (sky)
    var Ai = this.Ai, C = this.C;
    var d = [0, 1, 2].map(function (r) { return Ai[r][0] * x + Ai[r][1] * y + Ai[r][2]; });
    var n = Math.hypot(d[0], d[1], d[2]); d = d.map(function (q) { return q / n; });
    if (d[2] >= -1e-6) return null;
    var self = this, step = 1.0, t = 0, prev = 0, hit = null;
    function below(tt) { var u = C[0] + d[0] * tt, v = C[1] + d[1] * tt; return C[2] + d[2] * tt <= self.z(u, v); }
    for (var k = 0; k < 4000; k++) { t += step; if (below(t)) { hit = t; break; } prev = t; }
    if (hit == null) return null;
    var lo = prev, hi = hit;
    for (var b = 0; b < 30; b++) { var mid = (lo + hi) / 2; if (below(mid)) hi = mid; else lo = mid; }
    t = (lo + hi) / 2;
    return [C[0] + d[0] * t, C[1] + d[1] * t];
  };

  var api = { R: R, YD: YD, Frame: Frame, Hole: Hole, prodGreenExtents: prodGreenExtents, rayExtents: rayExtents, lineCrossings: lineCrossings, centroid: centroid,
              alongLine: alongLine, pointAlong: pointAlong, project: project, invert3: invert3, dist: dist, Terrain: Terrain, View: View,
              yd: function (m) { return m == null ? null : Math.round(m / YD); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PGeo = api;
})(this);
