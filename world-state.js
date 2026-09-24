(function initWorldState(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordWorld = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createWorldState() {
  const PLAYER_ID = 'player';
  const STARTING_CITIES_PER_PLAYER = 5;
  const DEFAULT_BOT_COUNT = 6;
  const NEUTRAL_CITIES_PER_PLAYER = 2;
  const CLUSTER_WIDTH = 700;
  const CLUSTER_HEIGHT = 620;
  const MAP_PADDING = 360;
  const MINIMUM_COLUMNS = 3;
  const TERRAIN_TILE = Object.freeze({ asset: 'assets/map/terrain/terrain_grass_01.png', width: 720, height: 360, horizontalStep: 680, verticalStep: 170 });

  const BOT_PROFILES = Object.freeze([
    { id: 'bot-north', name: 'Astrid', alliance: 'Clã do Norte', tone: 'red' },
    { id: 'bot-green', name: 'Cedric', alliance: 'Folha de Ferro', tone: 'green' },
    { id: 'bot-gold', name: 'Helena', alliance: 'Império Dourado', tone: 'gold' },
    { id: 'bot-raven', name: 'Raven', alliance: 'Guardiões', tone: 'blue' },
    { id: 'bot-ember', name: 'Kael', alliance: 'Chama Rubra', tone: 'red' },
    { id: 'bot-tide', name: 'Mira', alliance: 'Maré Alta', tone: 'green' }
  ]);

  const CAPITAL_NAMES = Object.freeze(['Aurora', 'Pedra Alta', 'Vale Verde', 'Forte do Sol', 'Ravenna', 'Brasa Real', 'Porto da Lua']);
  const VILLAGE_SUFFIXES = Object.freeze(['Norte', 'Leste', 'Sul', 'Oeste']);
  const CITY_OFFSETS = Object.freeze([
    Object.freeze({ x: 0, y: 0 }),
    Object.freeze({ x: -170, y: -115 }),
    Object.freeze({ x: 170, y: -115 }),
    Object.freeze({ x: -170, y: 135 }),
    Object.freeze({ x: 170, y: 135 })
  ]);

  function createPlayers(botCount = DEFAULT_BOT_COUNT) {
    const player = { id: PLAYER_ID, name: 'Lord Azevedo', alliance: 'Valoria', tone: 'blue', theme: 'blue', bot: false };
    const bots = Array.from({ length: botCount }, (_, index) => {
      const profile = BOT_PROFILES[index % BOT_PROFILES.length];
      const cycle = Math.floor(index / BOT_PROFILES.length);
      return { ...profile, id: cycle ? `${profile.id}-${cycle + 1}` : profile.id, name: cycle ? `${profile.name} ${cycle + 1}` : profile.name, theme: 'blue', bot: true };
    });
    return [player, ...bots];
  }

  function mapDimensions(playerCount) {
    const columns = Math.max(MINIMUM_COLUMNS, Math.ceil(Math.sqrt(playerCount)));
    const rows = Math.ceil(playerCount / columns);
    return {
      columns,
      rows,
      width: (columns * CLUSTER_WIDTH) + MAP_PADDING,
      height: (rows * CLUSTER_HEIGHT) + MAP_PADDING
    };
  }

  function percent(value, total) {
    return Number(((value / total) * 100).toFixed(3));
  }

  function createTerrainTiles(dimensions, tile = TERRAIN_TILE) {
    const rows = Math.ceil(dimensions.height / tile.verticalStep) + 2;
    const columns = Math.ceil(dimensions.width / tile.horizontalStep) + 2;
    const tiles = [];

    for (let row = 0; row < rows; row += 1) {
      const offsetX = row % 2 === 0 ? 0 : -(tile.horizontalStep / 2);
      for (let column = -1; column < columns; column += 1) {
        tiles.push({
          id: `terrain-${row}-${column + 1}`,
          asset: tile.asset,
          x: offsetX + (column * tile.horizontalStep),
          y: (row * tile.verticalStep) - tile.verticalStep,
          width: tile.width,
          height: tile.height
        });
      }
    }
    return tiles;
  }

  function createOwnedCities(players, dimensions) {
    const centerSlot = (Math.floor(dimensions.rows / 2) * dimensions.columns) + Math.floor(dimensions.columns / 2);
    const availableSlots = Array.from({ length: dimensions.columns * dimensions.rows }, (_, index) => index).filter((index) => index !== centerSlot);
    return players.flatMap((player, playerIndex) => {
      const slot = playerIndex === 0 ? centerSlot : availableSlots[playerIndex - 1];
      const column = slot % dimensions.columns;
      const row = Math.floor(slot / dimensions.columns);
      const centerX = (MAP_PADDING / 2) + (column * CLUSTER_WIDTH) + (CLUSTER_WIDTH / 2);
      const centerY = (MAP_PADDING / 2) + (row * CLUSTER_HEIGHT) + (CLUSTER_HEIGHT / 2);
      const capitalName = CAPITAL_NAMES[playerIndex % CAPITAL_NAMES.length];

      return CITY_OFFSETS.map((offset, cityIndex) => ({
        id: `${player.id}-city-${cityIndex + 1}`,
        name: cityIndex === 0 ? capitalName : `${capitalName} ${VILLAGE_SUFFIXES[cityIndex - 1]}`,
        level: 1,
        owner: player.name,
        ownerId: player.id,
        alliance: player.alliance,
        theme: player.theme,
        tone: player.tone,
        bot: player.bot,
        isCapital: cityIndex === 0,
        troops: cityIndex === 0 ? 2_500 : 1_000,
        attackBonus: 0,
        defenseBonus: 0,
        wallPower: cityIndex === 0 ? 1_000 : 500,
        x: percent(centerX + offset.x, dimensions.width),
        y: percent(centerY + offset.y, dimensions.height)
      }));
    });
  }

  function perimeterPoint(index, count, dimensions) {
    const progress = ((index + 0.5) / count) * 4;
    const insetX = 125;
    const insetY = 115;
    const left = insetX;
    const right = dimensions.width - insetX;
    const top = insetY;
    const bottom = dimensions.height - insetY;

    if (progress < 1) return { x: left + ((right - left) * progress), y: top };
    if (progress < 2) return { x: right, y: top + ((bottom - top) * (progress - 1)) };
    if (progress < 3) return { x: right - ((right - left) * (progress - 2)), y: bottom };
    return { x: left, y: bottom - ((bottom - top) * (progress - 3)) };
  }

  function createNeutralCities(playerCount, dimensions) {
    const count = Math.max(8, playerCount * NEUTRAL_CITIES_PER_PLAYER);
    return Array.from({ length: count }, (_, index) => {
      const position = perimeterPoint(index, count, dimensions);
      return {
        id: `neutral-city-${index + 1}`,
        name: `Vila Neutra ${String(index + 1).padStart(2, '0')}`,
        level: 1,
        owner: 'Terras livres',
        ownerId: null,
        alliance: null,
        theme: 'blue',
        tone: 'neutral',
        bot: false,
        isCapital: false,
        troops: 600,
        attackBonus: 0,
        defenseBonus: 0,
        wallPower: 250,
        x: percent(position.x, dimensions.width),
        y: percent(position.y, dimensions.height)
      };
    });
  }

  function createInitialWorld({ botCount = DEFAULT_BOT_COUNT } = {}) {
    const players = createPlayers(botCount);
    const dimensions = mapDimensions(players.length);
    const cities = [...createOwnedCities(players, dimensions), ...createNeutralCities(players.length, dimensions)];
    const terrain = { type: 'grass', tiles: createTerrainTiles(dimensions) };
    return { players, cities, dimensions, terrain };
  }

  function moveCapital(cities, playerId, destinationId) {
    const destination = cities.find((city) => city.id === destinationId);
    if (!destination || destination.ownerId !== playerId) return false;
    cities.forEach((city) => {
      if (city.ownerId === playerId) city.isCapital = city.id === destinationId;
    });
    return true;
  }

  return Object.freeze({
    PLAYER_ID,
    STARTING_CITIES_PER_PLAYER,
    DEFAULT_BOT_COUNT,
    NEUTRAL_CITIES_PER_PLAYER,
    TERRAIN_TILE,
    createPlayers,
    mapDimensions,
    createTerrainTiles,
    createInitialWorld,
    moveCapital
  });
});
