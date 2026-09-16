/* EngiCalc Kern: Strömungstechnik. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";
  const g = 9.81;

  // Druckverlust in Rohren nach Darcy-Weisbach, λ laminar 64/Re, turbulent Colebrook (Start Swamee-Jain)
  // q [m³/h], d [mm], l [m], k [mm], rho [kg/m³], nu [mm²/s], zeta [-] → v [m/s], dpR/dpZ/dp [Pa]
  function druckverlust({ q, d, l, k, rho, nu, zeta }) {
    const Q = q / 3600, D = d / 1000, K = k / 1000, NU = nu * 1e-6;
    if (!(Q > 0 && D > 0 && l >= 0 && rho > 0 && NU > 0)) return null;
    const A = Math.PI / 4 * D * D;
    const v = Q / A;
    const Re = v * D / NU;
    let lambda;
    if (Re < 2320) {
      lambda = 64 / Re;
    } else {
      lambda = 0.25 / Math.pow(Math.log10(K / (3.7 * D) + 5.74 / Math.pow(Re, 0.9)), 2);
      for (let i = 0; i < 30; i++) {
        lambda = 1 / Math.pow(-2 * Math.log10(K / (3.7 * D) + 2.51 / (Re * Math.sqrt(lambda))), 2);
      }
    }
    const dpR = lambda * l / D * rho / 2 * v * v;
    const dpZ = zeta * rho / 2 * v * v;
    return { v, Re, laminar: Re < 2320, lambda, dpR, dpZ, dp: dpR + dpZ };
  }

  // v [m/s], d [mm], nu [mm²/s] → Re, bereich "laminar" | "uebergang" | "turbulent"
  function reynolds({ v, d, nu }) {
    const D = d / 1000, NU = nu * 1e-6;
    if (!(v > 0 && D > 0 && NU > 0)) return null;
    const Re = v * D / NU;
    return { Re, bereich: Re < 2320 ? "laminar" : Re < 4000 ? "uebergang" : "turbulent" };
  }

  // Bernoulli mit Verlust. p1 [bar abs], h [m], v [m/s], rho [kg/m³], dpv [bar] → dyn, geo, p2 [Pa]
  function bernoulli({ p1, h1, v1, h2, v2, rho, dpv }) {
    const P1 = p1 * 1e5, DPV = dpv * 1e5;
    if ([P1, h1, v1, h2, v2, rho, DPV].some(x => isNaN(x))) return null;
    const dyn = rho / 2 * (v1 * v1 - v2 * v2);
    const geo = rho * g * (h1 - h2);
    return { dyn, geo, p2: P1 + dyn + geo - DPV };
  }

  // Kv-Wert eines Ventils. q [m³/h], dp [bar], rho [kg/m³] → kv, kvs = 1,2·kv [m³/h]
  function kv({ q, dp, rho }) {
    if (!(q > 0 && dp > 0 && rho > 0)) return null;
    const kv = q * Math.sqrt((rho / 1000) / dp);
    return { kv, kvs: kv * 1.2 };
  }

  // Ausfluss nach Torricelli. h [m], d [mm], mu Ausflusszahl → v [m/s], Q [m³/s]
  function ausfluss({ h, d, mu }) {
    const D = d / 1000;
    if (!(h > 0 && D > 0 && mu > 0)) return null;
    const v = Math.sqrt(2 * g * h);
    const A = Math.PI / 4 * D * D;
    return { v, Q: mu * A * v };
  }

  const api = { druckverlust, reynolds, bernoulli, kv, ausfluss };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).stroemung = api;
})(this);
