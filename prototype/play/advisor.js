/* Pocasset V3 — AI Caddie Shot Advisor engine (no drawing code; hole-independent).
   Input: a PGeo.Hole, the golfer's position (hole frame, metres), the distance to the target (the header's V2.3.1 yardage
   to today's valid pin, else the green centre), and ADVISOR_CONFIG. Output: ATTACK and PLAY SMART, each with club, swing,
   expected distance, distance remaining, and a risk / advantage line, plus which one is starred.
   Honesty rules: hazards are used only as mapped (status shown); distances are estimates, so no "carries the hazard"
   claims; a shorter shot is never called safe; if nothing meaningfully different exists, Play Smart = Attack.
   Works in browsers (window.PAdvisor) and in Node (module.exports) for tests. */
(function (root) {
  'use strict';
  var YD = 0.9144, SWINGS = ['quarter', 'half', 'three_quarter', 'full'],
      SWING_TXT = { quarter: '¼ SWING', half: '½ SWING', three_quarter: '¾ SWING', full: 'FULL' }, SWING_SHORT = { quarter: '¼', half: '½', three_quarter: '¾', full: 'FULL' };
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function inRing(q, ring) { var c = false; for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) { var a = ring[i], b = ring[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  // point m metres along polyline L; past the end it continues in the last segment's direction
  function along(L, m) {
    for (var i = 0; i < L.length - 1; i++) { var d = dist(L[i], L[i + 1]); if (m <= d || i === L.length - 2) { var f = d ? m / d : 0; return [L[i][0] + f * (L[i + 1][0] - L[i][0]), L[i][1] + f * (L[i + 1][1] - L[i][1])]; } m -= d; }
    return L[0];
  }
  function options(cfg) {
    var out = [];
    cfg.clubs.forEach(function (c) {
      SWINGS.forEach(function (s, si) {
        var d = c[s]; if (d == null) return;
        var lo = Array.isArray(d) ? d[0] : d, hi = Array.isArray(d) ? d[1] : d;
        out.push({ club: c.name, swing: s, swingText: SWING_SHORT[s], full: s === 'full', lo: lo, hi: hi, mid: (lo + hi) / 2, teeOnly: !!c.tee_only, order: si });
      });
    });
    return out;
  }
  function rangeTxt(o) { return o.lo === o.hi ? o.lo + ' yd' : o.lo + '–' + o.hi + ' yd'; }
  function hzName(h, posText) { return (h.cls === 'water' ? 'pond' : 'bunker') + (h.position && h.position !== 'across' ? ' (' + posText(h.position) + ')' : ''); }

  /* args: {hole, me:[u,v], targetUV, targetYd, targetKind:'flag'|'centre', centreYd, par, teeUVs:[[u,v]...], cfg, posText} */
  function recommend(a) {
    var cfg = a.cfg, R = cfg.rules, D = a.targetYd, posText = a.posText || function (p) { return p; };
    var onTee = (a.teeUVs || []).some(function (t) { return dist(t, a.me) / YD <= R.tee_radius_yd; }) ||
                a.hole.feats.some(function (f) { return f.cls === 'tee' && f.type === 'Polygon' && inRing(a.me, f.uv); });
    var verified = true, haz = a.hole.hazards(a.me, { corridor_m: R.corridor_yd * YD, max: Infinity })
      .map(function (h) { if (h.status !== 'verified') verified = false; return { id: h.id, cls: h.cls, position: h.position, status: h.status, reach: h.reach / YD, carry: h.carry / YD }; })
      .filter(function (h) { return h.reach <= D + R.hazard_lookahead_yd; });
    var base = { targetYd: D, targetKind: a.targetKind, onTee: onTee, hazardsVerified: verified && haz.length > 0, hazardCount: haz.length,
                 basis: verified && haz.length ? 'hazard-checked' : 'distance-based' };
    var all = options(cfg), minLo = Math.min.apply(null, all.map(function (o) { return o.lo; }));
    if (inRing(a.me, a.hole.green) || D < minLo) return Object.assign(base, { mode: 'green', message: D < minLo ? 'Inside ' + minLo + ' yd — shorter than any distance in your table.' : 'On the green — putt.' });

    var route = a.hole.route(a.me); route[route.length - 1] = a.targetUV;
    function evalShot(o) {
      var land = along(route, o.mid * YD), rem = dist(land, a.targetUV) / YD, risks = [];
      haz.forEach(function (h) {
        var r = Math.round(h.reach), c = Math.round(h.carry), nm = hzName(h, posText);
        if (o.lo <= h.carry && o.hi >= h.reach) risks.push({ id: h.id, cls: h.cls, kind: 'in', text: 'In range of mapped ' + nm + ' ' + r + '–' + c });
        else if (h.cls === 'water' && o.lo > h.carry && o.lo - h.carry < R.water_carry_margin_yd) risks.push({ id: h.id, cls: h.cls, kind: 'fly', text: 'Must fly pond (far edge ' + c + '); carry unconfirmed' });
        else if (h.cls === 'water' && o.hi < h.reach && h.reach - o.hi < R.water_short_margin_yd) risks.push({ id: h.id, cls: h.cls, kind: 'short', text: 'Ends ≤' + Math.ceil(h.reach - o.hi) + ' yd short of pond' });
      });
      return Object.assign({}, o, { remaining: Math.round(rem), past: o.mid > D + 0.5, risks: risks, range: rangeTxt(o) });
    }
    var ev = all.filter(function (o) { return !o.teeOnly || onTee; }).map(evalShot);
    var maxHi = Math.max.apply(null, ev.map(function (e) { return e.hi; })), reach = D <= maxHi + R.reach_tolerance_yd;
    function closest(list, yd) { return list.slice().sort(function (x, y) { return Math.abs(x.mid - yd) - Math.abs(y.mid - yd) || (y.full - x.full) || (y.mid - x.mid); })[0]; }
    function longest(list) { return list.slice().sort(function (x, y) { return y.mid - x.mid || (y.full - x.full); })[0]; }
    function waterIn(e) { return e.risks.some(function (r) { return r.cls === 'water' && r.kind === 'in'; }); }
    var attack;
    if (reach) attack = closest(ev, D);
    else { var dry = ev.filter(function (e) { return !waterIn(e); }); attack = longest(dry.length ? dry : ev); }

    var prefs = cfg.preferences.more_reliable;
    function noNew(e) { return e.risks.every(function (r) { return attack.risks.some(function (x) { return x.id === r.id; }); }); }
    function find(club, swing) { return ev.filter(function (e) { return e.club === club && e.swing === swing; })[0]; }
    function preferSwap(pick, pool) {   // a stated "more reliable" alternative in the same pool replaces the pick
      var p = prefs.filter(function (q) { return q.instead_of === pick.club; })[0], alt = p && find(p.use, p.swing);
      return alt && pool.indexOf(alt) >= 0 ? { e: alt, note: p.note } : { e: pick, note: null };
    }
    var smart = null, why = '', kind = '', stratGo = false, st = a.strategy;
    // 0. the owner's rule for this hole (not off the tee on a par 4/5)
    if (st && !(onTee && a.par > 3)) {
      var cy = a.centreYd != null ? a.centreYd : D;
      if (!st.always_lay_up && st.go_for_green_within_yd != null && cy <= st.go_for_green_within_yd) stratGo = true;
      else {
        var front = haz.filter(function (h) { return h.reach < D && ((h.cls === 'water' && h.position === 'across') || /^green-front/.test(h.position || '')); })
                       .sort(function (x, y) { return x.reach - y.reach; })[0];
        if (front) {
          var ly = ev.filter(function (e) { return e !== attack && e.hi <= front.reach - R.layup_buffer_yd && !e.risks.length; });
          if (ly.length) { var s0 = preferSwap(longest(ly), ly); smart = s0.e; kind = 'strategy';
            why = st.note + ' · ends ' + Math.floor(front.reach - smart.hi) + '+ yd short of ' + (front.cls === 'water' ? 'pond' : 'front bunker'); }
        }
      }
    }
    // 1. stated reliability preference over the Attack club
    var pf = prefs.filter(function (q) { return q.instead_of === attack.club; })[0], sw = pf && find(pf.use, pf.swing);
    var teeNote = null;
    if (!smart && sw && sw !== attack && noNew(sw)) {
      smart = sw; why = pf.note; kind = pf.off_tee_favoured && onTee ? 'pref-tee' : 'pref';
      // Par 4/5 tee: Driver earns the star only if it is what brings the green into range for the next shot
      // (in range = within your longest fairway club, and inside your go-for-it distance if this hole has one).
      if (onTee && a.par > 3 && kind === 'pref-tee') {
        var fw = ev.filter(function (e) { return !e.teeOnly; }), goYd = Math.max.apply(null, fw.map(function (e) { return e.hi; })) + R.reach_tolerance_yd;
        if (st && st.go_for_green_within_yd != null) goYd = Math.min(goYd, st.go_for_green_within_yd);
        if (sw.remaining <= goYd) why = 'Leaves ~' + sw.remaining + ': green in range for shot 2 without driver · ' + pf.note;
        else if (attack.remaining <= goYd) { kind = 'pref'; teeNote = 'Only driver leaves the green in range for shot 2 (~' + attack.remaining + ')'; }
        else why = 'Driver doesn\'t bring the green in range for shot 2 either · ' + pf.note;
      }
    }
    // 2. Attack has a water risk: lay up short of the water's near edge
    var wr = attack.risks.filter(function (r) { return r.cls === 'water'; })[0];
    if (!smart && wr) {
      var W = haz.filter(function (h) { return h.id === wr.id; })[0];
      var lay = ev.filter(function (e) { return e !== attack && e.hi <= W.reach - R.layup_buffer_yd && !e.risks.length; });
      if (lay.length) { var s = preferSwap(longest(lay), lay); smart = s.e; kind = 'layup';
        why = 'Ends ' + Math.floor(W.reach - smart.hi) + '+ yd short of pond' + (s.note ? ' · ' + s.note : ''); }
    }
    // 3. Attack has a bunker risk on a reachable shot: nearest alternative with no mapped hazard in range
    if (!smart && reach && attack.risks.length) {
      var clean = ev.filter(function (e) { return e !== attack && !e.risks.length && D - e.mid <= R.alt_max_shorter_yd && e.mid <= D + R.reach_tolerance_yd; });
      if (clean.length) { smart = closest(clean, D); kind = 'avoid'; why = 'No mapped hazard in range'; }
    }
    // 4. Attack goes at today's pin: play to the centre of the green instead
    if (!smart && a.targetKind === 'flag' && a.centreYd != null) {
      var cc = closest(ev, a.centreYd);
      if (cc !== attack && noNew(cc)) { smart = cc; kind = 'centre'; why = 'Plays to green centre (' + a.centreYd + ')'; }
    }
    // 5. Green out of reach: leave a full-swing distance from your table
    if (!smart && !reach) {
      var fulls = ev.filter(function (e) { return e.full && e.lo === e.hi && e.lo <= R.full_leave_max_yd; });
      var leave = ev.filter(function (e) { return e !== attack && noNew(e) && fulls.some(function (f) { return Math.abs(f.lo - e.remaining) <= R.full_leave_tolerance_yd; }); });
      if (leave.length) { var s2 = preferSwap(longest(leave), leave); smart = s2.e; kind = 'leave';
        var fm = fulls.filter(function (f) { return Math.abs(f.lo - smart.remaining) <= R.full_leave_tolerance_yd; }).sort(function (x, y) { return Math.abs(x.lo - smart.remaining) - Math.abs(y.lo - smart.remaining); })[0];
        why = 'Leaves ~' + smart.remaining + ': full ' + fm.club + (s2.note ? ' · ' + s2.note : ''); }
    }
    var same = !smart;
    if (same) { smart = attack; kind = 'same'; why = 'Same as Attack: no better option in the data'; }
    var star = same || stratGo ? 'attack' : (kind === 'pref-tee' || kind === 'strategy' || (attack.risks.length && !smart.risks.length)) ? 'smart' : 'attack';
    function card(e, note) { return { club: e.club, swing: e.swing, swingText: e.swingText, range: e.range, lo: e.lo, hi: e.hi, remaining: e.remaining, past: e.past, risks: e.risks.map(function (r) { return r.text; }), note: note }; }
    return Object.assign(base, { mode: reach ? 'reach' : 'advance', same: same, kind: kind, star: star, strategy: st ? (stratGo ? 'go' : kind === 'strategy' ? 'lay up' : 'n/a') : null,
      attack: card(attack, teeNote || (stratGo ? 'Your rule: go for it from ' + st.go_for_green_within_yd + ' or closer' + (attack.risks.length ? ' · ' : '') : '') + (attack.risks.length ? attack.risks[0].text : stratGo ? '' : 'No mapped hazard in range')),
      smart: card(smart, why) });
  }
  var api = { recommend: recommend, options: options, SWING_TXT: SWING_TXT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PAdvisor = api;
})(this);
