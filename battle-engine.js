(function battleEngineFactory(globalScope) {
  'use strict';

  const DEFAULT_BATTLE_CONFIG = Object.freeze({
    armySpeed: 12,
    defensePerCityLevel: 0.03,
    conquestLevelPenalty: 1,
    battleAnimationMs: 3000,
    casualtyCurve: Object.freeze([
      { ratio: 0.5, attacker: 0.95, defender: 0.15 },
      { ratio: 0.9, attacker: 0.75, defender: 0.35 },
      { ratio: 1.0, attacker: 0.5, defender: 0.5 },
      { ratio: 1.1, attacker: 0.4, defender: 0.6 },
      { ratio: 1.5, attacker: 0.3, defender: 0.75 },
      { ratio: 2.0, attacker: 0.15, defender: 0.95 }
    ])
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function distanceBetweenCities(origin, destination) {
    return Math.hypot(destination.x - origin.x, destination.y - origin.y);
  }

  function validateAttack({ origin, destination, troops, playerId }) {
    const errors = [];
    if (!origin || origin.ownerId !== playerId) errors.push('A cidade de origem deve pertencer ao jogador.');
    if (!destination || destination.ownerId === playerId) errors.push('A cidade de destino deve ser inimiga.');
    if (origin && destination && origin.id === destination.id) errors.push('Origem e destino devem ser diferentes.');
    if (!Number.isInteger(troops) || troops <= 0) errors.push('A quantidade enviada deve ser maior que zero.');
    if (origin && Number.isFinite(troops) && troops > origin.troops) errors.push('A cidade de origem não possui tropas suficientes.');
    return errors;
  }

  function createMarch({ id, origin, destination, troops, playerId, attackBonus = 0, departureAt = Date.now(), config = DEFAULT_BATTLE_CONFIG }) {
    const errors = validateAttack({ origin, destination, troops, playerId });
    if (errors.length) throw new Error(errors.join(' '));
    const distance = distanceBetweenCities(origin, destination);
    const travelMs = (distance / config.armySpeed) * 60_000;
    origin.troops -= troops;
    return {
      id,
      type: 'attack',
      status: 'outbound',
      originId: origin.id,
      destinationId: destination.id,
      playerId,
      troops,
      attackBonus,
      departureAt,
      arrivalAt: departureAt + travelMs,
      distance,
      travelMs
    };
  }

  function marchProgress(march, now = Date.now()) {
    return clamp((now - march.departureAt) / (march.arrivalAt - march.departureAt), 0, 1);
  }

  function casualtyRates(ratio, curve = DEFAULT_BATTLE_CONFIG.casualtyCurve) {
    if (ratio <= curve[0].ratio) return { attacker: curve[0].attacker, defender: curve[0].defender };
    const last = curve[curve.length - 1];
    if (ratio >= last.ratio) return { attacker: last.attacker, defender: last.defender };
    const upperIndex = curve.findIndex((point) => point.ratio >= ratio);
    const lower = curve[upperIndex - 1];
    const upper = curve[upperIndex];
    const progress = (ratio - lower.ratio) / (upper.ratio - lower.ratio);
    return {
      attacker: lower.attacker + ((upper.attacker - lower.attacker) * progress),
      defender: lower.defender + ((upper.defender - lower.defender) * progress)
    };
  }

  function resolveBattle({ march, city, defenderBonus = 0, wallPower = city.wallPower || 0, now = Date.now(), config = DEFAULT_BATTLE_CONFIG }) {
    const defendingTroops = city.troops;
    const previousLevel = city.level;
    const previousOwnerId = city.ownerId;
    const attackPower = march.troops * (1 + march.attackBonus);
    const cityDefenseBonus = city.level * config.defensePerCityLevel;
    const troopDefensePower = defendingTroops * (1 + defenderBonus + cityDefenseBonus);
    const defensePower = troopDefensePower + wallPower;
    const ratio = defensePower === 0 ? Infinity : attackPower / defensePower;
    const attackerWon = ratio > 1;
    const rates = casualtyRates(ratio, config.casualtyCurve);
    const attackerLosses = Math.min(march.troops, Math.round(march.troops * rates.attacker));
    const defenderLosses = Math.min(defendingTroops, Math.round(defendingTroops * rates.defender));
    const attackerSurvivors = march.troops - attackerLosses;
    const defenderSurvivors = defendingTroops - defenderLosses;

    if (attackerWon) {
      city.ownerId = march.playerId;
      city.owner = march.playerName || march.playerId;
      city.troops = attackerSurvivors;
      city.level = Math.max(1, city.level - config.conquestLevelPenalty);
    } else {
      city.troops = defenderSurvivors;
    }

    return {
      resolvedAt: now,
      cityId: city.id,
      cityName: city.name,
      attackerId: march.playerId,
      defenderId: previousOwnerId,
      levelBefore: previousLevel,
      levelAfter: city.level,
      attackingTroops: march.troops,
      defendingTroops,
      attackPower,
      defensePower,
      attackerLosses,
      defenderLosses,
      attackerSurvivors,
      defenderSurvivors,
      result: attackerWon ? 'victory' : 'defeat',
      conquered: attackerWon
    };
  }

  function createReturnMarch({ id, failedAttack, origin, destination, departureAt = Date.now() }) {
    return {
      id,
      type: 'return',
      status: 'returning',
      originId: origin.id,
      destinationId: destination.id,
      playerId: failedAttack.attackerId,
      troops: failedAttack.attackerSurvivors,
      departureAt,
      arrivalAt: departureAt + failedAttack.travelMs,
      travelMs: failedAttack.travelMs
    };
  }

  const api = { DEFAULT_BATTLE_CONFIG, distanceBetweenCities, validateAttack, createMarch, marchProgress, casualtyRates, resolveBattle, createReturnMarch };
  globalScope.WarlordBattle = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : window));
