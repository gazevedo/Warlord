const PLAYER_ID = WarlordWorld.PLAYER_ID;
const battleConfig = WarlordBattle.DEFAULT_BATTLE_CONFIG;
const gameWorld = WarlordWorld.createInitialWorld({ botCount: 6 });
const cities = gameWorld.cities;

const world = document.querySelector('#world');
const viewport = document.querySelector('#world-viewport');
const cityLayer = document.querySelector('#cities');
const marchLayer = document.querySelector('#marches');
const panel = document.querySelector('#city-panel');
const toast = document.querySelector('#toast');
const hint = document.querySelector('#map-hint');
const attackDialog = document.querySelector('#attack-dialog');
const reportDialog = document.querySelector('#battle-report');
world.style.setProperty('--world-width', `${gameWorld.dimensions.width}px`);
world.style.setProperty('--world-height', `${gameWorld.dimensions.height}px`);

const initialView = () => ({
  x: 0,
  y: 20,
  scale: Math.min(1.35, Math.max(0.68, window.innerWidth / 1600, window.innerHeight / 1200) + 0.04)
});
let view = initialView();
let drag = null;
let selectedCity = null;
let originCity = null;
let marches = [];
let toastTimer;

function castleMarkup(city) {
  const asset = WarlordCityAssets.cityAssetFor(city.level, city.theme);
  return `
    <button class="city tone-${city.tone}${city.isCapital ? ' capital' : ''}" data-city="${city.id}" style="--x:${city.x}%;--y:${city.y}%" aria-label="${city.name}, nível ${city.level}${city.isCapital ? ', centro protegido' : ''}">
      <span class="selection-ring"></span>
      ${city.isCapital ? '<span class="capital-mark" title="Centro protegido">♛</span>' : ''}
      <span class="city-label"><strong>${city.name}</strong><small><b>${city.level}</b> ${city.owner}</small></span>
      <img class="castle-art" src="${asset}" alt="" aria-hidden="true">
    </button>`;
}

cityLayer.innerHTML = cities.map(castleMarkup).join('');

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function renderMarches(now = Date.now()) {
  marchLayer.innerHTML = marches.map((march) => {
    const from = cities.find((city) => city.id === march.originId);
    const to = cities.find((city) => city.id === march.destinationId);
    const progress = WarlordBattle.marchProgress(march, now);
    const x = from.x + ((to.x - from.x) * progress);
    const y = from.y + ((to.y - from.y) * progress);
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const length = WarlordBattle.distanceBetweenCities(from, to);
    const hostile = march.playerId !== PLAYER_ID;
    return `<div class="march ${hostile ? 'hostile' : 'friendly'}" style="--from-x:${from.x}%;--from-y:${from.y}%;--army-x:${x}%;--army-y:${y}%;--route-length:${length}%;--route-angle:${angle}deg" aria-label="${hostile ? 'Ataque inimigo' : 'Exército aliado'}, ${formatTroops(march.troops)} tropas, ${formatDuration(march.arrivalAt - now)} restantes">
      <span class="march-path"></span><span class="army"><img src="assets/map/painted/army_${hostile ? 'red' : 'blue'}.webp" alt=""><i>${formatTroops(march.troops)}</i></span><span class="march-time">${formatDuration(march.arrivalAt - now)}</span>
    </div>`;
  }).join('');
}

function applyView() {
  world.style.setProperty('--pan-x', `${view.x}px`);
  world.style.setProperty('--pan-y', `${view.y}px`);
  world.style.setProperty('--zoom', view.scale);
}

function clampView() {
  view.scale = Math.min(1.8, Math.max(0.55, view.scale));
  const horizontalLimit = Math.max(0, ((world.offsetWidth * view.scale) - viewport.clientWidth) / 2);
  const verticalLimit = Math.max(0, ((world.offsetHeight * view.scale) - viewport.clientHeight) / 2);
  view.x = Math.min(horizontalLimit, Math.max(-horizontalLimit, view.x));
  view.y = Math.min(verticalLimit, Math.max(-verticalLimit, view.y));
}

function setZoom(delta) {
  view.scale += delta;
  clampView();
  applyView();
}

function formatTroops(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function selectCity(id) {
  const city = cities.find((item) => item.id === id);
  if (!city) return;
  selectedCity = city;
  document.querySelectorAll('.city').forEach((element) => element.classList.toggle('selected', element.dataset.city === id));
  document.querySelector('#panel-name').textContent = city.name;
  document.querySelector('#panel-owner').textContent = city.owner;
  document.querySelector('#panel-level').textContent = `Nível ${city.level}`;
  document.querySelector('#panel-troops').textContent = `${formatTroops(city.troops)} tropas`;
  document.querySelector('#panel-crest').className = `city-crest tone-${city.tone}`;
  const ownCity = city.ownerId === PLAYER_ID;
  const capitalAction = document.querySelector('#capital-action');
  capitalAction.hidden = !ownCity;
  capitalAction.disabled = city.isCapital;
  document.querySelector('#capital-label').textContent = city.isCapital ? 'Centro atual' : 'Mover centro';
  document.querySelector('#attack-label').textContent = ownCity ? (originCity?.id === city.id ? 'Origem pronta' : 'Mobilizar') : 'Atacar';
  document.querySelector('#attack-action').disabled = (city.isCapital && !ownCity) || (ownCity && originCity?.id === city.id);
  panel.classList.add('visible');
  panel.setAttribute('aria-hidden', 'false');
  hint.classList.add('hidden');
}

function refreshCities() {
  cityLayer.innerHTML = cities.map(castleMarkup).join('');
  if (selectedCity) selectCity(selectedCity.id);
}

function closePanel() {
  selectedCity = null;
  document.querySelectorAll('.city').forEach((element) => element.classList.remove('selected'));
  panel.classList.remove('visible');
  panel.setAttribute('aria-hidden', 'true');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

cityLayer.addEventListener('click', (event) => {
  const city = event.target.closest('.city');
  if (city && !drag?.moved) selectCity(city.dataset.city);
});

viewport.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  drag = { startX: event.clientX, startY: event.clientY, worldX: view.x, worldY: view.y, moved: false };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging');
});

viewport.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  drag.moved ||= Math.abs(dx) + Math.abs(dy) > 5;
  view.x = drag.worldX + dx;
  view.y = drag.worldY + dy;
  clampView();
  applyView();
});

function endDrag() {
  drag = null;
  viewport.classList.remove('dragging');
}

viewport.addEventListener('pointerup', endDrag);
viewport.addEventListener('pointercancel', endDrag);
viewport.addEventListener('wheel', (event) => {
  event.preventDefault();
  setZoom(event.deltaY > 0 ? -0.08 : 0.08);
}, { passive: false });

document.querySelector('#zoom-in').addEventListener('click', () => setZoom(0.12));
document.querySelector('#zoom-out').addEventListener('click', () => setZoom(-0.12));
document.querySelector('#recenter').addEventListener('click', () => {
  view = initialView();
  applyView();
  showToast('Mapa centralizado');
});
window.addEventListener('resize', () => {
  clampView();
  applyView();
});
document.querySelector('#close-panel').addEventListener('click', closePanel);
document.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action}: ${selectedCity?.name ?? ''}`)));

document.querySelector('#capital-action').addEventListener('click', () => {
  if (!selectedCity || !WarlordWorld.moveCapital(cities, PLAYER_ID, selectedCity.id)) return;
  showToast(`${selectedCity.name} agora é o centro do reino`);
  refreshCities();
});

document.querySelector('#attack-action').addEventListener('click', () => {
  if (!selectedCity) return;
  if (selectedCity.isCapital && selectedCity.ownerId !== PLAYER_ID) {
    showToast('O centro de um reino não pode ser tomado');
    return;
  }
  if (selectedCity.ownerId === PLAYER_ID) {
    originCity = selectedCity;
    showToast(`${selectedCity.name} definida como origem`);
    selectCity(selectedCity.id);
    return;
  }
  if (!originCity || originCity.ownerId !== PLAYER_ID) {
    showToast('Selecione primeiro uma cidade própria');
    return;
  }
  const distance = WarlordBattle.distanceBetweenCities(originCity, selectedCity);
  const duration = (distance / battleConfig.armySpeed) * 60_000;
  document.querySelector('#attack-origin').textContent = originCity.name;
  document.querySelector('#attack-target').textContent = selectedCity.name;
  document.querySelector('#attack-distance').textContent = `${distance.toFixed(1)} km`;
  document.querySelector('#attack-duration').textContent = formatDuration(duration);
  document.querySelector('#attack-troops').value = Math.max(1, Math.floor(originCity.troops / 2));
  document.querySelector('#attack-troops').max = originCity.troops;
  document.querySelector('#attack-error').textContent = '';
  attackDialog.showModal();
});

document.querySelector('#attack-max').addEventListener('click', () => {
  document.querySelector('#attack-troops').value = originCity?.troops ?? 0;
});

document.querySelector('#attack-form').addEventListener('submit', (event) => {
  if (event.submitter?.value !== 'confirm') return;
  event.preventDefault();
  const target = selectedCity;
  const troops = Number(document.querySelector('#attack-troops').value);
  const errors = WarlordBattle.validateAttack({ origin: originCity, destination: target, troops, playerId: PLAYER_ID });
  if (errors.length) {
    document.querySelector('#attack-error').textContent = errors[0];
    return;
  }
  const march = WarlordBattle.createMarch({ id: `march-${Date.now()}`, origin: originCity, destination: target, troops, playerId: PLAYER_ID, attackBonus: originCity.attackBonus, config: battleConfig });
  march.playerName = 'Lord Azevedo';
  marches.push(march);
  attackDialog.close();
  refreshCities();
  renderMarches();
  showToast(`${formatTroops(troops)} tropas iniciaram a marcha`);
});

function showBattleReport(report) {
  document.querySelector('#report-result').textContent = report.result === 'victory' ? 'VITÓRIA' : 'DERROTA';
  document.querySelector('#report-result').className = report.result;
  document.querySelector('#report-content').innerHTML = `
    <p><b>${report.cityName}</b>${report.levelBefore !== report.levelAfter ? ` · Lv.${report.levelBefore} → Lv.${report.levelAfter}` : ` · Lv.${report.levelBefore}`}</p>
    <dl><dt>Poder de ataque</dt><dd>${formatTroops(Math.round(report.attackPower))}</dd><dt>Poder de defesa</dt><dd>${formatTroops(Math.round(report.defensePower))}</dd><dt>Baixas atacantes</dt><dd>−${formatTroops(report.attackerLosses)}</dd><dt>Baixas defensoras</dt><dd>−${formatTroops(report.defenderLosses)}</dd><dt>Sobreviventes</dt><dd>${formatTroops(report.result === 'victory' ? report.attackerSurvivors : report.defenderSurvivors)}</dd></dl>
    <strong>${report.conquered ? 'Cidade conquistada' : 'Cidade defendida'}</strong>`;
  reportDialog.showModal();
}

function processArrivals(now = Date.now()) {
  const arrived = marches.filter((march) => march.status === 'outbound' && march.arrivalAt <= now).sort((a, b) => a.arrivalAt - b.arrivalAt || a.id.localeCompare(b.id));
  arrived.forEach((march) => {
    march.status = 'resolving';
    const city = cities.find((item) => item.id === march.destinationId);
    cityLayer.querySelector(`[data-city="${city.id}"]`)?.classList.add('under-attack');
    setTimeout(() => {
      const report = WarlordBattle.resolveBattle({ march, city, defenderBonus: city.defenseBonus, wallPower: city.wallPower, config: battleConfig });
      marches = marches.filter((item) => item.id !== march.id);
      if (!report.conquered && report.attackerSurvivors > 0) {
        const origin = cities.find((item) => item.id === march.originId);
        const returnMarch = WarlordBattle.createReturnMarch({ id: `return-${march.id}`, failedAttack: { ...report, travelMs: march.travelMs }, origin: city, destination: origin });
        marches.push(returnMarch);
      }
      refreshCities();
      renderMarches();
      showBattleReport(report);
    }, battleConfig.battleAnimationMs);
  });

  const returned = marches.filter((march) => march.status === 'returning' && march.arrivalAt <= now);
  returned.forEach((march) => {
    const destination = cities.find((city) => city.id === march.destinationId);
    destination.troops += march.troops;
    marches = marches.filter((item) => item.id !== march.id);
    showToast(`${formatTroops(march.troops)} sobreviventes retornaram a ${destination.name}`);
    refreshCities();
  });
  renderMarches(now);
}

setInterval(() => processArrivals(), 1000);

applyView();
