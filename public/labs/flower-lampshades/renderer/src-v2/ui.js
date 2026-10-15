// The slider schema. Each entry maps one control to one path in a shade spec,
// so adding a parameter is one line here and nothing anywhere else.
//
// Every shade in the catalogue is a grown surface, so every control here is a
// surface control. The six marked `primary` are the ones that define a shade -
// what it is, how big, how many petals, how much they grow, how they stand.
// The rest are the detail levers and live behind a disclosure: all of them
// matter, none of them is where you start.

import { SHELL_DEFAULTS } from '../../gen-v2/lib/shell.js';

export const CONTROLS = [
  { path: 'height', label: 'Height', min: 80, max: 180, step: 1, unit: 'mm', primary: true },
  { path: 'scale', label: 'Width', min: 0.7, max: 1.3, step: 0.01, unit: 'x', synthetic: true, primary: true },
  // The growth field made periodic around the axis: this many lobes of full
  // growth, separated by sinuses that grow `Petal contrast` less. Zero is one
  // continuous ruffle, which is a frill, not a flower.
  { path: 'surface.petals', label: 'Petals', min: 0, max: 9, step: 1, unit: '', primary: true },
  { path: 'surface.growPerStage', label: 'Growth', min: 0.04, max: 0.12, step: 0.005, unit: '', primary: true },
  // Phototropism. Buckling is symmetric - a sheet is equally happy folding up
  // or down - so half of an unbiased ruffle is down-facing surface, which is
  // the half a printer cannot make. Nudging the margin upward picks the upward
  // branch. Drag it to zero and watch the overhang line go red.
  { path: 'surface.lift', label: 'Reach for light', min: 0, max: 4, step: 0.1, unit: 'mm', primary: true },
  { path: 'surface.seed', label: 'Seed', min: 1, max: 40, step: 1, unit: '', primary: true },

  { path: 'surface.petalContrast', label: 'Petal contrast', min: 0, max: 1, step: 0.05, unit: '' },
  { path: 'surface.petalShape', label: 'Petal narrowness', min: 0.5, max: 3, step: 0.1, unit: '' },
  { path: 'surface.petalReach', label: 'Petal reach', min: 0, max: 0.5, step: 0.05, unit: '' },
  // Rest curvature at the margin: positive curls the petals back and outward.
  { path: 'surface.curl', label: 'Petal curl', min: -0.04, max: 0.1, step: 0.005, unit: '/mm' },
  // The lobe centres drift around the axis with height, so the petals spiral.
  { path: 'surface.petalTwist', label: 'Petal twist', min: -2, max: 2, step: 0.1, unit: 'rad' },
  // Cuts from the margin down between the petals: free edges.
  { path: 'surface.slits', label: 'Slits', min: 0, max: 9, step: 1, unit: '' },
  { path: 'surface.slitDepth', label: 'Slit depth', min: 0.1, max: 0.6, step: 0.05, unit: '' },
  // Radial ribs of stiffer sheet; the folds anchor between them.
  { path: 'surface.veins', label: 'Veins', min: 0, max: 16, step: 1, unit: '' },
  { path: 'surface.veinStiffness', label: 'Vein stiffness', min: 0, max: 8, step: 0.25, unit: 'x' },
  { path: 'surface.veinRelief', label: 'Vein relief', min: 0, max: 1, step: 0.05, unit: '' },
  // Seeded patchiness in the growth field: no two petals grow alike.
  { path: 'surface.noise', label: 'Patchiness', min: 0, max: 0.8, step: 0.05, unit: '' },
  // Stiffness sets the wavelength: a limp sheet buys many fine folds, a stiff
  // one a few broad ones, because every fold costs curvature.
  { path: 'surface.bend', label: 'Sheet stiffness', min: 0.05, max: 1, step: 0.01, unit: '' },
  { path: 'surface.growthOnset', label: 'Growth onset', min: 0.3, max: 0.95, step: 0.01, unit: '' },
  { path: 'surface.stages', label: 'Growth time', min: 6, max: 30, step: 1, unit: '' },
  { path: 'surface.wallTaper', label: 'Wall taper', min: 0, max: 0.4, step: 0.05, unit: '' },
  { path: 'throatHeight', label: 'Throat', min: 4, max: 40, step: 1, unit: 'mm' },
];

export function getPath(object, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), object);
}

export function setPath(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), object);
  target[last] = value;
}

/**
 * Build the sliders: the primary ones into `root`, the rest into `more`.
 * Returns a function that re-reads every slider from the state.
 */
export function buildControls(root, more, state, onChange) {
  root.innerHTML = '';
  more.innerHTML = '';
  for (const control of CONTROLS) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control';

    const head = document.createElement('div');
    head.className = 'control-head';
    const label = document.createElement('span');
    label.textContent = control.label;
    const value = document.createElement('span');
    head.append(label, value);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = control.min;
    input.max = control.max;
    input.step = control.step;

    // A spec only writes the surface parameters it changes, so a missing one
    // is the generator's default, not the slider's minimum.
    const fallback = control.path.startsWith('surface.') ? SHELL_DEFAULTS[control.path.slice('surface.'.length)] : undefined;
    const read = () =>
      control.synthetic ? state.scale : getPath(state.shade, control.path) ?? fallback ?? control.min;

    const render = () => {
      const v = read();
      input.value = v;
      const decimals = control.step < 0.01 ? 3 : control.step < 0.1 ? 2 : control.step < 1 ? 1 : 0;
      value.textContent = `${Number(v).toFixed(decimals)}${control.unit ? ' ' + control.unit : ''}`;
    };

    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (control.synthetic) state.scale = v;
      else setPath(state.shade, control.path, v);
      render();
      onChange();
    });

    render();
    wrapper.append(head, input);
    (control.primary ? root : more).append(wrapper);
    control.render = render;
  }
  return () => CONTROLS.forEach((c) => c.render?.());
}

export function chipGroup(root, items, isActive, onPick) {
  root.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.className = 'chip';
    button.textContent = item.label;
    button.setAttribute('aria-pressed', String(isActive(item)));
    button.addEventListener('click', () => onPick(item));
    root.append(button);
  }
}

/** The print check, coloured so a problem is visible without reading it. */
export function renderReport(root, analysis, manifold) {
  const hours = Math.floor(analysis.minutes / 60);
  const mins = Math.round(analysis.minutes % 60);
  const steepClass =
    analysis.steepFraction > analysis.print.steepAreaFraction
      ? 'bad'
      : analysis.steepFraction > analysis.print.steepAreaFraction * 0.5
        ? 'warn'
        : 'ok';
  const wall = analysis.marginThickness < analysis.wallThickness
    ? `${analysis.wallThickness} → ${analysis.marginThickness.toFixed(2)} mm`
    : `${analysis.wallThickness} mm`;

  const rows = [
    ['size', `Ø${analysis.diameter.toFixed(0)} × ${analysis.height.toFixed(0)} mm`],
    ['wall', `${wall}, ${analysis.print.layerHeight} mm layers`],
    ['overhang', `<span class="${steepClass}">${(analysis.steepFraction * 100).toFixed(1)}%</span> past ${analysis.overhangLimitDeg.toFixed(0)}° (budget ${(analysis.print.steepAreaFraction * 100).toFixed(0)}%)`],
    ['print', `${analysis.grams.toFixed(0)} g, ~${hours}h ${mins}m`],
    ['mesh', manifold.watertight ? '<span class="ok">watertight</span>' : '<span class="bad">NOT WATERTIGHT</span>'],
  ];

  let html = rows.map(([k, v]) => `${k.padEnd(9)}${v}`).join('\n');
  html += analysis.issues.length
    ? '\n\n' + analysis.issues.map((i) => `<span class="bad">! ${i}</span>`).join('\n\n')
    : '\n\n<span class="ok">No issues. Ready to slice.</span>';
  root.innerHTML = html;
}

export function download(buffer, filename) {
  const blob = new Blob([buffer], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
