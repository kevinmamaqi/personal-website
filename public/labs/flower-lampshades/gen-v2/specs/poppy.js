export default {
  key: 'poppy',
  name: 'Poppy',
  note:
    'Four broad petals of crumpled tissue. A limp sheet, so it creases finely ' +
    'rather than folding broadly; ten radial ribs of stiffer sheet that the ' +
    'creases have to run between, which is what gives poppy petals their ' +
    'pleated look; and a patchy growth field so the four petals come out ' +
    'four different shapes. The only shade here whose petals are not separated ' +
    'by cuts - the sinuses are simply where nothing grew.',
  use: 'table',
  print: { layerHeight: 0.15 },
  shade: {
    height: 105,
    silhouette: [[0, 34], [0.35, 37], [0.7, 44], [1, 54]],
    surface: {
      seed: 9,
      stages: 24,
      growthOnset: 0.75,
      growPerStage: 0.09,
      bend: 0.15,
      lift: 2.8,
      petals: 4,
      petalContrast: 0.8,
      veins: 10,
      veinStiffness: 6,
      noise: 0.35,
      veinRelief: 0.4,
      wallTaper: 0.25,
    },
    throatRadius: 34,
    throatHeight: 12,
  },
};
