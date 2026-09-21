'use strict';

// Instrument data. Scale lengths in inches; gauges in inches,
// matching typical stock strings in the standard tuning.
const INSTRUMENTS = [
  { id: 'soprano',     category: 'Ukuleles', name: 'Soprano Ukulele',        scaleMin: 13.0,  scaleMax: 14.0, tuning: ['G4', 'C4', 'E4', 'A4'], gauges: [0.015, 0.018, 0.023, 0.026] },
  { id: 'concert',     category: 'Ukuleles', name: 'Concert Ukulele',        scaleMin: 15.0,  scaleMax: 16.0, tuning: ['G4', 'C4', 'E4', 'A4'], gauges: [0.017, 0.021, 0.026, 0.029] },
  { id: 'tenorUke',    category: 'Ukuleles', name: 'Tenor Ukulele',          scaleMin: 17.0,  scaleMax: 18.0, tuning: ['G4', 'C4', 'E4', 'A4'], gauges: [0.019, 0.023, 0.027, 0.032] },
  { id: 'baritone',    category: 'Ukuleles', name: 'Baritone Ukulele',       scaleMin: 19.0,  scaleMax: 21.0, tuning: ['D3', 'G3', 'B3', 'E3'], gauges: [0.017, 0.021, 0.026, 0.032] },
  { id: 'parlor',      category: 'Guitars', name: 'Parlor / Short-Scale Acoustic', scaleMin: 24.0, scaleMax: 24.75, tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], gauges: [0.010, 0.016, 0.024, 0.032, 0.042, 0.052] },
  { id: 'classical',   category: 'Guitars', name: 'Classical / Spanish',     scaleMin: 25.6,  scaleMax: 25.6, tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], gauges: [0.013, 0.018, 0.026, 0.030, 0.036, 0.044] },
  { id: 'steelAcoustic', category: 'Guitars', name: 'Steel-String Acoustic (Dreadnought / OM)', scaleMin: 25.4, scaleMax: 25.5, tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], gauges: [0.010, 0.017, 0.026, 0.035, 0.045, 0.055] },
  { id: 'tenorGuitar', category: 'Tenor & Cigar Box Variants', name: 'Tenor Guitar', scaleMin: 21.0, scaleMax: 23.0, tuning: ['C3', 'G3', 'D4', 'A4'], gauges: [0.013, 0.017, 0.021, 0.026] },
  { id: 'cigarBox',    category: 'Tenor & Cigar Box Variants', name: '4-String Cigar Box Guitar', scaleMin: 23.0, scaleMax: 24.0, tuning: ['D3', 'G3', 'B3', 'E4'], gauges: [0.017, 0.021, 0.026, 0.032] },
  { id: 'mandolin',    category: 'Other Plucked Instruments', name: 'Mandolin (pairs)', scaleMin: 13.875, scaleMax: 13.875, tuning: ['G3', 'D4', 'A4', 'E5'], gauges: [0.010, 0.010, 0.020, 0.020], pairs: true },
  { id: 'tenorBanjo',  category: 'Other Plucked Instruments', name: 'Tenor Banjo', scaleMin: 21.5, scaleMax: 23.0, defaultScale: 23.0, tuning: ['C3', 'G3', 'D4', 'A4'], gauges: [0.013, 0.017, 0.021, 0.025] },
  { id: 'bouzouki',    category: 'Other Plucked Instruments', name: 'Bouzouki (Irish)', scaleMin: 22.0, scaleMax: 26.0, tuning: ['G2', 'D3', 'A3', 'D4'], gauges: [0.013, 0.018, 0.024, 0.030] }
];

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_OFFSETS = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const FLAT_TO_SHARP = { DB: 'C#', EB: 'D#', GB: 'F#', AB: 'G#', BB: 'A#' };

// Note math (A4 = 440 Hz)
function noteToMidi(note) {
  const m = String(note).trim().toUpperCase().match(/^([A-G])([#bB]?)(\d)$/);
  if (!m) return null;
  let name = m[1] + (m[2] ? m[2].toUpperCase() : '');
  if (FLAT_TO_SHARP[name]) name = FLAT_TO_SHARP[name];
  const offset = NOTE_OFFSETS[name];
  if (offset === undefined) return null;
  return 12 * (parseInt(m[3], 10) + 1) + offset;
}

function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return SHARP_NAMES[((midi % 12) + 12) % 12] + octave;
}

function freq(note) {
  const midi = noteToMidi(note);
  if (midi === null) return NaN;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function transpose(note, semitones) {
  return midiToName(noteToMidi(note) + semitones);
}

// Per-instrument UI state
const state = {};
INSTRUMENTS.forEach(function (inst) {
  const standardScale = inst.defaultScale || (inst.scaleMin + inst.scaleMax) / 2;
  state[inst.id] = { scale: standardScale, targets: inst.tuning.slice(), transpose: 0 };
});

let selectedId = INSTRUMENTS[0].id;
let unit = 'in';

function selectedInstrument() {
  return INSTRUMENTS.find(function (i) { return i.id === selectedId; });
}

function fmtGauge(inches) {
  if (unit === 'mm') return (inches * 25.4).toFixed(2) + ' mm';
  return inches.toFixed(3) + '"';
}

function scaleRangeText(inst) {
  return inst.scaleMin === inst.scaleMax
    ? inst.scaleMin + '"'
    : inst.scaleMin + '" - ' + inst.scaleMax + '"';
}

// Constant tension: gauge is proportional to 1 / (scale length x frequency)
function targetGauge(stockNote, stockGauge, targetNote, standardScale, scale) {
  const fStock = freq(stockNote);
  const fTarget = freq(targetNote);
  if (isNaN(fStock) || isNaN(fTarget) || fTarget === 0) return NaN;
  return stockGauge * (fStock / fTarget) * (standardScale / scale);
}

// If stock strings are kept at the target tuning and scale length,
// their tension changes by this factor relative to stock.
function stockTensionFactor(stockNote, targetNote, standardScale, scale) {
  const fStock = freq(stockNote);
  const fTarget = freq(targetNote);
  if (isNaN(fStock) || isNaN(fTarget) || fStock === 0) return NaN;
  const fRatio = fTarget / fStock;
  const lRatio = scale / standardScale;
  return fRatio * fRatio * lRatio * lRatio;
}

function tensionClass(factor) {
  if (isNaN(factor)) return '';
  if (factor >= 0.95 && factor <= 1.05) return 'ok';
  if (factor >= 0.75 && factor <= 1.25) return 'warn';
  return 'bad';
}

// --- Controls ---
function renderControls() {
  const select = document.getElementById('instrumentSelect');
  const unitSelect = document.getElementById('unitSelect');

  let html = '';
  let currentCategory = null;
  INSTRUMENTS.forEach(function (inst) {
    if (inst.category !== currentCategory) {
      if (currentCategory !== null) html += '</optgroup>';
      html += '<optgroup label="' + inst.category + '">';
      currentCategory = inst.category;
    }
    html += '<option value="' + inst.id + '">' + inst.name + ' (' + scaleRangeText(inst) + ')</option>';
  });
  html += '</optgroup>';
  select.replaceChildren();
  select.innerHTML = html;
  select.value = selectedId;

  unitSelect.value = unit;

  const presetRow = document.getElementById('presetRow');
  let presets = '';
  for (let n = -3; n <= 3; n++) {
    const active = state[selectedId].transpose === n ? ' active' : '';
    const label = n === 0
      ? 'Standard'
      : (n > 0 ? '+' + n : String(n)) + ' st';
    presets += '<button type="button" class="preset-btn' + active + '" data-st="' + n + '">' + label + '</button>';
  }
  presetRow.innerHTML = presets;
}

// --- Detail table for the selected instrument ---
function renderDetail() {
  const inst = selectedInstrument();
  const s = state[inst.id];

  document.getElementById('detailTitle').textContent = inst.name;
  document.getElementById('detailMeta').innerHTML =
    'Standard scale length: ' + scaleRangeText(inst) +
    '. Stock tuning: ' + inst.tuning.join(' - ') +
    '. Set the scale length for your specific instrument and edit the target notes (e.g. <code>D3</code>, <code>F#4</code>).';

  const thead = document.querySelector('#detailTable thead');
  const n = inst.tuning.length;
  let head = '<tr><th>String</th><th>Stock note</th><th>Stock gauge</th><th>Target note</th><th>Target gauge (equal tension)</th><th>Stock strings at this tuning</th></tr>';
  thead.innerHTML = head;

  const tbody = document.querySelector('#detailTable tbody');
  let rows = '';
  for (let i = 0; i < n; i++) {
    const stockNote = inst.tuning[i];
    const stockGauge = inst.gauges[i];
    const targetNote = s.targets[i];
    const valid = noteToMidi(targetNote) !== null;
    const gauge = valid ? targetGauge(stockNote, stockGauge, targetNote, standardScaleOf(inst), s.scale) : NaN;
    const tension = valid ? stockTensionFactor(stockNote, targetNote, standardScaleOf(inst), s.scale) : NaN;

    const label = inst.pairs
      ? (n - i) + ' (pair)'
      : (n - i) + (n - i === 1 ? ' (high)' : (n - i === n ? ' (low)' : ''));
    const gaugeCell = valid
      ? '<td class="num gauge">' + fmtGauge(gauge) + '</td>'
      : '<td class="invalid">invalid note</td>';
    const tensionCell = valid
      ? '<td class="num ' + tensionClass(tension) + '">&#215;' + tension.toFixed(2) + '</td>'
      : '<td></td>';

    rows += '<tr>'
      + '<td class="cat-label">' + label + '</td>'
      + '<td class="dim">' + stockNote + '</td>'
      + '<td class="num dim">' + fmtGauge(stockGauge) + '</td>'
      + '<td><input type="text" class="target-input" data-i="' + i + '" value="' + targetNote + '" size="5" spellcheck="false"></td>'
      + gaugeCell
      + tensionCell
      + '</tr>';
  }
  tbody.innerHTML = rows;

  tbody.querySelectorAll('.target-input').forEach(function (input) {
    input.addEventListener('change', function () {
      const i = parseInt(input.dataset.i, 10);
      s.targets[i] = input.value.trim();
      s.transpose = null;
      renderAll();
    });
  });
}

function standardScaleOf(inst) {
  return inst.defaultScale || (inst.scaleMin + inst.scaleMax) / 2;
}

// Update the scale hint text and the numeric cells without rebuilding
// the input elements, so the scale length field keeps focus while typing.
function onScaleInput(value) {
  const inst = selectedInstrument();
  const s = state[inst.id];
  if (isNaN(value) || value <= 0) return;
  s.scale = value;

  const mm = (s.scale * 25.4).toFixed(1);
  const range = scaleRangeText(inst);
  const outOfRange = s.scale < inst.scaleMin || s.scale > inst.scaleMax;
  document.getElementById('scaleHint').innerHTML =
    (s.scale + ' in = ' + mm + ' mm') +
    (outOfRange ? ' <span class="warn">(outside the typical ' + range + ' range)</span>' : ' (standard: ' + range + ')');

  patchDetailCells();
  renderCompare();
}

function patchDetailCells() {
  const inst = selectedInstrument();
  const s = state[inst.id];
  const rows = document.querySelectorAll('#detailTable tbody tr');
  for (let i = 0; i < rows.length && i < inst.tuning.length; i++) {
    const input = rows[i].querySelector('.target-input');
    const targetNote = input ? input.value.trim() : s.targets[i];
    const valid = noteToMidi(targetNote) !== null;
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 6) continue;
    if (valid) {
      const gauge = targetGauge(inst.tuning[i], inst.gauges[i], targetNote, standardScaleOf(inst), s.scale);
      const tension = stockTensionFactor(inst.tuning[i], targetNote, standardScaleOf(inst), s.scale);
      cells[4].className = 'num gauge';
      cells[4].textContent = fmtGauge(gauge);
      cells[5].className = 'num ' + tensionClass(tension);
      cells[5].innerHTML = '&#215;' + tension.toFixed(2);
    } else {
      cells[4].className = 'invalid';
      cells[4].textContent = 'invalid note';
      cells[5].className = '';
      cells[5].textContent = '';
    }
  }
}

function updateScaleHint() {
  const inst = selectedInstrument();
  const s = state[inst.id];
  const range = scaleRangeText(inst);
  const outOfRange = s.scale < inst.scaleMin || s.scale > inst.scaleMax;
  document.getElementById('scaleHint').innerHTML =
    (s.scale + ' in = ' + (s.scale * 25.4).toFixed(1) + ' mm') +
    (outOfRange ? ' <span class="warn">(outside the typical ' + range + ' range)</span>' : ' (standard: ' + range + ')');
}

// --- Comparison table: all instruments, same target tuning ---
function renderCompare() {
  const selected = selectedInstrument();
  const targets = state[selected.id].targets;
  const thead = document.querySelector('#compareTable thead');
  const tbody = document.querySelector('#compareTable tbody');

  document.getElementById('compareMeta').innerHTML =
    'Gauges required to reach <strong>' + targets.join(' - ') + '</strong> ' +
    'on every instrument at its scale length (shown in the first column). Each string is ' +
    'anchored to the stock string in the same position. ' +
    'Dashes mean the instrument has fewer strings than the selected tuning, so no anchor exists.';

  let head = '<tr><th>Instrument</th><th>Scale length</th>';
  targets.forEach(function (t) {
    head += '<th>' + (noteToMidi(t) !== null ? t : t + ' ?') + '</th>';
  });
  head += '</tr>';
  thead.innerHTML = head;

  let rows = '';
  INSTRUMENTS.forEach(function (inst) {
    const s = state[inst.id];
    let row = '<tr>';
    row += '<td class="cat-label">' + (inst.id === selected.id ? '<strong>' + inst.name + '</strong>' : inst.name) + '</td>';
    row += '<td class="num dim">' + , idx) {
      if (noteToMidi(target) === null) {
        row += '<td class="dim">?</td>';
      } else if (idx >= inst.tuning.length) {
        row += '<td class="dim">-</td>';
      } else {
        const gauge = targetGauge(inst.tuning[idx], inst.gauges[i
        const gauge = targetGauge(inst.tuning[stockIdx], inst.gauges[stockIdx], target, standardScaleOf(inst), s.scale);
        row += '<td class="num gauge">' + fmtGauge(gauge) + '</td>';
      }
    });
    row += '</tr>';
    rows += row;
  });
  tbody.innerHTML = rows;
}

function renderAll() {
  renderControls();
  renderDetail();
  renderCompare();
  document.getElementById('scaleInput').value = state[selectedId].scale;
  updateScaleHint();
}

function init() {
  if (!document.getElementById('scaleInput')) {
    // Inject scale length control into the detail section header
    const controlHtml =
      '<div class="control" style="display:inline-flex;align-items:center;gap:8px;margin-left:12px">'
      + '<label for="scaleInput" style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em">Scale length (inches)</label>'
      + '<input type="number" id="scaleInput" min="10" max="30" step="0.125" style="width:90px">'
      + '<span class="hint" id="scaleHint"></span>'
      + '</div>';
    document.getElementById('detailMeta').insertAdjacentHTML('afterend', controlHtml);
  }

  document.getElementById('instrumentSelect').addEventListener('change', function () {
    selectedId = this.value;
    state[selectedId].scale = standardScaleOf(selectedInstrument());
    renderAll();
  });
  document.getElementById('unitSelect').addEventListener('change', function () {
    unit = this.value;
    renderAll();
  });
  document.getElementById('scaleInput').addEventListener('input', function () {
    onScaleInput(parseFloat(this.value));
  });
  document.getElementById('presetRow').addEventListener('click', function (e) {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const inst = selectedInstrument();
    const n = parseInt(btn.dataset.st, 10);
    state[inst.id].targets = inst.tuning.map(function (note) { return transpose(note, n); });
    state[inst.id].transpose = n;
    renderAll();
  });
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
