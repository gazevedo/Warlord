const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_BOT_COUNT,
  PLAYER_ID,
  STARTING_CITIES_PER_PLAYER,
  TERRAIN_TILE,
  createTerrainTiles,
  createInitialWorld,
  moveCapital
} = require('../world-state.js');

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

test('expande o mapa quando novos participantes entram', () => {
  const initial = createInitialWorld({ botCount: 6 });
  const expanded = createInitialWorld({ botCount: 20 });
  assert.ok(expanded.dimensions.width > initial.dimensions.width);
  assert.ok(expanded.dimensions.height > initial.dimensions.height);
  assert.equal(expanded.cities.filter(({ ownerId }) => ownerId !== null).length, 21 * STARTING_CITIES_PER_PLAYER);
});

test('monta a base do mapa com uma malha expansível do terreno de grama', () => {
  const initial = createInitialWorld({ botCount: 6 });
  const expanded = createInitialWorld({ botCount: 20 });
  assert.ok(initial.terrain.tiles.length > 0);
  assert.ok(expanded.terrain.tiles.length > initial.terrain.tiles.length);
  assert.equal(initial.terrain.tiles.every(({ asset }) => asset === TERRAIN_TILE.asset), true);

  const custom = createTerrainTiles({ width: 1_600, height: 1_200 });
  assert.ok(Math.max(...custom.map(({ x, width }) => x + width)) >= 1_600);
  assert.ok(Math.max(...custom.map(({ y, height }) => y + height)) >= 1_200);
  assert.ok(Math.min(...custom.map(({ x }) => x)) <= 0);
  assert.ok(Math.min(...custom.map(({ y }) => y)) <= 0);
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
