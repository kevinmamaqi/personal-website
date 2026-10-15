export default {
  key: 'morningglory',
  name: 'Morning Glory',
  note:
    'A morning glory bud is a twisted funnel, and so is this. The five lobes of ' +
    'the growth field drift around the axis as they climb the sheet, so every ' +
    'petal leans the same way and the flower reads as a pinwheel from above. A ' +
    'leaning pleat has a down-facing side, which is why this is the one shade ' +
    'printed at 0.10 mm layers: that buys 74 degrees of overhang instead of 66, ' +
    'and costs five hours. The lever is the layer height, here in the spec where ' +
    'the cost is visible - not the overhang budget.',
  use: 'table',
  print: { layerHeight: 0.1 },
  shade: {
    height: 110,
    silhouette: [[0, 34], [0.35, 38], [0.7, 46], [1, 58]],
    surface: {
      seed: 9,
      stages: 22,
      growthOnset: 0.75,
      growPerStage: 0.1,
      bend: 0.45,
      lift: 3.4,
      petals: 5,
      petalContrast: 0.6,
      curl: 0.03,
      petalTwist: 1.0,
      veins: 5,
      veinStiffness: 0,
      veinRelief: 0.4,
      noise: 0.15,
      wallTaper: 0.25,
    },
    throatRadius: 34,
    throatHeight: 12,
  },
};
