(function initTerrainRenderer(root, factory) {
  const assets = typeof module === 'object' && module.exports ? require('./map-assets.js') : root.WarlordMapAssets;
  const mapDefinition = typeof module === 'object' && module.exports ? require('./map-definition.js') : root.WarlordMapDefinition;
  const api = factory(assets, mapDefinition);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordTerrainRenderer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createTerrainRenderer(MapAssets, MapDefinition) {
  const MAX_RENDER_WIDTH = 2400;

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  const BIOME_BASE_COLORS = Object.freeze({ grass: '#6f9b61', sand: '#d7bd72', snow: '#c8d5d1', water: '#4389ad' });

  function tileTexture(context, image, width, height, biome) {
    const source = { x: image.width * 0.31, y: image.height * 0.28, width: image.width * 0.38, height: image.height * 0.44 };
    const tileWidth = 360;
    const tileHeight = 190;
    context.fillStyle = BIOME_BASE_COLORS[biome];
    context.fillRect(0, 0, width, height);
    context.save();
    context.globalAlpha = 0.32;
    for (let y = -tileHeight; y < height + tileHeight; y += tileHeight - 1) {
      const offset = (Math.floor(y / tileHeight) % 2) * (tileWidth / 2);
      for (let x = -tileWidth; x < width + tileWidth; x += tileWidth - 1) {
        context.drawImage(image, source.x, source.y, source.width, source.height, x + offset, y, tileWidth + 2, tileHeight + 2);
      }
    }
    context.restore();
  }

  function biomeMask(context, biome, width, height) {
    const maskScale = 4;
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(width / maskScale);
    mask.height = Math.ceil(height / maskScale);
    const maskContext = mask.getContext('2d');
    const pixels = maskContext.createImageData(mask.width, mask.height);
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        if (MapDefinition.terrainBiomeAt(x, y, mask.width, mask.height) !== biome) continue;
        pixels.data[((y * mask.width) + x) * 4 + 3] = 255;
      }
    }
    maskContext.putImageData(pixels, 0, 0);
    context.drawImage(mask, 0, 0, width, height);
  }

  function paintBiome(target, image, biome, width, height, blur) {
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const layerContext = layer.getContext('2d');
    tileTexture(layerContext, image, width, height, biome);
    layerContext.globalCompositeOperation = 'destination-in';
    layerContext.filter = `blur(${blur}px)`;
    biomeMask(layerContext, biome, width, height);
    layerContext.filter = 'none';
    target.drawImage(layer, 0, 0);
  }

  async function renderContinuousTerrain(canvas, definition) {
    const scale = Math.min(1, MAX_RENDER_WIDTH / definition.width);
    canvas.width = Math.round(definition.width * scale);
    canvas.height = Math.round(definition.height * scale);
    const context = canvas.getContext('2d');
    const entries = await Promise.all(Object.entries(MapAssets.TERRAIN_ASSETS).map(async ([biome, source]) => [biome, await loadImage(source)]));
    const images = Object.fromEntries(entries);
    tileTexture(context, images.grass, canvas.width, canvas.height, 'grass');
    const blur = Math.max(12, canvas.width * 0.008);
    paintBiome(context, images.snow, 'snow', canvas.width, canvas.height, blur);
    paintBiome(context, images.sand, 'sand', canvas.width, canvas.height, blur);
    paintBiome(context, images.water, 'water', canvas.width, canvas.height, blur * 0.65);
  }

  return Object.freeze({ MAX_RENDER_WIDTH, renderContinuousTerrain });
});
