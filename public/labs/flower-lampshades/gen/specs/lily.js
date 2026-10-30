export default {
  key: 'lily',
  name: 'Lily',
  note:
    'Six petals with edges of their own. The seed sheet is cut from the margin ' +
    'nearly halfway down between the lobes, so each petal is free on three ' +
    'sides; the lobes are narrowed, a stiff midrib runs up the centre of each, ' +
    'and the rest curvature is grown outward, so the tips flare back and come to ' +
    'a point where the rib is. Everything the Datura does, on petals that are ' +
    'no longer webbed together. Hung as a pendant it inverts: the throat becomes ' +
    'the stem and the petals open downward and out, which is how a lily hangs - ' +
    'rendered both ways before deciding, and the pendant reads better.',
  use: 'pendant',
  print: { layerHeight: 0.15 },
  shade: {
    height: 125,
    silhouette: [[0, 34], [0.35, 38], [0.7, 46], [1, 58]],
    surface: {
      seed: 9,
      stages: 24,
      growthOnset: 0.8,
      growPerStage: 0.11,
      bend: 0.35,
      lift: 3.5,
      petals: 6,
      petalContrast: 0.8,
      petalShape: 2,
      slits: 6,
      slitDepth: 0.45,
      veins: 6,
      veinStiffness: 4,
      curl: 0.05,
      veinRelief: 0.5,
      wallTaper: 0.25,
    },
    throatRadius: 34,
    throatHeight: 12,
  },
};
