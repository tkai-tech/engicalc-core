/* EngiCalc Kern: Pumpentechnik. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";
  const g = 9.81;

  // Pumpenleistung. q [m³/h], h Förderhöhe [m], rho [kg/m³], eta Pumpe, etaM Motor [-]
  // → Phyd, Pw (nur mit eta), Pel (nur mit eta und etaM) [W], dp [Pa]
  function pumpe({ q, h, rho, eta, etaM }) {
    const Q = q / 3600;
    if (!(Q > 0 && h > 0 && rho > 0)) return null;
    const Phyd = rho * g * Q * h;
    const r = { Phyd, dp: rho * g * h };
    if (eta > 0) {
      r.Pw = Phyd / eta;
      if (etaM > 0) r.Pel = r.Pw / etaM;
    }
    return r;
  }

  // Anlagenförderhöhe. z geodätisch [m], dpv Verluste, p2 Druck Ziel, p1 Druck Saugseite [bar], rho [kg/m³]
  // → hz, hp, hv, HA [m]
  function foerderhoehe({ z, dpv, p2, p1, rho }) {
    const DPV = dpv * 1e5, P2 = p2 * 1e5, P1 = p1 * 1e5;
    if ([z, DPV, P2, P1].some(isNaN) || !(rho > 0)) return null;
    const hp = (P2 - P1) / (rho * g);
    const hv = DPV / (rho * g);
    return { hz: z, hp, hv, HA: z + hp + hv };
  }

  // Dampfdruck von Wasser nach Antoine (1 bis 100 °C). t [°C] → [Pa]
  function dampfdruckWasser(t) {
    return Math.pow(10, 8.07131 - 1730.63 / (233.426 + t)) * 133.322;
  }

  // NPSH der Anlage. pe Druck am Saugspiegel [bar abs], t [°C], z Zulaufhöhe [m], hv Saugverluste [m],
  // rho [kg/m³], erf NPSH der Pumpe [m] → pd [Pa], vorhanden [m], reserve [m] (nur mit erf, 0,5 m Zuschlag)
  function npsh({ pe, t, z, hv, rho, erf }) {
    const PE = pe * 1e5;
    if ([PE, t, z, hv].some(isNaN) || !(rho > 0)) return null;
    const pd = dampfdruckWasser(t);
    const vorhanden = (PE - pd) / (rho * g) + z - hv;
    const r = { pd, vorhanden };
    if (!isNaN(erf)) r.reserve = vorhanden - (erf + 0.5);
    return r;
  }

  const api = { pumpe, foerderhoehe, dampfdruckWasser, npsh };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).pumpen = api;
})(this);
