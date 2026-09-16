/* EngiCalc Kern: Festigkeit. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";

  // Biegeträger, Lastfall "1" beidseitig/Einzellast mittig, "2" beidseitig/Streckenlast,
  // "3" Kragträger/Einzellast am Ende, "4" Kragträger/Streckenlast.
  // F [N] bzw. q [N/mm] bei Streckenlast, L [mm], E [N/mm²], I [cm⁴], W [cm³], sigmaZul [N/mm²]
  // → f Durchbiegung [mm], M [Nmm], sigma [N/mm²], auslastung [-] (NaN ohne sigmaZul)
  function biegung({ fall, F, L, E, I, W, sigmaZul }) {
    const Imm = I * 1e4, Wmm = W * 1e3;
    if (!(F > 0 && L > 0 && E > 0 && Imm > 0 && Wmm > 0)) return null;
    let f, M;
    switch (fall) {
      case "1": f = F * Math.pow(L, 3) / (48 * E * Imm); M = F * L / 4; break;
      case "2": f = 5 * F * Math.pow(L, 4) / (384 * E * Imm); M = F * L * L / 8; break;
      case "3": f = F * Math.pow(L, 3) / (3 * E * Imm); M = F * L; break;
      case "4": f = F * Math.pow(L, 4) / (8 * E * Imm); M = F * L * L / 2; break;
    }
    const sigma = M / Wmm;
    return { f, M, sigma, auslastung: sigmaZul > 0 ? sigma / sigmaZul : NaN };
  }

  // Zug, Biegung, Torsion und Vergleichsspannung nach GEH. F [N], A [mm²], Mb, Mt [Nm], W, Wp [cm³]
  // → sz, sb, tt, sv [N/mm²], auslastung [-]; fehlende Anteile zählen als 0
  function spannung({ F, A, Mb, W, Mt, Wp, sigmaZul }) {
    const MB = Mb * 1000, WW = W * 1e3, MT = Mt * 1000, WP = Wp * 1e3;
    const sz = (A > 0 && !isNaN(F)) ? F / A : 0;
    const sb = (WW > 0 && !isNaN(MB)) ? MB / WW : 0;
    const tt = (WP > 0 && !isNaN(MT)) ? MT / WP : 0;
    const sv = Math.sqrt(Math.pow(sz + sb, 2) + 3 * tt * tt);
    return { sz, sb, tt, sv, auslastung: sigmaZul > 0 ? sv / sigmaZul : NaN };
  }

  // Knickung nach Euler. beta Knicklängenbeiwert, L [mm], F [N], E [N/mm²], I [cm⁴], A [mm²]
  // → Lk [mm], Fk [N], lambda Schlankheit (nur mit A), sicherheit (nur mit F), eulerGueltig
  function knickung({ beta, L, F, E, I, A }) {
    const Imm = I * 1e4;
    if (!(L > 0 && E > 0 && Imm > 0)) return null;
    const Lk = beta * L;
    const r = { Lk, Fk: Math.PI * Math.PI * E * Imm / (Lk * Lk) };
    if (A > 0) {
      r.lambda = Lk / Math.sqrt(Imm / A);
      r.eulerGueltig = !(r.lambda < 105);
    }
    if (F > 0) r.sicherheit = r.Fk / F;
    return r;
  }

  // Querschnittswerte, alle Maße [mm]. form "rechteck" (a=b, b=h), "kreis" (a=d), "rohr" (a=D, b=d),
  // sonst Kastenprofil (a=B, b=H, c=b, d=h) → A [mm²], I [mm⁴], W [mm³]
  function querschnitt({ form, a, b, c, d }) {
    let A, I, W;
    if (form === "rechteck") {
      if (!(a > 0 && b > 0)) return null;
      A = a * b; I = a * Math.pow(b, 3) / 12; W = a * b * b / 6;
    } else if (form === "kreis") {
      if (!(a > 0)) return null;
      A = Math.PI / 4 * a * a; I = Math.PI * Math.pow(a, 4) / 64; W = Math.PI * Math.pow(a, 3) / 32;
    } else if (form === "rohr") {
      if (!(a > 0 && b >= 0 && b < a)) return null;
      A = Math.PI / 4 * (a * a - b * b);
      I = Math.PI * (Math.pow(a, 4) - Math.pow(b, 4)) / 64;
      W = I / (a / 2);
    } else {
      if (!(a > 0 && b > 0 && c >= 0 && d >= 0 && c < a && d < b)) return null;
      A = a * b - c * d;
      I = (a * Math.pow(b, 3) - c * Math.pow(d, 3)) / 12;
      W = I / (b / 2);
    }
    return { A, I, W };
  }

  const api = { biegung, spannung, knickung, querschnitt };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).festigkeit = api;
})(this);
