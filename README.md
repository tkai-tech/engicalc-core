# engicalc-core

[![npm](https://img.shields.io/npm/v/engicalc-core)](https://www.npmjs.com/package/engicalc-core)
[![Lizenz MIT](https://img.shields.io/npm/l/engicalc-core)](LICENSE)

Die Formeln hinter [EngiCalc](https://engicalc.tkai.tech): 24 Auslegungsrechner für den
Maschinen- und Anlagenbau als schlanke JavaScript-Bibliothek. Druckverlust, Wärmeübergang,
Festigkeitsnachweis, Schraubenvorspannung, NPSH, Schallpegel. Ohne Abhängigkeiten, ohne
Build, läuft in Node und im Browser. Die Website rechnet mit genau diesem Code.

*Engineering formulas for mechanical and plant engineering: pipe pressure drop
(Darcy-Weisbach, Colebrook), heat transfer, strength and buckling, bolted joints, pumps and
NPSH, acoustics. Zero dependencies, Node and browser, unit tested. API names are German.*

## Nutzung

```bash
npm install engicalc-core
```

```js
const { stroemung } = require("engicalc-core");

const r = stroemung.druckverlust({ q: 10, d: 50, l: 100, k: 0.05, rho: 998, nu: 1.0, zeta: 5 });
// { v: 1.415, Re: 70740, laminar: false, lambda: 0.0230, dpR: 45930, dpZ: 4994, dp: 50920 }  (gerundet, Drücke in Pa)
```

Im Browser `<script src="stroemung.js"></script>` einbinden, danach steht `EngiCalc.stroemung` bereit.

Jede Funktion nimmt ein Objekt mit Eingaben in den praxisüblichen Einheiten (mm, bar, m³/h …)
und gibt Zwischen- und Endwerte zurück. Die Einheiten stehen im Kommentar über jeder Funktion.
`null` heißt: Eingaben fehlen oder sind unzulässig.

## Die sechs Module

**`stroemung`** Druckverlust (Darcy-Weisbach, λ nach Colebrook), Reynolds, Bernoulli, Kv-Wert, Ausfluss

**`waerme`** Rohrisolierung, U-Wert, Wärmetauscher (LMTD), Strahlung, Aufheizen

```js
waerme.waermetauscher({ typ: "gegen", th1: 90, th2: 60, tk1: 20, tk2: 50, m: 3600, cp: 4.19, U: 1000 });
// { Q: 125700, lmtd: 40, A: 3.143, gueltig: true }   Q in W, A in m²
```

**`festigkeit`** Biegung (4 Lastfälle), Vergleichsspannung (GEH), Knickung (Euler), Querschnittswerte

```js
festigkeit.biegung({ fall: "1", F: 5000, L: 2000, E: 210000, I: 1943, W: 194, sigmaZul: 156 });
// { f: 0.2042, M: 2500000, sigma: 12.89, auslastung: 0.0826 }   IPE 200, f in mm, M in Nmm
```

**`maschinenelemente`** Schraube (vereinfacht nach VDI 2230), Pressverbindung, Passfeder, Schweißnaht

```js
maschinenelemente.schraube({ gewinde: "M12", rp: 640, nu: 0.9, mu: 0.12 });
// { As: 84.3, Fv: 39980, Ma: 80990, Fq: 5997 }   M12 8.8: Fv in N, Ma in Nmm (81 Nm)
```

**`pumpen`** Pumpenleistung, Anlagenförderhöhe, NPSH, Dampfdruck von Wasser (Antoine)

```js
pumpen.npsh({ pe: 1, t: 60, z: 2, hv: 1.5, rho: 983, erf: 2.5 });
// { pd: 19870, vorhanden: 8.809, reserve: 5.809 }   pd in Pa, Höhen in m
```

**`akustik`** Pegeladdition, Pegelabnahme mit der Entfernung, Schalldruck aus Schallleistung

```js
akustik.pegeladdition([85, 82, 78]);
// { L: 87.31, zuwachs: 2.306 }   dB, zuwachs über dem lautesten Einzelpegel
```

## Tests

```bash
npm test
```

Prüft die Formeln gegen von Hand nachgerechnete Referenzwerte, etwa λ nach Colebrook gegen
das Moody-Diagramm, den Dampfdruck bei 100 °C gegen den Normdruck und die Euler-Knicklast.

## Hinweis

Die Formeln sind für Vorauslegung und Plausibilitätsprüfung gedacht. Sie ersetzen weder
Normnachweis noch Fachplanung. Fehler gefunden? Issue oder Pull Request, gern mit Quelle.

MIT-Lizenz, © 2026 [tkai.tech](https://tkai.tech)
