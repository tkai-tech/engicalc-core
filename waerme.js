/* EngiCalc Kern: Wärmetechnik. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";

  // Wärmeverlust eines isolierten Rohres. d1, s [mm], ti, ta [°C], lambda [W/mK], alpha außen [W/m²K], l [m]
  // → qm [W/m], Q [W], ts Oberfläche [°C], Q0 ohne Isolierung [W]
  function rohrisolierung({ d1, s, ti, ta, lambda, alpha, l }) {
    const D1 = d1 / 1000, S = s / 1000;
    if (!(D1 > 0 && S >= 0 && lambda > 0 && alpha > 0 && l > 0) || isNaN(ti) || isNaN(ta)) return null;
    const d2 = D1 + 2 * S;
    const dT = ti - ta;
    const qm = S > 0
      ? Math.PI * dT / (Math.log(d2 / D1) / (2 * lambda) + 1 / (alpha * d2))
      : alpha * Math.PI * D1 * dT;
    const ts = ta + qm / (alpha * Math.PI * d2);
    const q0 = alpha * Math.PI * D1 * dT;
    return { qm, Q: qm * l, ts, Q0: q0 * l };
  }

  // U-Wert einer ebenen Wand mit bis zu drei Schichten. alpha [W/m²K], s [mm], lambda [W/mK], a [m²], dt [K]
  // → R [m²K/W], U [W/m²K], Q [W] (nur mit a und dt)
  function uWert({ alphaI, alphaA, s1, lambda1, s2, lambda2, s3, lambda3, a, dt }) {
    const S1 = s1 / 1000, S2 = s2 / 1000, S3 = s3 / 1000;
    if (!(alphaI > 0 && alphaA > 0 && lambda1 > 0)) return null;
    let R = 1 / alphaI + 1 / alphaA + S1 / lambda1;
    if (S2 > 0 && lambda2 > 0) R += S2 / lambda2;
    if (S3 > 0 && lambda3 > 0) R += S3 / lambda3;
    const U = 1 / R;
    const r = { R, U };
    if (a > 0 && !isNaN(dt)) r.Q = U * a * dt;
    return r;
  }

  // Wärmetauscher über LMTD. typ "gegen" | "gleich", t [°C], m warme Seite [kg/h], cp [kJ/kgK], U [W/m²K]
  // → Q [W], lmtd [K], A [m²]; bei unzulässigen Temperaturen nur Q und gueltig: false
  function waermetauscher({ typ, th1, th2, tk1, tk2, m, cp, U }) {
    const M = m / 3600, CP = cp * 1000;
    if ([th1, th2, tk1, tk2].some(isNaN) || !(M > 0 && CP > 0 && U > 0)) return null;
    const Q = M * CP * (th1 - th2);
    const dT1 = typ === "gegen" ? th1 - tk2 : th1 - tk1;
    const dT2 = typ === "gegen" ? th2 - tk1 : th2 - tk2;
    if (dT1 <= 0 || dT2 <= 0) return { Q, gueltig: false };
    const lmtd = Math.abs(dT1 - dT2) < 1e-9 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);
    return { Q, lmtd, A: Q / (U * lmtd), gueltig: true };
  }

  // Wärmestrahlung nach Stefan-Boltzmann. t [°C], eps [-], a [m²] → qs [W/m²], Q [W]
  function strahlung({ t1, t2, eps, a }) {
    const T1 = t1 + 273.15, T2 = t2 + 273.15;
    if (!(T1 > 0 && T2 > 0 && eps > 0 && a > 0)) return null;
    const qs = eps * 5.67e-8 * (Math.pow(T1, 4) - Math.pow(T2, 4));
    return { qs, Q: qs * a };
  }

  // Aufheizen. m [kg], c [kJ/kgK], t1, t2 [°C], t Zeit [h], eta [-] → Q [kJ], kWh, P [kW] (nur mit t und eta)
  function aufheizen({ m, c, t1, t2, t, eta }) {
    if (!(m > 0 && c > 0) || isNaN(t1) || isNaN(t2)) return null;
    const Q = m * c * (t2 - t1);
    const r = { Q, kWh: Q / 3600 };
    if (t > 0 && eta > 0) r.P = Q / 3600 / (t * eta);
    return r;
  }

  const api = { rohrisolierung, uWert, waermetauscher, strahlung, aufheizen };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).waerme = api;
})(this);
