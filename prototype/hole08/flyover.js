/* Pocasset V3 — flyover overlay (moved unchanged out of prototype/src/index.html so the hole pages and the
   integrated /play/ page draw identical overlays). Returns SVG markup for one rendered view; never alters the art.
   overlay(view, hole, me, opts) -> {svg, fcb, hz}
     view: {width, height, V: PGeo.View}   hole: PGeo.Hole   me: [u,v] hole-frame metres
     opts: {name:'tee'|'approach', target:[u,v]|null, pinUV:[u,v]|null, rule:{corridor_m,max}} */
(function (root) {
  'use strict';
  var G = root.PGeo || (typeof require !== 'undefined' ? require('./geo.js') : null), YD = 0.9144;
  function yd(m) { return m == null ? '—' : String(Math.round(m / YD)); }
  function layout(LB, W, H) {   // labels placed with collision avoidance so numbers never overlap
    var placed = [], out = '';
    LB.sort(function (a, b) { return a.prio - b.prio; });
    LB.forEach(function (L) {
      var w = Math.max.apply(null, L.lines.map(function (t, i) { return t.length * (i ? 12.5 : 23); })) + 24, h = L.lines.length > 1 ? 78 : 50;
      var cands = [L.pref, [L.pref[0], L.pref[1] - 80], [L.pref[0], L.pref[1] + 80], [-L.pref[0], L.pref[1]], [L.pref[0] * 2, L.pref[1]], [L.pref[0], L.pref[1] - 160], [L.pref[0], L.pref[1] + 160], [-L.pref[0] * 2, L.pref[1]], [0, -150], [0, 150], [L.pref[0], L.pref[1] - 240], [L.pref[0], L.pref[1] + 240]];
      var best = null;
      for (var k = 0; k < cands.length && !best; k++) {
        var cx = L.ax + cands[k][0], cy = L.ay + cands[k][1], box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
        if (box[0] < 4 || box[2] > W - 4 || box[1] < 4 || box[3] > H - 4) continue;
        if (placed.some(function (b) { return !(box[2] < b[0] - 6 || box[0] > b[2] + 6 || box[3] < b[1] - 6 || box[1] > b[3] + 6); })) continue;
        best = box;
      }
      if (!best) return;
      placed.push(best);
      var cx2 = (best[0] + best[2]) / 2, cy2 = (best[1] + best[3]) / 2;
      if (Math.hypot(cx2 - L.ax, cy2 - L.ay) > 50) out += '<line x1="' + L.ax.toFixed(1) + '" y1="' + L.ay.toFixed(1) + '" x2="' + cx2.toFixed(1) + '" y2="' + (cy2 + (cy2 < L.ay ? h / 2 : -h / 2)).toFixed(1) + '" stroke="#fff" stroke-width="2.5" stroke-opacity=".85"/><circle cx="' + L.ax.toFixed(1) + '" cy="' + L.ay.toFixed(1) + '" r="5" fill="#fff"/>';
      out += '<g class="lbl"><rect class="pill" x="' + best[0] + '" y="' + best[1] + '" width="' + w + '" height="' + h + '" rx="14"/>';
      L.lines.forEach(function (t, i) { out += '<text x="' + cx2.toFixed(1) + '" y="' + (best[1] + (i ? 66 : 37)).toFixed(1) + '" text-anchor="middle" font-size="' + (i ? 20 : 38) + '"' + (i ? ' class="sub"' : '') + '>' + t + '</text>'; });
      out += '</g>';
    });
    return out;
  }
  function overlay(view, hole, me, opts) {
    var LB = [], s = '', W = view.width, H = view.height, name = opts.name;
    function P(uv) { return view.V.project(uv[0], uv[1]); }
    function want(ax, ay, lines, pref, prio) { LB.push({ ax: ax, ay: ay, lines: lines, pref: pref || [0, -70], prio: prio == null ? 5 : prio }); }
    var fcb = hole.greenFCB(me);
    // route line from me (via dogleg) to the green
    var route = hole.route(me).map(P).filter(Boolean);
    if (route.length > 1) s += '<polyline points="' + route.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="4" stroke-dasharray="14 12"/>';
    // green front / center / back markers
    [['fp', fcb.front, 'F'], [null, fcb.center, 'C'], ['bp', fcb.back, 'B']].forEach(function (k) {
      var uv = k[0] ? fcb[k[0]] : fcb.cp; if (!uv) return; var p = P(uv); if (!p) return;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#fff" stroke="#000" stroke-opacity=".5" stroke-width="2"/>';
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
        var sc = name === 'tee' ? 1 : 1.8;
        s += '<g transform="translate(' + fp[0] + ' ' + fp[1] + ') scale(' + sc + ')"><ellipse rx="9" ry="4" fill="#000" opacity=".35"/><path d="M0 0 V-62" stroke="#fff" stroke-width="4"/><path d="M0 -62 L30 -52 L0 -42 Z" fill="#ff3b30"/></g>';
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
        var mp = P(me); if (mp) s += '<line x1="' + mp[0] + '" y1="' + mp[1] + '" x2="' + tp[0] + '" y2="' + tp[1] + '" stroke="#ffd34d" stroke-width="5"/>';
        if (pc) s += '<line x1="' + tp[0] + '" y1="' + tp[1] + '" x2="' + pc[0] + '" y2="' + pc[1] + '" stroke="#ffd34d" stroke-width="3" stroke-dasharray="10 10"/>';
        s += '<circle cx="' + tp[0] + '" cy="' + tp[1] + '" r="22" fill="none" stroke="#fff" stroke-width="6"/><circle cx="' + tp[0] + '" cy="' + tp[1] + '" r="5" fill="#fff"/>';
        want(tp[0], tp[1], [yd(d1), yd(d2) + ' to green'], [0, -90], 0);
      }
    }
    // me
    var m = P(me);
    if (m && m[0] >= 0 && m[0] <= W && m[1] >= 0 && m[1] <= H) {
      s += '<circle cx="' + m[0] + '" cy="' + m[1] + '" r="20" fill="#1d6fe0" stroke="#fff" stroke-width="7"/>';
    } else if (m) {
      var cx = Math.max(60, Math.min(W - 60, m[0])), cy = H - 70;
      s += '<g><rect x="' + (cx - 150) + '" y="' + (cy - 46) + '" width="300" height="70" rx="35" fill="#0a1a30" fill-opacity=".85"/><text x="' + cx + '" y="' + (cy + 2) + '" text-anchor="middle" font-size="32" font-weight="800" fill="#fff">▼ You · ' + yd(fcb.center) + ' yd</text></g>';
    }
    s += layout(LB, W, H);
    return { svg: s, fcb: fcb, hz: hz };
  }
  function posText(p) { return { across: 'crosses your line', 'green-front': 'front of green', 'green-back': 'behind green', 'green-left': 'left of green', 'green-right': 'right of green', 'green-front-left': 'front-left of green', 'green-front-right': 'front-right of green', 'green-back-left': 'back-left', 'green-back-right': 'back-right', L: 'left', R: 'right' }[p] || p; }
  var api = { overlay: overlay, layout: layout, posText: posText, yd: yd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PFly = api;
})(this);
