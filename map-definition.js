(function initMapDefinition(root, factory) {
  const assets = typeof module === 'object' && module.exports ? require('./map-assets.js') : root.WarlordMapAssets;
  const api = factory(assets);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordMapDefinition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMapDefinitionApi(MapAssets) {
  const DEFAULT_MAP_SEED = 20260924;
  const TILE = Object.freeze({ width: 480, height: 240, horizontalStep: 450, verticalStep: 112 });
  const LAYERS = Object.freeze({ terrain: 0, waterAndRoads: 1_000, lakes: 2_000, scenery: 3_000, cities: 10_000, armies: 20_000, effects: 30_000 });

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) | 0;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function terrainBiomeAt(x, y, width, height) {
    const normalizedX = x / width;
    const normalizedY = y / height;
    const riverCenter = 0.54 + (Math.sin(normalizedY * Math.PI * 2) * 0.055);
    const riverDistance = Math.abs(normalizedX - riverCenter);
    const lakeDistance = Math.hypot(normalizedX - 0.27, normalizedY - 0.7);
    if (riverDistance < 0.04 || lakeDistance < 0.08) return 'water';
    if (riverDistance < 0.085 || lakeDistance < 0.13) return 'sand';
    if (normalizedX > 0.64 && normalizedY < 0.48) return 'snow';
    return 'grass';
  }

  function createTerrainObjects(width, height) {
    const rows = Math.ceil(height / TILE.verticalStep) + 2;
    const columns = Math.ceil(width / TILE.horizontalStep) + 2;
    const objects = [];
    for (let row = 0; row < rows; row += 1) {
      const offsetX = row % 2 === 0 ? 0 : -(TILE.horizontalStep / 2);
      for (let column = -1; column < columns; column += 1) {
        const x = offsetX + (column * TILE.horizontalStep);
        const y = (row * TILE.verticalStep) - TILE.verticalStep;
        const biome = terrainBiomeAt(x + (TILE.width / 2), y + (TILE.height / 2), width, height);
        objects.push({ id: `terrain-${row}-${column + 1}`, type: 'terrain', asset: MapAssets.TERRAIN_ASSETS[biome], x, y, width: TILE.width, height: TILE.height, zIndex: LAYERS.terrain + Math.floor(y), biome });
      }
    }
    return objects;
  }

  function rectanglesOverlap(first, second, padding = 0) {
    return first.x - padding < second.x + second.width && first.x + first.width + padding > second.x && first.y - padding < second.y + second.height && first.y + first.height + padding > second.y;
  }

  function cityBounds(cities, width, height) {
    return cities.map((city) => ({ x: ((city.x / 100) * width) - 90, y: ((city.y / 100) * height) - 75, width: 180, height: 155 }));
  }

  const SCENERY = Object.freeze([
    ['lake-large', 'lake', 'lakeLarge', 0.09, 0.12, 225, 155, 'grass'],
    ['lake-small', 'lake', 'lakeSmall', 0.28, 0.1, 175, 125, 'sand'],
    ['mountain-snow-a', 'resource', 'mountainSnow', 0.81, 0.11, 220, 220, 'snow'],
    ['mountain-a', 'resource', 'mountain', 0.5, 0.12, 230, 230, 'grass'],
    ['mountain-b', 'resource', 'mountain', 0.6, 0.95, 200, 205, 'grass'],
    ['mountain-snow-b', 'resource', 'mountainSnow', 0.82, 0.95, 205, 215, 'snow'],
    ['crystal-a', 'resource', 'crystal', 0.08, 0.78, 115, 110, 'grass'],
    ['crystal-b', 'resource', 'crystal', 0.71, 0.61, 105, 100, 'grass'],
    ['rocks-a', 'resource', 'rocksMedium', 0.39, 0.78, 140, 110, 'grass'],
    ['rocks-b', 'resource', 'rocksSmall', 0.9, 0.67, 115, 90, 'snow'],
    ['ruins-a', 'resource', 'ruins', 0.14, 0.42, 150, 140, 'grass'],
    ['log-a', 'resource', 'fallenLog', 0.34, 0.88, 145, 105, 'grass'],
    ['bush-a', 'resource', 'bush', 0.05, 0.28, 100, 95, 'grass'],
    ['bush-b', 'resource', 'bush', 0.44, 0.58, 90, 85, 'sand'],
    ['farm-a', 'painted', 'farmOne', 0.3, 0.36, 150, 120, 'grass'],
    ['farm-b', 'painted', 'farmTwo', 0.72, 0.78, 145, 115, 'grass'],
    ['village-a', 'painted', 'village', 0.11, 0.58, 150, 135, 'grass'],
    ['bridge-a', 'painted', 'bridgeWood', 0.54, 0.1, 120, 66, 'water']
  ]);

  const VEGETATION_ZONES = Object.freeze([
    ['forest-temperate-large', 'temperate', 'large', 0, 0.09, 0.22, 250, 205],
    ['forest-pine-large', 'pine', 'large', 0, 0.91, 0.72, 250, 210],
    ['forest-snow-large', 'snow', 'large', 0, 0.82, 0.2, 245, 210],
    ['forest-autumn-medium', 'autumn', 'medium', 0, 0.23, 0.86, 210, 165],
    ['forest-dead-medium', 'dead', 'medium', 0, 0.92, 0.5, 205, 170],
    ['forest-temperate-medium', 'temperate', 'medium', 0, 0.35, 0.15, 205, 165],
    ['forest-pine-small', 'pine', 'small', 0, 0.61, 0.75, 155, 145],
    ['forest-temperate-small', 'temperate', 'small', 0, 0.18, 0.32, 150, 140],
    ['forest-snow-small', 'snow', 'small', 0, 0.74, 0.42, 150, 140],
    ['tree-temperate-west', 'temperate', 'single', 1, 0.03, 0.52, 100, 115],
    ['tree-autumn-south', 'autumn', 'single', 2, 0.48, 0.94, 100, 110],
    ['tree-pine-east', 'pine', 'single', 0, 0.96, 0.82, 95, 120],
    ['tree-snow-north', 'snow', 'single', 2, 0.67, 0.06, 95, 115]
  ]);

  function createSceneryObjects(width, height, cities, seed) {
    const random = seededRandom(seed);
    const occupied = cityBounds(cities, width, height);
    const objects = [];
    const candidates = [
      ...SCENERY.map(([id, type, key, nx, ny, objectWidth, objectHeight, biome]) => ({ id, type, asset: type === 'painted' ? MapAssets.PAINTED_ASSETS[key] : MapAssets.NATURAL_RESOURCE_ASSETS[key], nx, ny, width: objectWidth, height: objectHeight, biome, blocking: type === 'lake' || key.startsWith('mountain') })),
      ...VEGETATION_ZONES.map(([id, biome, size, variant, nx, ny, objectWidth, objectHeight]) => ({ id, type: 'vegetation', asset: MapAssets.getVegetationAsset(biome, size, variant), nx, ny, width: objectWidth, height: objectHeight, biome, blocking: size === 'large' || size === 'medium' }))
    ];

    candidates.forEach((candidate) => {
      const originX = (candidate.nx * width) - (candidate.width / 2);
      const originY = (candidate.ny * height) - candidate.height;
      let position;
      for (let attempt = 0; attempt < 14; attempt += 1) {
        const distance = attempt === 0 ? 0 : 70 + (Math.floor((attempt - 1) / 4) * 75);
        const angle = (attempt * 2.399963) + (random() * 0.22);
        const bounds = {
          x: Math.round(originX + (Math.cos(angle) * distance) + ((random() - 0.5) * 24)),
          y: Math.round(originY + (Math.sin(angle) * distance * 0.62) + ((random() - 0.5) * 18)),
          width: candidate.width,
          height: candidate.height
        };
        const insideMap = bounds.x >= 18 && bounds.y >= 18 && bounds.x + bounds.width <= width - 18 && bounds.y + bounds.height <= height - 18;
        if (insideMap && !occupied.some((entry) => rectanglesOverlap(bounds, entry, candidate.blocking ? 28 : 8))) {
          position = bounds;
          break;
        }
      }
      if (!position) return;
      const object = { ...candidate, x: position.x, y: position.y };
      delete object.nx;
      delete object.ny;
      object.zIndex = (object.type === 'lake' ? LAYERS.lakes : LAYERS.scenery) + Math.floor(object.y + object.height);
      objects.push(object);
      if (candidate.blocking) occupied.push(position);
    });
    return objects;
  }

  function createMapDefinition({ width, height, cities = [], seed = DEFAULT_MAP_SEED }) {
    const terrain = createTerrainObjects(width, height);
    const scenery = createSceneryObjects(width, height, cities, seed);
    return { width, height, seed, objects: [...terrain, ...scenery] };
  }

  return Object.freeze({ DEFAULT_MAP_SEED, TILE, LAYERS, seededRandom, terrainBiomeAt, rectanglesOverlap, createTerrainObjects, createSceneryObjects, createMapDefinition });
});
