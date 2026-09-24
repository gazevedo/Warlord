(function initMapAssets(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordMapAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMapAssets() {
  const TERRAIN_ASSETS = Object.freeze({
    grass: 'assets/terrain/grass/terrain_grass_01.png',
    sand: 'assets/terrain/sand/terrain_sand_01.png',
    snow: 'assets/terrain/snow/terrain_snow_01.png',
    water: 'assets/terrain/water/terrain_water_01.png'
  });

  const NATURAL_RESOURCE_ASSETS = Object.freeze({
    bush: 'assets/resources/bush_01.png',
    crystal: 'assets/resources/crystal_01.png',
    lakeSmall: 'assets/resources/lake_small_01.png',
    lakeLarge: 'assets/resources/lake_large_01.png',
    rocksSmall: 'assets/resources/rocks_small_01.png',
    rocksMedium: 'assets/resources/rocks_medium_01.png',
    mountain: 'assets/resources/mountain_01.png',
    mountainSnow: 'assets/resources/mountain_snow_01.png',
    ruins: 'assets/resources/ruins_01.png',
    fallenLog: 'assets/resources/fallen_log_01.png'
  });

  const PAINTED_ASSETS = Object.freeze({
    armyBlue: 'assets/painted/army_blue.webp',
    armyRed: 'assets/painted/army_red.webp',
    bridgeStone: 'assets/painted/bridge_stone.webp',
    bridgeWood: 'assets/painted/bridge_wood.webp',
    cityBlueSmall: 'assets/painted/city_blue_small.webp',
    cityRedSmall: 'assets/painted/city_red_small.webp',
    cityNeutral: 'assets/painted/city_neutral.webp',
    cloudOne: 'assets/painted/cloud_01.webp',
    cloudTwo: 'assets/painted/cloud_02.webp',
    farmOne: 'assets/painted/farm_01.webp',
    farmTwo: 'assets/painted/farm_02.webp',
    village: 'assets/painted/village_01.webp'
  });

  const VEGETATION_BIOMES = Object.freeze(['temperate', 'pine', 'snow', 'autumn', 'dead']);
  const VEGETATION_SIZES = Object.freeze({ single: ['01', '02', '03'], small: ['11'], medium: ['21'], large: ['31'] });

  function getVegetationAsset(biome, size, variant) {
    if (!VEGETATION_BIOMES.includes(biome)) throw new Error(`Bioma de vegetação inválido: ${biome}`);
    const options = VEGETATION_SIZES[size];
    if (!options) throw new Error(`Tamanho de vegetação inválido: ${size}`);
    const requestedIndex = Number.isInteger(variant) ? Math.abs(variant) : Math.floor(Math.random() * options.length);
    const suffix = options[requestedIndex % options.length];
    return `assets/vegetation/${biome}/tree_${suffix}.png`;
  }

  function getCityMapAsset(city, levelAsset) {
    if (city.level >= 10) return levelAsset;
    if (city.ownerId === null) return PAINTED_ASSETS.cityNeutral;
    if (city.tone === 'red') return PAINTED_ASSETS.cityRedSmall;
    return PAINTED_ASSETS.cityBlueSmall;
  }

  return Object.freeze({ TERRAIN_ASSETS, NATURAL_RESOURCE_ASSETS, PAINTED_ASSETS, VEGETATION_BIOMES, VEGETATION_SIZES, getVegetationAsset, getCityMapAsset });
});
