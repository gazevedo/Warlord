const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_BATTLE_CONFIG,
  validateAttack,
  createMarch,
  marchProgress,
  resolveBattle
} = require('../battle-engine.js');

function city(overrides = {}) {
  return { id: 'city', name: 'Cidade', ownerId: 'player', owner: 'Jogador', level: 10, troops: 1000, wallPower: 0, x: 0, y: 0, ...overrides };
}

test('valida propriedade, destino e contingente antes do ataque', () => {
  const origin = city();
  const enemy = city({ id: 'enemy', ownerId: 'enemy', x: 3, y: 4 });
  assert.deepEqual(validateAttack({ origin, destination: enemy, troops: 500, playerId: 'player' }), []);
  assert.equal(validateAttack({ origin: enemy, destination: origin, troops: 0, playerId: 'player' }).length, 3);
  assert.match(validateAttack({ origin, destination: enemy, troops: 1001, playerId: 'player' })[0], /suficientes/);
});

test('marcha debita tropas e usa timestamps para calcular progresso', () => {
  const origin = city();
  const destination = city({ id: 'enemy', ownerId: 'enemy', x: 3, y: 4 });
  const march = createMarch({ id: 'm1', origin, destination, troops: 400, playerId: 'player', departureAt: 1000, config: { ...DEFAULT_BATTLE_CONFIG, armySpeed: 5 } });
  assert.equal(origin.troops, 600);
  assert.equal(march.distance, 5);
  assert.equal(march.travelMs, 60_000);
  assert.equal(marchProgress(march, 31_000), 0.5);
});

test('defesa é calculada com o estado da cidade no instante da chegada', () => {
  const target = city({ id: 'enemy', ownerId: 'enemy', level: 50, troops: 500_000, wallPower: 300_000 });
  const report = resolveBattle({
    march: { troops: 1_000_000, attackBonus: 1.5, playerId: 'player', playerName: 'Lord' },
    city: target,
    defenderBonus: 1,
    wallPower: target.wallPower
  });
  assert.equal(report.attackPower, 2_500_000);
  assert.equal(report.defensePower, 2_050_000);
  assert.equal(report.result, 'victory');
  assert.equal(target.ownerId, 'player');
  assert.equal(target.level, 49);
  assert.equal(target.troops, report.attackerSurvivors);
});

test('muralha pode defender uma cidade sem tropas', () => {
  const target = city({ id: 'enemy', ownerId: 'enemy', troops: 0, wallPower: 2000 });
  const report = resolveBattle({ march: { troops: 1000, attackBonus: 0, playerId: 'player' }, city: target });
  assert.equal(report.defensePower, 2000);
  assert.equal(report.result, 'defeat');
  assert.equal(target.ownerId, 'enemy');
});

test('empate favorece o defensor e causa baixas nos dois lados', () => {
  const target = city({ id: 'enemy', ownerId: 'enemy', level: 1, troops: 1000 });
  const config = { ...DEFAULT_BATTLE_CONFIG, defensePerCityLevel: 0 };
  const report = resolveBattle({ march: { troops: 1000, attackBonus: 0, playerId: 'player' }, city: target, config });
  assert.equal(report.result, 'defeat');
  assert.equal(report.attackerLosses, 500);
  assert.equal(report.defenderLosses, 500);
});
