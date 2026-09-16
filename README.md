# engicalc-core

Die Formeln hinter [EngiCalc](https://engicalc.tkai.tech): 24 Auslegungsrechner für den
Maschinen- und Anlagenbau als schlanke JavaScript-Bibliothek. Ohne Abhängigkeiten, ohne
Build, läuft in Node und im Browser. Die Website rechnet mit genau diesem Code.

*Engineering formulas (fluid flow, heat transfer, strength, machine elements, pumps,
acoustics) behind engicalc.tkai.tech. Zero dependencies, Node and browser. API names are German.*

## Nutzung

```bash
npm install --allow-git=all github:tkai-tech/engicalc-core
```

Ab npm 12 sind Git-Quellen ohne `--allow-git` gesperrt. Alternativ die Moduldateien einfach kopieren.

```js
const { stroemung } = require("engicalc-core");

const r = stroemung.druckverlust({ q: 10, d: 50, l: 100, k: 0.05, rho: 998, nu: 1.0, zeta: 5 });
// { v: 1.415, Re: 70740, laminar: false, lambda: 0.0230, dpR: 45930, dpZ: 4994, dp: 50920 }  (gerundet, Drücke in Pa)
```

Im Browser `<script src="stroemung.js"></script>` einbinden, danach steht `EngiCalc.stroemung` bereit.

Jede Funktion nimmt ein Objekt mit Eingaben in den praxisüblichen Einheiten (mm, bar, m³/h …)
und gibt Zwischen- und Endwerte zurück. Die Einheiten stehen im Kommentar über jeder Funktion.
`null` heißt: Eingaben fehlen oder sind unzulässig.

| Modul | Funktionen |
|---|---|
| `stroemung` | `druckverlust` (Darcy-Weisbach, Colebrook), `reynolds`, `bernoulli`, `kv`, `ausfluss` |
| `waerme` | `rohrisolierung`, `uWert`, `waermetauscher` (LMTD), `strahlung`, `aufheizen` |
| `festigkeit` | `biegung` (4 Lastfälle), `spannung` (GEH), `knickung` (Euler), `querschnitt` |
| `maschinenelemente` | `schraube` (vereinfacht nach VDI 2230), `pressverbindung`, `passfeder`, `schweissnaht` |
| `pumpen` | `pumpe`, `foerderhoehe`, `npsh`, `dampfdruckWasser` (Antoine) |
| `akustik` | `pegeladdition`, `entfernung`, `schallleistung` |

## Tests

```bash
npm test
```

## Hinweis

Die Formeln sind für Vorauslegung und Plausibilitätsprüfung gedacht. Sie ersetzen weder
Normnachweis noch Fachplanung. Fehler gefunden? Issue oder Pull Request, gern mit Quelle.

MIT-Lizenz, © 2026 [tkai.tech](https://tkai.tech)
