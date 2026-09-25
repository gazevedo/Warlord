const test = require('node:test');
const assert = require('node:assert/strict');
const { BUILDABLE_TERRAINS, DEFAULT_MAP_SEED, LAYERS, MOVEMENT_COST, createMapDefinition, isBuildableCityPosition, placeCitiesOnBuildableTerrain, rectanglesOverlap, terrainBiomeAt } = require('../map-definition.js');

test('a seed fixa produz a mesma definição e outra seed altera a composição', () => {
  const input = { width: 2_460, height: 2_220, cities: [] };
  const first = createMapDefinition(input);
  const second = createMapDefinition(input);
  const changed = createMapDefinition({ ...input, seed: DEFAULT_MAP_SEED + 1 });
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.objects.filter(({ type }) => type !== 'terrain'), changed.objects.filter(({ type }) => type !== 'terrain'));
});

test('mantém a grade lógica fora da lista de objetos visuais', () => {
  const map = createMapDefinition({ width: 2_460, height: 2_220, cities: [] });
  assert.ok(map.logicalCells.length > 0);
  assert.equal(map.objects.some(({ type }) => type === 'terrain'), false);
  map.logicalCells.forEach((cell) => {
    assert.equal(cell.movementCost, MOVEMENT_COST[cell.biome]);
    assert.equal(cell.blocked, cell.biome === 'water');
  });
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

test('reposiciona castelos para áreas sem água e preserva seus dados', () => {
  const width = 2_460;
  const height = 2_220;
  const waterCity = { id: 'river-castle', name: 'Castelo do Rio', x: 54, y: 50, level: 12 };
  assert.equal(terrainBiomeAt(width * 0.54, height * 0.5, width, height), 'water');

  const [placed] = placeCitiesOnBuildableTerrain([waterCity], width, height);
  const x = (placed.x / 100) * width;
  const y = (placed.y / 100) * height;
  assert.equal(placed.name, waterCity.name);
  assert.equal(placed.level, waterCity.level);
  assert.ok(BUILDABLE_TERRAINS.includes(terrainBiomeAt(x, y, width, height)));
  assert.equal(isBuildableCityPosition(x, y, width, height), true);
});
