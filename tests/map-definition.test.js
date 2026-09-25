const test = require('node:test');
const assert = require('node:assert/strict');
const { BUILDABLE_TERRAINS, DEFAULT_MAP_SEED, LAYERS, MAP_SEED, MOVEMENT_COST, biomeSampleAt, createMapDefinition, isBuildableCityPosition, placeCitiesOnBuildableTerrain, rectanglesOverlap, selectBiome, terrainBlendAt, terrainBiomeAt } = require('../map-definition.js');

test('gera biomas por ruído coerente com a seed fixa', () => {
  assert.equal(MAP_SEED, 20260925);
  assert.equal(DEFAULT_MAP_SEED, MAP_SEED);
  assert.deepEqual(biomeSampleAt(320, 640, 2_460, 2_220), biomeSampleAt(320, 640, 2_460, 2_220));
  assert.equal(selectBiome({ elevation: 0.2, moisture: 0.8, temperature: 0.8 }), 'water');
  assert.equal(selectBiome({ elevation: 0.8, moisture: 0.8, temperature: 0.2 }), 'snow');
  assert.equal(selectBiome({ elevation: 0.8, moisture: 0.2, temperature: 0.8 }), 'sand');
  assert.equal(selectBiome({ elevation: 0.8, moisture: 0.8, temperature: 0.8 }), 'grass');
});

test('cria uma faixa de mistura gradual entre biomas', () => {
  let transition;
  for (let x = 0; x <= 2_460 && !transition; x += 4) {
    for (let y = 0; y <= 2_220; y += 4) {
      const blend = terrainBlendAt(x, y, 2_460, 2_220);
      if (blend.secondary && blend.blendFactor > 0 && blend.blendFactor < 1) {
        transition = blend;
        break;
      }
    }
  }
  assert.ok(transition);
  assert.notEqual(transition.primary, transition.secondary);
  assert.ok(['grass', 'sand', 'snow', 'water'].includes(transition.primary));
  assert.ok(['grass', 'sand', 'snow', 'water'].includes(transition.secondary));
});

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
  const cells = new Map(map.logicalCells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  map.logicalCells.forEach((cell) => {
    const neighbors = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset || columnOffset) neighbors.push(cells.get(`${cell.row + rowOffset}:${cell.column + columnOffset}`));
      }
    }
    assert.equal(neighbors.filter(Boolean).some((neighbor) => neighbor.biome === cell.biome), true);
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
