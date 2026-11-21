/* Pocasset V3 — AI Caddie Shot Advisor settings. EDIT THIS FILE to change clubs, distances or preferences.
   Distances are the owner's estimated playing distances (yards). Carry vs total is NOT confirmed yet, so the advisor
   never claims a shot carries a hazard. A single number = one distance; [low, high] = a range; null = unknown (never invented).
   Swings: quarter, half, three_quarter, full. */
window.ADVISOR_CONFIG = {
  version: 1,
  holes: [2],                       // Shot Advisor is shown on these holes only (Hole 2 test; others wait for approval)
  distances_confirmed_as: 'estimated playing distance (carry vs total not confirmed)',

  clubs: [
    { name: 'Driver',    full: [220, 230], tee_only: true },   // tee_only: assumption, not the owner's rule — set false to allow Driver off the fairway
    { name: '5-Hybrid',  full: [190, 200] },
    { name: '7-Hybrid',  full: [160, 170] },
    { name: '6-Iron',    full: 150 },
    { name: '7-Iron',    full: 140 },
    { name: '8-Iron',    full: 130 },
    { name: '9-Iron',    full: 120 },
    { name: '48° Wedge', quarter: [15, 25], half: [40, 50], three_quarter: [65, 75], full: 100 },
    { name: '52° Wedge', quarter: [10, 20], half: [30, 40], three_quarter: [50, 65], full: 90 },
    { name: '56° Wedge', quarter: [5, 10],  half: [15, 20], three_quarter: 35,       full: null }
  ],

  /* The owner's stated preferences. No dispersion numbers or reliability percentages are stored (none were given). */
  preferences: {
    more_reliable: [
      { instead_of: 'Driver', use: '5-Hybrid', swing: 'full', off_tee_favoured: true,
        note: 'Your note: more reliable than driver' },
      { instead_of: '6-Iron', use: '8-Iron', swing: 'full', off_tee_favoured: false,
        note: 'Your note: less dispersion than 6-iron' }
    ],
    balance: 'sensible balance between distance and safety',
    auto_driver_on_par4: false,     // never star Driver just because it is a par 4
    auto_closest_club: false        // Play Smart is never simply the club closest to the pin
  },

  /* The owner's per-hole strategy (20 Nov 2026). Applies to approach / second shots (and the tee on par 3s).
     go_for_green_within_yd: go for the green from this far (to the green CENTRE) or closer; farther back, lay up short
     of the trouble in front of the green (water crossing the line, or front bunkers). always_lay_up: always lay up. */
  hole_strategy: {
    2: { go_for_green_within_yd: 130, note: 'Your rule: lay up beyond 130' },
    6: { always_lay_up: true, note: 'Your rule: always lay up on Hole 6' }   // recorded only: Hole 6 not enabled yet
  },

  /* Advisor rules (Claude's working thresholds, not owner data — adjust freely). */
  rules: {
    reach_tolerance_yd: 5,          // a club "reaches" if its high end is within this of the target
    tee_radius_yd: 15,              // within this of a mapped tee box counts as "on the tee"
    corridor_yd: 40,                // hazards considered: ahead, within ±40 yd of the line (same rule as the hazard table)
    hazard_lookahead_yd: 30,        // ignore hazards more than this beyond the target
    water_short_margin_yd: 10,      // a range ending closer than this short of water is flagged
    water_carry_margin_yd: 15,      // a range starting closer than this past water's far edge is flagged (carry unconfirmed)
    layup_buffer_yd: 10,            // a layup must end at least this short of the water's near edge
    full_leave_max_yd: 120,         // "leaves a full swing" only for full distances up to this
    full_leave_tolerance_yd: 5,
    alt_max_shorter_yd: 25          // a hazard-avoiding alternative may be at most this much shorter than the target
  }
};
