export default {
  key: 'camellia',
  name: 'Camellia',
  note:
    'Six cupped petals that overlap into a whorl. The sheet is slit between the ' +
    'lobes, so each petal is free to cup on its own, and grown until the petals ' +
    'are wider than the space around the throat can hold - at which point they ' +
    'can only ride over one another, and the collision term decides who goes ' +
    'over whom. The spiral is not drawn; it is what six petals do when there is ' +
    'no room. A little patchiness in the growth so that no two are alike.',
  use: 'floor',
  print: { layerHeight: 0.15 },
  shade: {
    // The first version sat on a seed-sensitive edge: three of seeds 3, 9,
    // 14 and 21 reached 251--271 mm. Trading 2 mm of seed height, 0.005 of
    // growth and 0.05 of patchiness keeps all four below 245 mm while the six
    // petals still overlap into the same tight whorl.
    height: 118,
    silhouette: [[0, 34], [0.35, 38], [0.7, 46], [1, 58]],
    surface: {
      seed: 9,
      stages: 24,
      growthOnset: 0.75,
      growPerStage: 0.1,
      bend: 0.25,
      lift: 2.5,
      petals: 6,
      petalContrast: 0.8,
      slits: 6,
      slitDepth: 0.35,
      noise: 0.25,
      veins: 6,
      veinStiffness: 0,
      veinRelief: 0.4,
      wallTaper: 0.25,
    },
    throatRadius: 34,
    throatHeight: 12,
  },
};
