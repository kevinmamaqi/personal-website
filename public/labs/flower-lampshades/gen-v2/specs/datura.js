export default {
  key: 'datura',
  name: 'Datura',
  note:
    'Grown as a surface, not as a stack of rings. The wall is an elastic sheet ' +
    'pinned at the throat, and a band near its margin is given more area than the ' +
    'space around it can hold flat. The growth is not even around the axis: five ' +
    'lobes grow in full and the sinuses between them grow a fifth as much, so the ' +
    'surplus bulges into five petals rather than one continuous frill. And the ' +
    'petals curl back: their rest curvature is turned outward as they grow, the ' +
    'way tissue that grows faster on one face than the other does, which is what ' +
    'opens the trumpet into a five-point star. The margin is nudged toward light ' +
    'as it grows, hard - without that a reflexed petal is a down-facing surface. ' +
    '0.15 mm layers: that is what buys the 66 degrees of overhang the curled rim needs.',
  use: 'floor',
  print: { layerHeight: 0.15 },
  shade: {
    height: 120,
    silhouette: [[0, 34], [0.35, 38], [0.7, 46], [1, 58]],
    surface: {
      seed: 9,
      stages: 24,
      growthOnset: 0.75,
      growPerStage: 0.1,
      bend: 0.35,
      lift: 3.0,
      petals: 5,
      petalContrast: 0.8,
      curl: 0.04,
      veins: 5,
      veinStiffness: 0,
      veinRelief: 0.5,
      noise: 0.15,
      wallTaper: 0.25,
    },
    throatRadius: 34,
    throatHeight: 12,
  },
};
