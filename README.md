# Stringnifyer

Calculate equal-tension string gauges when retuning a plucked instrument
(guitar, ukulele, banjo, mandolin, cigar box guitar, and similar) to a
different note.

Pick an instrument, set its scale length, choose a target tuning, and get two
tables:

- **Detail** — the string gauge that matches each string's stock tension at the
  new tuning, plus how the stock strings would feel (tension factor) if you kept
  them at the target tuning.
- **Compare** — every instrument in the list, shown with the gauge needed to
  reach the same target tuning at its own scale length.

## The model

For a string held at constant tension, the required diameter is inversely
proportional to its frequency and to the scale length:

```
gauge ∝ 1 / (scale length × frequency)
```

Target gauges are derived from each instrument's typical stock string set, so
treat the results as starting points and round to the nearest real string size.

## Usage

### Web UI

Open `index.html` in a browser. No build step or server required.

```
open index.html   # macOS
```

### Node module

The core math is a plain CommonJS module:

```js
const { StringGaugeCalculator } = require('./index');

const calc = new StringGaugeCalculator();
calc.noteToFrequency('E2');                 // -> 82.41 Hz
calc.calculateTargetGauge('E2', 0.042, 'A2'); // -> gauge for A2 at equal tension
```

`calculateTargetGauge(currentNote, currentGauge, targetNote)` returns the gauge
(in the same units as `currentGauge`, inches) that keeps tension constant when
moving from `currentNote` to `targetNote`.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Single-page UI markup and styling. |
| `app.js` | Browser logic: instrument data (including stock gauges), note math, table rendering. |
| `index.js` | Re-exports `StringGaugeCalculator` for Node consumers. |
| `lib/StringGaugeCalculator.js` | Core, dependency-free calculation module. |
| `instrument-scale-lengths.json` | Instrument data (scale lengths and stock tuning, grouped by category). |

## Data format

`instrument-scale-lengths.json` groups instruments by category. Each entry has:

- `name` — display name
- `standard_scale_length_inches` / `standard_scale_length_mm` — typical scale
  length range (`min`, `max`, and a human-readable `text`)
- `tuning` — stock notes as a dash-separated string (e.g. `"E2-A2-D3-G3-B3-E4"`)

Notes accept sharps or flats (`F#4` / `Gb4`) and an octave number, with
`A4 = 440 Hz`.

## License

MIT
