(function initMapDefinition(root, factory) {
  const assets = typeof module === 'object' && module.exports ? require('./map-assets.js') : root.WarlordMapAssets;
  const api = factory(assets);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordMapDefinition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMapDefinitionApi(MapAssets) {
  const MAP_SEED = 20260925;
  const DEFAULT_MAP_SEED = MAP_SEED;
  const TILE = Object.freeze({ width: 480, height: 240, horizontalStep: 450, verticalStep: 112 });
  const LAYERS = Object.freeze({ terrain: 0, waterAndRoads: 1_000, lakes: 2_000, scenery: 3_000, cities: 10_000, armies: 20_000, effects: 30_000 });
  const BUILDABLE_TERRAINS = Object.freeze(['grass', 'sand', 'snow']);
  const LOGICAL_CELL_SIZE = 180;
  const MOVEMENT_COST = Object.freeze({ grass: 1, sand: 1.35, snow: 1.6, water: Infinity });

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) | 0;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function noiseHash(x, y, seed = MAP_SEED) {
    let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  }

  function coherentNoise(x, y, seed = MAP_SEED) {
    const left = Math.floor(x);
    const top = Math.floor(y);
    const smoothX = (x - left) ** 2 * (3 - (2 * (x - left)));
    const smoothY = (y - top) ** 2 * (3 - (2 * (y - top)));
    const north = noiseHash(left, top, seed) + ((noiseHash(left + 1, top, seed) - noiseHash(left, top, seed)) * smoothX);
    const south = noiseHash(left, top + 1, seed) + ((noiseHash(left + 1, top + 1, seed) - noiseHash(left, top + 1, seed)) * smoothX);
    return north + ((south - north) * smoothY);
  }

  function fractalNoise(x, y, seed = MAP_SEED) {
    let value = 0;
    let amplitude = 0.58;
    let totalAmplitude = 0;
    for (let octave = 0; octave < 4; octave += 1) {
      value += coherentNoise(x, y, seed + (octave * 1013)) * amplitude;
      totalAmplitude += amplitude;
      x *= 2;
      y *= 2;
      amplitude *= 0.5;
    }
    return value / totalAmplitude;
  }

  function biomeSampleAt(x, y, width, height, seed = MAP_SEED) {
    const normalizedX = x / width;
    const normalizedY = y / height;
    const terrainNoise = fractalNoise(normalizedX * 4.2, normalizedY * 4.2, seed);
    const climateNoise = fractalNoise((normalizedX * 3.1) + 17, (normalizedY * 3.1) - 9, seed + 71);
    const riverCenter = 0.54 + (Math.sin((normalizedY * Math.PI * 2) + (terrainNoise * 1.8)) * 0.055);
    const riverDistance = Math.abs(normalizedX - riverCenter);
    const lakeDistance = Math.hypot(normalizedX - 0.27, normalizedY - 0.7);
    const riverDepression = Math.max(0, 1 - (riverDistance / 0.075)) * 0.48;
    const lakeDepression = Math.max(0, 1 - (lakeDistance / 0.14)) * 0.5;
    const elevation = 0.54 + ((terrainNoise - 0.5) * 0.34) - Math.max(riverDepression, lakeDepression);
    const temperature = 0.84 - (normalizedX * 0.64) - (normalizedY * 0.05) + ((climateNoise - 0.5) * 0.16);
    const shore = elevation < 0.34;
    const moisture = shore ? 0.18 : 0.38 + (climateNoise * 0.42);
    return Object.freeze({ elevation, moisture, temperature });
  }

  function selectBiome(sample) {
    if (sample.elevation < 0.25) return 'water';
    if (sample.temperature < 0.3) return 'snow';
    if (sample.moisture < 0.25) return 'sand';
    return 'grass';
  }

  function terrainBiomeAt(x, y, width, height, seed = MAP_SEED) {
    return selectBiome(biomeSampleAt(x, y, width, height, seed));
  }

  function createLogicalCells(width, height) {
    const rows = Math.ceil(height / LOGICAL_CELL_SIZE);
    const columns = Math.ceil(width / LOGICAL_CELL_SIZE);
    const cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = Math.min(width, (column + 0.5) * LOGICAL_CELL_SIZE);
        const y = Math.min(height, (row + 0.5) * LOGICAL_CELL_SIZE);
        const biome = terrainBiomeAt(x, y, width, height);
        cells.push(Object.freeze({ row, column, biome, movementCost: MOVEMENT_COST[biome], blocked: biome === 'water' }));
      }
    }
    let smoothed = cells;
    for (let pass = 0; pass < 2; pass += 1) {
      const byCoordinate = new Map(smoothed.map((cell) => [`${cell.row}:${cell.column}`, cell]));
      smoothed = smoothed.map((cell) => {
        const neighbors = [];
        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
          for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
            if (rowOffset === 0 && columnOffset === 0) continue;
            const neighbor = byCoordinate.get(`${cell.row + rowOffset}:${cell.column + columnOffset}`);
            if (neighbor) neighbors.push(neighbor);
          }
        }
        const counts = neighbors.reduce((result, neighbor) => ({ ...result, [neighbor.biome]: (result[neighbor.biome] || 0) + 1 }), {});
        const [majority, count] = Object.entries(counts).sort((first, second) => second[1] - first[1])[0] || [cell.biome, 0];
        const isolated = !neighbors.some((neighbor) => neighbor.biome === cell.biome);
        const biome = count >= 5 || isolated ? majority : cell.biome;
        return Object.freeze({ ...cell, biome, movementCost: MOVEMENT_COST[biome], blocked: biome === 'water' });
      });
    }
    return Object.freeze(smoothed);
  }

  function rectanglesOverlap(first, second, padding = 0) {
    return first.x - padding < second.x + second.width && first.x + first.width + padding > second.x && first.y - padding < second.y + second.height && first.y + first.height + padding > second.y;
  }

  function cityBounds(cities, width, height) {
    return cities.map((city) => ({ x: ((city.x / 100) * width) - 90, y: ((city.y / 100) * height) - 75, width: 180, height: 155 }));
  }

  function isBuildableCityPosition(x, y, width, height) {
    const samples = [
      [0, 0], [-72, -48], [72, -48], [-72, 62], [72, 62]
    ];
    return samples.every(([offsetX, offsetY]) => BUILDABLE_TERRAINS.includes(terrainBiomeAt(x + offsetX, y + offsetY, width, height)));
  }

  function placeCitiesOnBuildableTerrain(cities, width, height) {
    const occupied = [];
    return cities.map((city) => {
      const origin = { x: (city.x / 100) * width, y: (city.y / 100) * height };
      let position;
      for (let attempt = 0; attempt < 160; attempt += 1) {
        const ring = Math.ceil(attempt / 12);
        const angle = ((attempt % 12) / 12) * Math.PI * 2;
        const radius = ring * 95;
        const candidate = {
          x: Math.round(origin.x + (Math.cos(angle) * radius)),
          y: Math.round(origin.y + (Math.sin(angle) * radius))
        };
        const bounds = { x: candidate.x - 90, y: candidate.y - 75, width: 180, height: 155 };
        const insideMap = bounds.x >= 18 && bounds.y >= 18 && bounds.x + bounds.width <= width - 18 && bounds.y + bounds.height <= height - 18;
        if (insideMap && isBuildableCityPosition(candidate.x, candidate.y, width, height) && !occupied.some((entry) => rectanglesOverlap(bounds, entry))) {
          position = candidate;
          occupied.push(bounds);
          break;
        }
      }
      if (!position) throw new Error(`Não foi possível posicionar a cidade ${city.id} em terreno edificável.`);
      return { ...city, x: Number(((position.x / width) * 100).toFixed(3)), y: Number(((position.y / height) * 100).toFixed(3)) };
    });
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
    const logicalCells = createLogicalCells(width, height);
    const scenery = createSceneryObjects(width, height, cities, seed);
    return { width, height, seed, logicalCells, objects: scenery };
  }

  return Object.freeze({ MAP_SEED, DEFAULT_MAP_SEED, TILE, LAYERS, BUILDABLE_TERRAINS, LOGICAL_CELL_SIZE, MOVEMENT_COST, seededRandom, coherentNoise, fractalNoise, biomeSampleAt, selectBiome, terrainBiomeAt, rectanglesOverlap, isBuildableCityPosition, placeCitiesOnBuildableTerrain, createLogicalCells, createSceneryObjects, createMapDefinition });
});
