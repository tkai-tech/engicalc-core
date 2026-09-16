/* EngiCalc Kern: Akustik. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";

  // Energetische Pegeladdition. pegel [dB], NaN-Einträge werden übersprungen → L [dB], zuwachs über dem lautesten [dB]
  function pegeladdition(pegel) {
    let sum = 0, max = -Infinity, n = 0;
    for (const L of pegel) {
      if (!isNaN(L)) { sum += Math.pow(10, L / 10); max = Math.max(max, L); n++; }
    }
    if (n === 0) return null;
    const L = 10 * Math.log10(sum);
    return { L, zuwachs: L - max };
  }

  // Pegelabnahme mit der Entfernung. faktor 20 Punktquelle, 10 Linienquelle; L1 [dB], r1, r2 [m] → dL, L2 [dB]
  function entfernung({ faktor, L1, r1, r2 }) {
    if (isNaN(L1) || !(r1 > 0 && r2 > 0)) return null;
    const dL = faktor * Math.log10(r2 / r1);
    return { dL, L2: L1 - dL };
  }

  // Schalldruckpegel aus Schallleistungspegel. Lw [dB], r [m], Q Richtfaktor [-] → Ls Abstandsmaß, Lp [dB]
  function schallleistung({ Lw, r, Q }) {
    if (isNaN(Lw) || !(r > 0)) return null;
    const Ls = 10 * Math.log10(4 * Math.PI * r * r / Q);
    return { Ls, Lp: Lw - Ls };
  }

  const api = { pegeladdition, entfernung, schallleistung };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).akustik = api;
})(this);
