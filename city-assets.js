(function initCityAssets(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarlordCityAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCityAssets() {
  const DEFAULT_THEME = 'blue';
  const THEMES = Object.freeze({
    blue: Object.freeze({ directory: 'city_blue' })
  });
  const LEVEL_ASSETS = Object.freeze([
    Object.freeze({ minimumLevel: 100, filename: 'city100.png' }),
    Object.freeze({ minimumLevel: 90, filename: 'city90.png' }),
    Object.freeze({ minimumLevel: 80, filename: 'city80.png' }),
    Object.freeze({ minimumLevel: 70, filename: 'city70.png' }),
    Object.freeze({ minimumLevel: 60, filename: 'city60.png' }),
    Object.freeze({ minimumLevel: 50, filename: 'city50.png' }),
    Object.freeze({ minimumLevel: 40, filename: 'city40.png' }),
    Object.freeze({ minimumLevel: 30, filename: 'city30.png' }),
    Object.freeze({ minimumLevel: 20, filename: 'city20.png' }),
    Object.freeze({ minimumLevel: 10, filename: 'city10.png' }),
    Object.freeze({ minimumLevel: 1, filename: 'city01.png' })
  ]);

  function themeFor(theme) {
    return THEMES[theme] || THEMES[DEFAULT_THEME];
  }

  function cityAssetFor(level, theme = DEFAULT_THEME) {
    const normalizedLevel = Math.max(1, Number.isFinite(Number(level)) ? Math.floor(Number(level)) : 1);
    const asset = LEVEL_ASSETS.find(({ minimumLevel }) => normalizedLevel >= minimumLevel);
    return `assets/city/${themeFor(theme).directory}/${asset.filename}`;
  }

  return Object.freeze({ DEFAULT_THEME, LEVEL_ASSETS, THEMES, cityAssetFor });
});
