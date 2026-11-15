/* Pocasset V3 — approved green view.
   Pin math copied unchanged from production V2.3.1 (itself identical to the approved hole pages):
   xy, inverse, cross-section and the front/side placement rule. Displays the approved image as-is
   (byte-identical protected copy), rotated at display time so the approach is at the bottom. */
(function (root) {
  'use strict';
  var pdeg = Math.PI / 180, PYD = 0.9144;
  function pxy(t, u, v) { var r = t.rotation_deg * pdeg, c = Math.cos(r), s = Math.sin(r); return [t.center_x_px + c * u * t.scale_x_px_per_m + s * v * t.scale_y_px_per_m, t.center_y_px + s * u * t.scale_x_px_per_m - c * v * t.scale_y_px_per_m]; }
  function pinv(t, x, y) { var r = t.rotation_deg * pdeg, c = Math.cos(r), s = Math.sin(r), dx = x - t.center_x_px, dy = y - t.center_y_px; return [(dx * c + dy * s) / t.scale_x_px_per_m, (dx * s - dy * c) / t.scale_y_px_per_m]; }
  function pcross(P, v) { var hits = []; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; if ((a[1] <= v && v < b[1]) || (b[1] <= v && v < a[1])) hits.push(a[0] + (v - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); } return hits.sort(function (a, b) { return a - b; }); }
  /* Returns {px: [x,y] on the green image (coord space W x H), uv: [u,v] hole-frame metres} or {err}. */
  function placePin(M, p) {
    var depth = +p.depth, front = +p.front, edge = +p.edge;
    if (!isFinite(depth) || !isFinite(front) || !isFinite(edge) || depth <= 0 || front < 0 || front > depth || edge < 0) return { err: 'Enter a valid depth, front distance (0 to depth) and side distance.' };
    var vs = M.points.map(function (q) { return q[1]; }), minV = Math.min.apply(null, vs), maxV = Math.max.apply(null, vs);
    var v = minV + (front / depth) * (maxV - minV), hits = pcross(M.points, v);
    if (hits.length < 2) return { err: 'No green cross-section at that depth.' };
    var left = hits[0], right = hits[hits.length - 1], u = p.side === 'L' ? left + edge * PYD : right - edge * PYD;
    if (u < left || u > right) return { err: 'That pin would be outside the mapped green.' };
    var px = pxy(M.t, u, v);
    return { px: px, uv: pinv(M.geoT, px[0], px[1]) };
  }
  /* Draw the approved green into `host` (a sized element). Only adds a flag on top; never alters the image. */
  function drawGreen(host, M, imgUrl, pin) {
    var W = M.coord_W, H = M.coord_H, r = M.t.rotation_deg, a = r * pdeg;
    var Wb = W * Math.abs(Math.cos(a)) + H * Math.abs(Math.sin(a)), Hb = W * Math.abs(Math.sin(a)) + H * Math.abs(Math.cos(a));
    var res = pin ? placePin(M, pin) : null, flag = '';
    if (res && res.px) {
      var k = W / 700;
      flag = '<g transform="translate(' + res.px[0].toFixed(2) + ' ' + res.px[1].toFixed(2) + ') scale(' + k.toFixed(3) + ')"><g transform="rotate(' + r.toFixed(3) + ')">' +
        '<circle r="23" fill="#fff" fill-opacity=".85"/><circle r="12" fill="#db5338" stroke="#fff" stroke-width="3"/>' +
        '<path d="M0 -12 V-60" stroke="#102e24" stroke-width="5" stroke-linecap="round"/><path d="M0 -60 L38 -48 L0 -35 Z" fill="#ec5939" stroke="#fff" stroke-width="1"/></g></g>';
    }
    host.innerHTML = '<div class="gstage" style="position:relative;margin:0 auto;line-height:0;aspect-ratio:' + Wb.toFixed(1) + '/' + Hb.toFixed(1) + ';width:min(100%,calc(62vh * ' + (Wb / Hb).toFixed(4) + '))">' +
      '<div style="position:absolute;transform-origin:50% 50%;left:' + ((Wb - W) / 2 / Wb * 100) + '%;top:' + ((Hb - H) / 2 / Hb * 100) + '%;width:' + (W / Wb * 100) + '%;height:' + (H / Hb * 100) + '%;transform:rotate(' + (-r).toFixed(3) + 'deg)">' +
      '<img src="' + imgUrl + '" alt="Approved Hole ' + M.hole + ' green" style="display:block;width:100%;height:100%">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">' + flag + '</svg></div></div>';
    return res;
  }
  var api = { placePin: placePin, drawGreen: drawGreen, pxy: pxy, pinv: pinv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PGreen = api;
})(this);
