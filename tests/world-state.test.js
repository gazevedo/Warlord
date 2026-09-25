const test = require('node:test');
const assert = require('node:assert/strict');
const { isBuildableCityPosition, rectanglesOverlap } = require('../map-definition.js');
const {
  DEFAULT_BOT_COUNT,
  MAP_AREA_MULTIPLIER,
  PLAYER_ID,
  STARTING_CITIES_PER_PLAYER,
  createInitialWorld,
  moveCapital
} = require('../world-state.js');

test('amplia a área do mapa em dez vezes sem transformar 10x em cada eixo', () => {
  const dimensions = createInitialWorld({ botCount: 6 }).dimensions;
  const previousWidth = (3 * 700) + 360;
  const previousHeight = (3 * 620) + 360;
  const areaRatio = (dimensions.width * dimensions.height) / (previousWidth * previousHeight);

  assert.equal(MAP_AREA_MULTIPLIER, 10);
  assert.ok(Math.abs(areaRatio - MAP_AREA_MULTIPLIER) < 0.01);
});

test('inicia o jogador e seis bots com cinco vilas de nível 1', () => {
  const world = createInitialWorld();
  assert.equal(world.players.length, DEFAULT_BOT_COUNT + 1);
  assert.equal(world.players.filter(({ bot }) => bot).length, 6);

  world.players.forEach((player) => {
    const owned = world.cities.filter(({ ownerId }) => ownerId === player.id);
    assert.equal(owned.length, STARTING_CITIES_PER_PLAYER);
    assert.equal(owned.every(({ level }) => level === 1), true);
    assert.equal(owned.filter(({ isCapital }) => isCapital).length, 1);
  });
});

test('distribui vilas neutras conquistáveis ao redor do mapa', () => {
  const world = createInitialWorld();
  const neutral = world.cities.filter(({ ownerId }) => ownerId === null);
  assert.equal(neutral.length, 14);
  assert.equal(neutral.every(({ isCapital, level }) => !isCapital && level === 1), true);
  assert.equal(neutral.every(({ x, y }) => x < 8 || x > 92 || y < 8 || y > 92), true);
});

test('posiciona todos os castelos somente em terreno edificável', () => {
  const world = createInitialWorld();
  world.cities.forEach((city) => {
    const x = (city.x / 100) * world.dimensions.width;
    const y = (city.y / 100) * world.dimensions.height;
    assert.equal(isBuildableCityPosition(x, y, world.dimensions.width, world.dimensions.height), true, city.id);
    const castleBounds = { x: x - 90, y: y - 75, width: 180, height: 155 };
    const scenery = world.map.objects.filter(({ type }) => type !== 'terrain');
    assert.equal(scenery.some((object) => rectanglesOverlap(castleBounds, object)), false, city.id);
  });
});

test('expande o mapa quando novos participantes entram', () => {
  const initial = createInitialWorld({ botCount: 6 });
  const expanded = createInitialWorld({ botCount: 20 });
  assert.ok(expanded.dimensions.width > initial.dimensions.width);
  assert.ok(expanded.dimensions.height > initial.dimensions.height);
  assert.equal(expanded.cities.filter(({ ownerId }) => ownerId !== null).length, 21 * STARTING_CITIES_PER_PLAYER);
});

test('monta uma definição de mapa expansível com os quatro biomas', () => {
  const initial = createInitialWorld({ botCount: 6 });
  const expanded = createInitialWorld({ botCount: 20 });
  assert.ok(initial.map.logicalCells.length > 0);
  assert.ok(expanded.map.logicalCells.length > initial.map.logicalCells.length);
  assert.deepEqual(new Set(initial.map.logicalCells.map(({ biome }) => biome)), new Set(['grass', 'water', 'sand', 'snow']));
  assert.equal(initial.map.objects.some(({ type }) => type === 'terrain'), false);
  assert.equal(initial.map.logicalCells.every(({ row, column, movementCost, blocked }) => Number.isInteger(row) && Number.isInteger(column) && typeof movementCost === 'number' && typeof blocked === 'boolean'), true);
});

test('transfere o centro somente para outra cidade do proprietário', () => {
  const world = createInitialWorld();
  const owned = world.cities.filter(({ ownerId }) => ownerId === PLAYER_ID);
  const previousCapital = owned.find(({ isCapital }) => isCapital);
  const destination = owned.find(({ isCapital }) => !isCapital);
  assert.equal(moveCapital(world.cities, PLAYER_ID, destination.id), true);
  assert.equal(previousCapital.isCapital, false);
  assert.equal(destination.isCapital, true);
  assert.equal(owned.filter(({ isCapital }) => isCapital).length, 1);
  assert.equal(moveCapital(world.cities, PLAYER_ID, 'bot-north-city-1'), false);
});
