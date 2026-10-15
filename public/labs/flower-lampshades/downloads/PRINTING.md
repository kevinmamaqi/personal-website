# Flower lampshades — print handoff

Build: 25 August 2026  
Units: millimetres  
Orientation: Z up, already placed on the print bed

These are the exact ten STL files emitted by a passing generator build. The software checks topology, orientation, build volume, wall thickness, overhangs, folds, assembly clearances and deterministic output. Nothing in this project has been physically printed yet, so treat the first run as validation rather than a finished production recipe.

## Print in this order

1. Print `coupon.stl` in PETG. Check both threaded interfaces and cable clearance.
2. Print `collar.stl` and `ring.stl`. Test them against the actual E27 lampholder and one shade flange.
3. Print one shade. `poppy.stl` is the shortest current shade print at roughly 7 h 32 m.
4. Print `stem.stl` and `base.stl` after the bought hardware fits.

Do not rotate any STL. The parts are exported in their support-free print orientation.

## Shades — two-wall shell

- Spiral/vase mode: off
- Variable line width / Arachne: on
- Nozzle: 0.4 mm
- Nominal line width: 0.45 mm; minimum variable width: 0.30 mm
- Walls: 2
- Infill: 0%
- Top layers: 0
- Bottom layers: 5
- Layer height: 0.15 mm
- Morning Glory only: 0.10 mm layer height
- Supports: off
- Speed: 30–40 mm/s
- Cooling: 100% after layer 3
- Brim: 5 mm
- Seam: aligned or random; do not use nearest
- Material: natural or white filament for light transmission

Grown surfaces are not vase-mode objects. A horizontal slice can contain disconnected arcs, so a vase-mode slicer may silently discard parts of the wall.

## Hardware — PETG

- Spiral/vase mode: off
- Nozzle: 0.4 mm
- Layer height: 0.20 mm
- Walls: 3
- Infill: 20% gyroid
- Supports: off
- Material: PETG
- Typical nozzle range: 235–245 °C; use the filament manufacturer's profile

Anything carrying load or close to the bulb must be PETG. Use only a cool-running E27 LED bulb rated at 8 W or less and a certified cord set. Do not improvise mains wiring.

## Unverified bought-part assumptions

The generator currently assumes an E27 lampholder body up to 40 mm diameter, an M10×1 nipple, cable up to 6 mm diameter and 0.35 mm radial thread clearance. Those values came from catalogue drawings, not measurements of the hardware in hand. The coupon and collar test exist to verify them before a long print.

## Included files

Shades: `datura.stl`, `camellia.stl`, `lily.stl`, `morningglory.stl`, `poppy.stl`  
Hardware: `base.stl`, `stem.stl`, `collar.stl`, `ring.stl`  
Fit test: `coupon.stl`  
Build report: `manifest.json`

The live renderer and engineering note are at:

- https://kevinmamaqi.com/labs/flower-lampshades/renderer/
- https://kevinmamaqi.com/notes/flower-lampshades/
