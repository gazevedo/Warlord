const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { cityAssetFor } = require('../city-assets.js');

test('seleciona um asset city_blue para cada faixa de dez níveis', () => {
  const expectations = [
    [1, 'city01.png'], [9, 'city01.png'],
    [10, 'city10.png'], [19, 'city10.png'],
    [20, 'city20.png'], [29, 'city20.png'],
    [30, 'city30.png'], [39, 'city30.png'],
    [40, 'city40.png'], [49, 'city40.png'],
    [50, 'city50.png'], [59, 'city50.png'],
    [60, 'city60.png'], [69, 'city60.png'],
    [70, 'city70.png'], [79, 'city70.png'],
    [80, 'city80.png'], [89, 'city80.png'],
    [90, 'city90.png'], [99, 'city90.png'],
    [100, 'city100.png'], [157, 'city100.png'], [1_000_000, 'city100.png']
  ];

  expectations.forEach(([level, filename]) => {
    const asset = cityAssetFor(level, 'blue');
    assert.equal(asset, `assets/city/city_blue/${filename}`);
    assert.equal(existsSync(resolve(__dirname, '..', asset)), true, `${asset} deve existir`);
  });
});

test('normaliza níveis inválidos e usa o tema padrão quando necessário', () => {
  assert.equal(cityAssetFor(0), 'assets/city/city_blue/city01.png');
  assert.equal(cityAssetFor('34', 'unknown'), 'assets/city/city_blue/city30.png');
  assert.equal(cityAssetFor(undefined), 'assets/city/city_blue/city01.png');
});
