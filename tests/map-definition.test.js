const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_MAP_SEED, LAYERS, createMapDefinition, rectanglesOverlap } = require('../map-definition.js');

test('a seed fixa produz a mesma definição e outra seed altera a composição', () => {
  const input = { width: 2_460, height: 2_220, cities: [] };
  const first = createMapDefinition(input);
  const second = createMapDefinition(input);
  const changed = createMapDefinition({ ...input, seed: DEFAULT_MAP_SEED + 1 });
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.objects.filter(({ type }) => type !== 'terrain'), changed.objects.filter(({ type }) => type !== 'terrain'));
});

test('objetos respeitam camadas, profundidade vertical e colisão entre grandes elementos', () => {
  const map = createMapDefinition({ width: 2_460, height: 2_220, cities: [] });
  const scenery = map.objects.filter(({ type }) => type !== 'terrain');
  scenery.forEach((object) => {
    const base = object.type === 'lake' ? LAYERS.lakes : LAYERS.scenery;
    assert.equal(object.zIndex, base + Math.floor(object.y + object.height));
  });
  const blocking = scenery.filter(({ blocking }) => blocking);
  for (let index = 0; index < blocking.length; index += 1) {
    for (let comparison = index + 1; comparison < blocking.length; comparison += 1) {
      assert.equal(rectanglesOverlap(blocking[index], blocking[comparison], 28), false);
    }
  }
});
