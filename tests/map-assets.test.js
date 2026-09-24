const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { NATURAL_RESOURCE_ASSETS, PAINTED_ASSETS, TERRAIN_ASSETS, getCityMapAsset, getVegetationAsset } = require('../map-assets.js');

test('todos os registros apontam para assets existentes', () => {
  [...Object.values(TERRAIN_ASSETS), ...Object.values(NATURAL_RESOURCE_ASSETS), ...Object.values(PAINTED_ASSETS)].forEach((asset) => {
    assert.equal(existsSync(resolve(__dirname, '..', asset)), true, `${asset} deve existir`);
  });
});

test('seleciona vegetação por bioma, tamanho e variante', () => {
  assert.equal(getVegetationAsset('temperate', 'single', 0), 'assets/vegetation/temperate/tree_01.png');
  assert.equal(getVegetationAsset('temperate', 'single', 2), 'assets/vegetation/temperate/tree_03.png');
  assert.equal(getVegetationAsset('pine', 'small'), 'assets/vegetation/pine/tree_11.png');
  assert.equal(getVegetationAsset('snow', 'medium'), 'assets/vegetation/snow/tree_21.png');
  assert.equal(getVegetationAsset('dead', 'large'), 'assets/vegetation/dead/tree_31.png');
  assert.throws(() => getVegetationAsset('tropical', 'large'), /Bioma/);
});

test('usa cidades painted por facção no estágio inicial', () => {
  assert.equal(getCityMapAsset({ level: 1, ownerId: null, tone: 'neutral' }, 'tier.png'), PAINTED_ASSETS.cityNeutral);
  assert.equal(getCityMapAsset({ level: 1, ownerId: 'bot', tone: 'red' }, 'tier.png'), PAINTED_ASSETS.cityRedSmall);
  assert.equal(getCityMapAsset({ level: 1, ownerId: 'player', tone: 'blue' }, 'tier.png'), PAINTED_ASSETS.cityBlueSmall);
  assert.equal(getCityMapAsset({ level: 10, ownerId: 'player', tone: 'blue' }, 'tier.png'), 'tier.png');
});
