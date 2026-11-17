/* Pocasset V3 — flyover overlay (moved unchanged out of prototype/src/index.html so the hole pages and the
   integrated /play/ page draw identical overlays). Returns SVG markup for one rendered view; never alters the art.
   overlay(view, hole, me, opts) -> {svg, fcb, hz}
     view: {width, height, V: PGeo.View}   hole: PGeo.Hole   me: [u,v] hole-frame metres
     opts: {name:'tee'|'approach', target:[u,v]|null, pinUV:[u,v]|null, rule:{corridor_m,max},
            box: optional visible rectangle {x,y,w,h} in image pixels (GPS zoom, /play/ only)}
   With a box, labels are laid out inside it and every mark is drawn at 1/zoom size so it keeps its on-screen size;
   positions are unchanged (same projection), so marks stay on their ground points. Without a box: output identical. */
(function (root) {
  'use strict';
  var G = root.PGeo || (typeof require !== 'undefined' ? require('./geo.js') : null), YD = 0.9144;
  function yd(m) { return m == null ? '—' : String(Math.round(m / YD)); }
  function n(v) { return v; }   // numbers written as before (no rounding), so output without a box is byte-identical
  function layout(LB, W, H, B, k) {   // labels placed with collision avoidance so numbers never overlap
    B = B || { x: 0, y: 0, w: W, h: H }; k = k || 1;
    var placed = [], out = '';
    LB.sort(function (a, b) { return a.prio - b.prio; });
    LB.forEach(function (L) {
      var w = (Math.max.apply(null, L.lines.map(function (t, i) { return t.length * (i ? 12.5 : 23); })) + 24) * k, h = (L.lines.length > 1 ? 78 : 50) * k;
      var cands = [L.pref, [L.pref[0], L.pref[1] - 80 * k], [L.pref[0], L.pref[1] + 80 * k], [-L.pref[0], L.pref[1]], [L.pref[0] * 2, L.pref[1]], [L.pref[0], L.pref[1] - 160 * k], [L.pref[0], L.pref[1] + 160 * k], [-L.pref[0] * 2, L.pref[1]], [0, -150 * k], [0, 150 * k], [L.pref[0], L.pref[1] - 240 * k], [L.pref[0], L.pref[1] + 240 * k]];
      var best = null;
      for (var c = 0; c < cands.length && !best; c++) {
        var cx = L.ax + cands[c][0], cy = L.ay + cands[c][1], box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
        if (box[0] < B.x + 4 * k || box[2] > B.x + B.w - 4 * k || box[1] < B.y + 4 * k || box[3] > B.y + B.h - 4 * k) continue;
        if (placed.some(function (b) { return !(box[2] < b[0] - 6 * k || box[0] > b[2] + 6 * k || box[3] < b[1] - 6 * k || box[1] > b[3] + 6 * k); })) continue;
        best = box;
      }
      if (!best) return;
      placed.push(best);
      var cx2 = (best[0] + best[2]) / 2, cy2 = (best[1] + best[3]) / 2;
      if (Math.hypot(cx2 - L.ax, cy2 - L.ay) > 50 * k) out += '<line x1="' + L.ax.toFixed(1) + '" y1="' + L.ay.toFixed(1) + '" x2="' + cx2.toFixed(1) + '" y2="' + (cy2 + (cy2 < L.ay ? h / 2 : -h / 2)).toFixed(1) + '" stroke="#fff" stroke-width="' + n(2.5 * k) + '" stroke-opacity=".85"/><circle cx="' + L.ax.toFixed(1) + '" cy="' + L.ay.toFixed(1) + '" r="' + n(5 * k) + '" fill="#fff"/>';
      out += '<g class="lbl"' + (k !== 1 ? ' style="stroke-width:' + n(5 * k) + 'px"' : '') + '><rect class="pill" x="' + n(best[0]) + '" y="' + n(best[1]) + '" width="' + n(w) + '" height="' + n(h) + '" rx="' + n(14 * k) + '"/>';
      L.lines.forEach(function (t, i) { out += '<text x="' + cx2.toFixed(1) + '" y="' + (best[1] + (i ? 66 : 37) * k).toFixed(1) + '" text-anchor="middle" font-size="' + n((i ? 20 : 38) * k) + '"' + (i ? ' class="sub"' : '') + '>' + t + '</text>'; });
      out += '</g>';
    });
    return out;
  }
  function overlay(view, hole, me, opts) {
    var LB = [], s = '', W = view.width, H = view.height, name = opts.name;
    var B = opts.box || null, k = B ? B.w / W : 1;
    function P(uv) { return view.V.project(uv[0], uv[1]); }
    function want(ax, ay, lines, pref, prio) { pref = pref || [0, -70]; LB.push({ ax: ax, ay: ay, lines: lines, pref: [pref[0] * k, pref[1] * k], prio: prio == null ? 5 : prio }); }
    var fcb = hole.greenFCB(me);
    // route line from me (via dogleg) to the green
    var route = hole.route(me).map(P).filter(Boolean);
    if (route.length > 1) s += '<polyline points="' + route.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="' + n(4 * k) + '" stroke-dasharray="' + n(14 * k) + ' ' + n(12 * k) + '"/>';
    // green front / center / back markers
    [['fp', fcb.front, 'F'], [null, fcb.center, 'C'], ['bp', fcb.back, 'B']].forEach(function (q) {
      var uv = q[0] ? fcb[q[0]] : fcb.cp; if (!uv) return; var p = P(uv); if (!p) return;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + n(7 * k) + '" fill="#fff" stroke="#000" stroke-opacity=".5" stroke-width="' + n(2 * k) + '"/>';
    });
    var pc = P(fcb.cp);
    if (pc) {
      var pf = fcb.fp && P(fcb.fp), pb = fcb.bp && P(fcb.bp);
      want(pc[0], pc[1], [yd(fcb.center), 'center'], [0, -120], 1);
      if (name !== 'tee') {   // front/back labels in the Approach view; the header always shows all three
        if (pf) want(pf[0], pf[1], [yd(fcb.front), 'front'], [-150, -40], 2);
        if (pb) want(pb[0], pb[1], [yd(fcb.back), 'back'], [150, -60], 2);
      }
    }
    // flag at the pin (today's, or the sample until a pin is entered)
    if (opts.pinUV) {
      var fp = P(opts.pinUV); if (fp) {
        var sc = (name === 'tee' ? 1 : 1.8) * k;
        s += '<g transform="translate(' + fp[0] + ' ' + fp[1] + ') scale(' + n(sc) + ')"><ellipse rx="9" ry="4" fill="#000" opacity=".35"/><path d="M0 0 V-62" stroke="#fff" stroke-width="4"/><path d="M0 -62 L30 -52 L0 -42 Z" fill="#ff3b30"/></g>';
      }
    }
    // hazards
    var hz = hole.hazards(me, opts.rule);
    hz.forEach(function (h, i) {
      var a = P(h.anchor); if (!a) return;
      var side = h.anchor[0] < hole.centerUV[0] ? -1 : 1, nm = h.cls === 'water' ? 'pond' : 'bunker';
      want(a[0], a[1], [yd(h.reach) + ' · ' + yd(h.carry), nm + ' front · carry'], [side * 190, 0], 3 + i);
    });
    // target marker (tap to measure)
    if (opts.target) {
      var tp = P(opts.target); if (tp) {
        var d1 = G.dist(me, opts.target), d2 = G.dist(opts.target, hole.centerUV);
        var mp = P(me); if (mp) s += '<line x1="' + mp[0] + '" y1="' + mp[1] + '" x2="' + tp[0] + '" y2="' + tp[1] + '" stroke="#ffd34d" stroke-width="' + n(5 * k) + '"/>';
        if (pc) s += '<line x1="' + tp[0] + '" y1="' + tp[1] + '" x2="' + pc[0] + '" y2="' + pc[1] + '" stroke="#ffd34d" stroke-width="' + n(3 * k) + '" stroke-dasharray="' + n(10 * k) + ' ' + n(10 * k) + '"/>';
        s += '<circle cx="' + tp[0] + '" cy="' + tp[1] + '" r="' + n(22 * k) + '" fill="none" stroke="#fff" stroke-width="' + n(6 * k) + '"/><circle cx="' + tp[0] + '" cy="' + tp[1] + '" r="' + n(5 * k) + '" fill="#fff"/>';
        want(tp[0], tp[1], [yd(d1), yd(d2) + ' to green'], [0, -90], 0);
      }
    }
    // me (if outside the visible area: a "You" pill at its bottom edge)
    var m = P(me), bx = B ? B.x : 0, by = B ? B.y : 0, bw = B ? B.w : W, bh = B ? B.h : H;
    if (m && m[0] >= bx && m[0] <= bx + bw && m[1] >= by && m[1] <= by + bh) {
      s += '<circle cx="' + m[0] + '" cy="' + m[1] + '" r="' + n(20 * k) + '" fill="#1d6fe0" stroke="#fff" stroke-width="' + n(7 * k) + '"/>';
    } else if (m) {
      var cx = Math.max(bx + 60 * k, Math.min(bx + bw - 60 * k, m[0])), cy = by + bh - 70 * k;
      s += '<g><rect x="' + n(cx - 150 * k) + '" y="' + n(cy - 46 * k) + '" width="' + n(300 * k) + '" height="' + n(70 * k) + '" rx="' + n(35 * k) + '" fill="#0a1a30" fill-opacity=".85"/><text x="' + n(cx) + '" y="' + n(cy + 2 * k) + '" text-anchor="middle" font-size="' + n(32 * k) + '" font-weight="800" fill="#fff">▼ You · ' + yd(fcb.center) + ' yd</text></g>';
    }
    s += layout(LB, W, H, B, k);
    return { svg: s, fcb: fcb, hz: hz };
  }
  /* GPS zoom (/play/): the visible rectangle for a distance to the green centre. Zoom 1 at >= 150 yd, rising
     smoothly to 2.8 at 10 yd; centred between the green and the golfer and shrunk only as far as keeps both inside
     (with a margin); always inside the image and at the image's aspect ratio. */
  var ZOOM_PTS = [[150, 1], [75, 1.6], [50, 1.95], [30, 2.3], [10, 2.8]];
  function zoomFor(yards) {
    if (yards == null || !isFinite(yards)) return 1;
    var y = Math.max(0, yards), P = ZOOM_PTS;
    if (y >= P[0][0]) return 1;
    if (y <= P[P.length - 1][0]) return P[P.length - 1][1];
    for (var i = 1; i < P.length; i++) if (y >= P[i][0]) { var a = P[i - 1], b = P[i], t = (a[0] - y) / (a[0] - b[0]); t = t * t * (3 - 2 * t); return a[1] + (b[1] - a[1]) * t; }
    return 1;
  }
  function zoomBox(W, H, z, green, me) {
    var pts = [green].concat(me ? [me] : []), xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var mx = 0.22, need = Math.max((Math.max.apply(null, xs) - Math.min.apply(null, xs)) / (W * (1 - 2 * mx)), (Math.max.apply(null, ys) - Math.min.apply(null, ys)) / (H * (1 - 2 * mx)));
    var zz = Math.max(1, Math.min(z, need > 0 ? 1 / need : z)), w = W / zz, h = H / zz;
    var x = Math.max(0, Math.min(W - w, cx - w / 2)), y = Math.max(0, Math.min(H - h, cy - h / 2));
    return { x: x, y: y, w: w, h: h, z: zz };
  }
  function posText(p) { return { across: 'crosses your line', 'green-front': 'front of green', 'green-back': 'behind green', 'green-left': 'left of green', 'green-right': 'right of green', 'green-front-left': 'front-left of green', 'green-front-right': 'front-right of green', 'green-back-left': 'back-left', 'green-back-right': 'back-right', L: 'left', R: 'right' }[p] || p; }
  var api = { overlay: overlay, layout: layout, posText: posText, yd: yd, zoomFor: zoomFor, zoomBox: zoomBox };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PFly = api;
})(this);
