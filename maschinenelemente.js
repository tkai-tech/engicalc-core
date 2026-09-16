/* EngiCalc Kern: Maschinenelemente. Rückgabe null = Eingaben unvollständig oder unzulässig. */
(function (root) {
  "use strict";

  // Regelgewinde: [Spannungsquerschnitt As mm², Steigung P mm, Flankendurchmesser d2 mm, Kopfauflage Dkm mm]
  const GEWINDE = {
    M6:  [20.1, 1.0, 5.35, 9],
    M8:  [36.6, 1.25, 7.19, 11.5],
    M10: [58.0, 1.5, 9.03, 14.5],
    M12: [84.3, 1.75, 10.86, 16.5],
    M16: [157, 2.0, 14.70, 22],
    M20: [245, 2.5, 18.38, 27.7],
    M24: [353, 3.0, 22.05, 33.2]
  };

  // Schraube, vereinfacht nach VDI 2230: Montagevorspannkraft, bei der σ_red = nu · Rp0,2 (Zug + Torsion).
  // gewinde "M6".."M24", rp [N/mm²], nu Ausnutzung [-], mu Reibzahl [-]
  // → As [mm²], Fv [N], Ma Anziehmoment [Nmm], Fq übertragbare Querkraft je Fuge bei μ = 0,15 [N]
  function schraube({ gewinde, rp, nu, mu }) {
    const g = GEWINDE[gewinde];
    if (!g || !(nu > 0 && mu > 0)) return null;
    const [As, P, d2, Dkm] = g;
    const tanPhi = P / (Math.PI * d2);
    const tanRho = mu / Math.cos(Math.PI / 6);
    const d0 = Math.sqrt(As * 4 / Math.PI);
    const Wp = Math.PI * Math.pow(d0, 3) / 16;
    const kTau = (d2 / 2) * (tanPhi + tanRho) / Wp;
    const kSig = 1 / As;
    const Fv = nu * rp / Math.sqrt(kSig * kSig + 3 * kTau * kTau);
    const Ma = Fv * (0.16 * P + mu * (0.58 * d2 + Dkm / 2));
    return { As, Fv, Ma, Fq: Fv * 0.15 };
  }

  // Pressverbindung. d, l [mm], p Fugendruck [N/mm²], mu [-], S Sicherheit [-], Mt [Nm]
  // → Af [mm²], Mmax [Nmm], Fax [N], Mzul [Nmm] (nur mit S), ausreichend (nur mit S und Mt)
  function pressverbindung({ d, l, p, mu, S, Mt }) {
    if (!(d > 0 && l > 0 && p > 0 && mu > 0)) return null;
    const Mmax = p * mu * Math.PI * d * d * l / 2;
    const r = { Af: Math.PI * d * l, Mmax, Fax: p * mu * Math.PI * d * l };
    if (S > 0) {
      r.Mzul = Mmax / S;
      if (Mt > 0) r.ausreichend = Mt * 1000 <= r.Mzul;
    }
    return r;
  }

  // Passfeder, Flächenpressung an der Nabe (tragende Höhe 0,45·h, ab 2 Federn Traganteil 0,75).
  // d [mm], Mt [Nm], h, l [mm], n Anzahl, pZul [N/mm²] → Fu [N], p [N/mm²], auslastung, lErf [mm] (nur mit pZul)
  function passfeder({ d, Mt, h, l, n, pZul }) {
    const MT = Mt * 1000;
    if (!(d > 0 && MT > 0 && h > 0 && l > 0 && n > 0)) return null;
    const Fu = 2 * MT / d;
    const hTr = 0.45 * h;
    const phi = n >= 2 ? 0.75 : 1;
    const p = Fu / (hTr * l * n * phi);
    const r = { Fu, p, auslastung: pZul > 0 ? p / pZul : NaN };
    if (pZul > 0) r.lErf = Fu / (hTr * pZul * n * phi);
    return r;
  }

  // Schweißnaht. F [kN], faktor 1 Zug, 0,65 Schub, a, l [mm], sigmaZul [N/mm²]
  // → Aw [mm²], s bewertete Spannung [N/mm²], auslastung, lErf [mm] (nur mit sigmaZul)
  function schweissnaht({ F, faktor, a, l, sigmaZul }) {
    const FN = F * 1000;
    if (!(FN > 0 && a > 0 && l > 0)) return null;
    const Aw = a * l;
    const s = FN / Aw / faktor;
    const r = { Aw, s, auslastung: sigmaZul > 0 ? s / sigmaZul : NaN };
    if (sigmaZul > 0) r.lErf = FN / (a * sigmaZul * faktor);
    return r;
  }

  const api = { GEWINDE, schraube, pressverbindung, passfeder, schweissnaht };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.EngiCalc = root.EngiCalc || {}).maschinenelemente = api;
})(this);
