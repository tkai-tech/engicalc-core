// Referenzwerte von Hand bzw. aus Lehrbuchgrößen nachgerechnet. Aufruf: node --test
const test = require("node:test");
const assert = require("node:assert");
const { stroemung, waerme, festigkeit, maschinenelemente, pumpen, akustik } = require("./index.js");

const nah = (ist, soll, tol = 1e-6) =>
  assert.ok(Math.abs(ist - soll) <= tol * Math.max(1, Math.abs(soll)), `${ist} ≠ ${soll}`);

test("Strömung", () => {
  const re = stroemung.reynolds({ v: 1, d: 100, nu: 1 });
  nah(re.Re, 1e5);
  assert.equal(re.bereich, "turbulent");
  assert.equal(stroemung.reynolds({ v: 0.02, d: 100, nu: 1 }).bereich, "laminar");

  // laminar: λ = 64/Re, 1 m³/h in DN 100 bei ν = 100 mm²/s
  const dl = stroemung.druckverlust({ q: 1, d: 100, l: 10, k: 0.05, rho: 900, nu: 100, zeta: 0 });
  assert.ok(dl.laminar);
  nah(dl.lambda, 64 / dl.Re);
  // turbulent, hydraulisch glatt bei Re = 1e5: λ ≈ 0,0180 (Moody)
  const dt = stroemung.druckverlust({ q: Math.PI / 4 * 0.01 * 3600, d: 100, l: 1, k: 0, rho: 1000, nu: 1, zeta: 0 });
  nah(dt.Re, 1e5);
  nah(dt.lambda, 0.0180, 0.01);

  const kv = stroemung.kv({ q: 10, dp: 1, rho: 1000 });
  nah(kv.kv, 10);
  nah(kv.kvs, 12);
  nah(stroemung.ausfluss({ h: 5, d: 10, mu: 1 }).v, Math.sqrt(98.1));
  nah(stroemung.bernoulli({ p1: 1, h1: 10, v1: 0, h2: 0, v2: 0, rho: 1000, dpv: 0 }).p2, 1e5 + 98100);
  assert.equal(stroemung.druckverlust({ q: 0, d: 100, l: 1, k: 0, rho: 1000, nu: 1, zeta: 0 }), null);
});

test("Wärme", () => {
  // 1/7,7 + 1/25 + 0,24/0,8
  nah(waerme.uWert({ alphaI: 7.7, alphaA: 25, s1: 240, lambda1: 0.8, a: 10, dt: 30 }).U, 1 / (1 / 7.7 + 0.04 + 0.3));
  const wt = waerme.waermetauscher({ typ: "gegen", th1: 90, th2: 60, tk1: 20, tk2: 50, m: 3600, cp: 4.19, U: 1000 });
  nah(wt.Q, 125700);
  nah(wt.lmtd, 40);                                      // gleiche Grädigkeit → LMTD = ΔT
  assert.equal(waerme.waermetauscher({ typ: "gleich", th1: 60, th2: 40, tk1: 50, tk2: 70, m: 1, cp: 1, U: 1 }).gueltig, false);
  nah(waerme.strahlung({ t1: 100, t2: 0, eps: 1, a: 1 }).qs, 783.7, 1e-3);
  nah(waerme.aufheizen({ m: 1000, c: 4.19, t1: 10, t2: 60, t: 1, eta: 1 }).P, 1000 * 4.19 * 50 / 3600);
  const iso = waerme.rohrisolierung({ d1: 50, s: 0, ti: 80, ta: 20, lambda: 0.04, alpha: 10, l: 1 });
  nah(iso.qm, iso.Q0);                                   // ohne Dämmung gleich dem blanken Rohr
});

test("Festigkeit", () => {
  const b = festigkeit.biegung({ fall: "1", F: 1000, L: 1000, E: 210000, I: 1, W: 1, sigmaZul: 250 });
  nah(b.f, 1e12 / (48 * 210000 * 1e4));
  nah(b.M, 250000);
  nah(b.sigma, 250);
  nah(b.auslastung, 1);
  nah(festigkeit.knickung({ beta: 1, L: 1000, F: 1, E: 210000, I: 1, A: 1 }).Fk, Math.PI ** 2 * 210000 * 1e4 / 1e6);
  nah(festigkeit.spannung({ F: 0, A: 0, Mb: 0, W: 0, Mt: 200, Wp: 20, sigmaZul: 0 }).sv, Math.sqrt(300));
  const r = festigkeit.querschnitt({ form: "rechteck", a: 10, b: 20 });
  nah(r.I, 10 * 8000 / 12);
  nah(r.W, 10 * 400 / 6);
  const kreis = festigkeit.querschnitt({ form: "kreis", a: 20 });
  const rohr = festigkeit.querschnitt({ form: "rohr", a: 20, b: 0 });
  nah(rohr.I, kreis.I);
  nah(rohr.W, kreis.W);
  assert.equal(festigkeit.querschnitt({ form: "rohr", a: 20, b: 20 }), null);
});

test("Maschinenelemente", () => {
  // Vorspannkraft so gewählt, dass die Vergleichsspannung genau nu · Rp beträgt
  const r = maschinenelemente.schraube({ gewinde: "M10", rp: 640, nu: 0.9, mu: 0.12 });
  const [As, P, d2] = maschinenelemente.GEWINDE.M10;
  const Wp = Math.PI * Math.pow(Math.sqrt(As * 4 / Math.PI), 3) / 16;
  const tau = r.Fv * (d2 / 2) * (P / (Math.PI * d2) + 0.12 / Math.cos(Math.PI / 6)) / Wp;
  nah(Math.sqrt((r.Fv / As) ** 2 + 3 * tau ** 2), 0.9 * 640);
  nah(maschinenelemente.passfeder({ d: 40, Mt: 200, h: 8, l: 50, n: 1, pZul: 100 }).Fu, 10000);
  assert.equal(maschinenelemente.pressverbindung({ d: 50, l: 40, p: 50, mu: 0.1, S: 2, Mt: 1e6 }).ausreichend, false);
  nah(maschinenelemente.schweissnaht({ F: 10, faktor: 1, a: 5, l: 100, sigmaZul: 20 }).s, 20);
  assert.equal(maschinenelemente.schraube({ gewinde: "M99", rp: 640, nu: 0.9, mu: 0.12 }), null);
});

test("Pumpen", () => {
  nah(pumpen.pumpe({ q: 36, h: 10, rho: 1000, eta: 0.5, etaM: 0.9 }).Phyd, 981);
  nah(pumpen.dampfdruckWasser(100), 101325, 1e-3);         // Siedepunkt bei Normdruck
  nah(pumpen.dampfdruckWasser(20), 2339, 5e-3);
  nah(pumpen.foerderhoehe({ z: 5, dpv: 0, p2: 1.981, p1: 1, rho: 1000 }).HA, 15);
  const n = pumpen.npsh({ pe: 1.01325, t: 100, z: 3, hv: 1, rho: 958, erf: 1.5 });
  nah(n.vorhanden, 2, 1e-3);                                // Siedewasser: nur die Zulaufhöhe zählt
  assert.ok(Math.abs(n.reserve) < 0.01);                    // Antoine liegt bei 100 °C 11 Pa über Normdruck
});

test("Akustik", () => {
  nah(akustik.pegeladdition([80, 80, NaN]).L, 80 + 10 * Math.log10(2));
  nah(akustik.pegeladdition([70]).zuwachs, 0);
  assert.equal(akustik.pegeladdition([NaN]), null);
  nah(akustik.entfernung({ faktor: 20, L1: 90, r1: 1, r2: 2 }).dL, 20 * Math.log10(2));
  nah(akustik.schallleistung({ Lw: 100, r: 1, Q: 1 }).Ls, 10 * Math.log10(4 * Math.PI));
});
