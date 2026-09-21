const PLAYER_ID = 'player';
const battleConfig = WarlordBattle.DEFAULT_BATTLE_CONFIG;
const cities = [
  { id: 'aurora', name: 'Aurora', level: 83, owner: 'Lord Azevedo', ownerId: PLAYER_ID, troops: 128400, attackBonus: 1.5, defenseBonus: 1, wallPower: 30000, x: 43, y: 44, tone: 'blue' },
  { id: 'pedra-alta', name: 'Pedra Alta', level: 34, owner: 'Clã do Norte', ownerId: 'north', troops: 43700, defenseBonus: 0.45, wallPower: 18000, x: 69, y: 31, tone: 'red' },
  { id: 'vale-verde', name: 'Vale Verde', level: 12, owner: 'Sem aliança', ownerId: 'green', troops: 8900, defenseBonus: 0.1, wallPower: 5000, x: 27, y: 67, tone: 'green' },
  { id: 'forte-sol', name: 'Forte do Sol', level: 157, owner: 'Império Dourado', ownerId: 'gold', troops: 305200, defenseBonus: 1.2, wallPower: 90000, x: 76, y: 71, tone: 'gold' },
  { id: 'ravenna', name: 'Ravenna', level: 31, owner: 'Guardiões', ownerId: 'north', troops: 38900, defenseBonus: 0.35, wallPower: 16000, x: 55, y: 20, tone: 'blue' },
  { id: 'porto-real', name: 'Porto Real', level: 22, owner: 'Liga Real', ownerId: 'green', troops: 21400, defenseBonus: 0.25, wallPower: 11000, x: 18, y: 84, tone: 'gold' }
];

const world = document.querySelector('#world');
const viewport = document.querySelector('#world-viewport');
const cityLayer = document.querySelector('#cities');
const marchLayer = document.querySelector('#marches');
const panel = document.querySelector('#city-panel');
const toast = document.querySelector('#toast');
const hint = document.querySelector('#map-hint');
const attackDialog = document.querySelector('#attack-dialog');
const reportDialog = document.querySelector('#battle-report');

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

function tierFor(level) {
  if (level >= 150) return { key: 'citadel', label: 'Grande cidadela', towers: 5 };
  if (level >= 100) return { key: 'fortress', label: 'Fortaleza', towers: 4 };
  if (level >= 75) return { key: 'great-castle', label: 'Grande castelo', towers: 4 };
  if (level >= 50) return { key: 'castle', label: 'Castelo desenvolvido', towers: 3 };
  if (level >= 25) return { key: 'small-castle', label: 'Pequeno castelo', towers: 3 };
  if (level >= 10) return { key: 'village', label: 'Vila fortificada', towers: 2 };
  return { key: 'settlement', label: 'Pequeno assentamento', towers: 1 };
}

function castleMarkup(city) {
  const tier = tierFor(city.level);
  const towers = Array.from({ length: tier.towers }, (_, index) => `<i class="tower tower-${index + 1}"><em></em></i>`).join('');
  return `
    <button class="city tone-${city.tone} tier-${tier.key}" data-city="${city.id}" style="--x:${city.x}%;--y:${city.y}%" aria-label="${city.name}, nível ${city.level}, ${tier.label}">
      <span class="selection-ring"></span>
      <span class="city-label"><strong>${city.name}</strong><small><b>${city.level}</b> ${city.owner}</small></span>
      <span class="castle" aria-hidden="true">
        <span class="castle-shadow"></span><span class="wall"></span>${towers}<span class="keep"><i class="flag"></i></span><span class="gate"></span>
      </span>
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
      <span class="march-path"></span><span class="army">⚔<i>${formatTroops(march.troops)}</i></span><span class="march-time">${formatDuration(march.arrivalAt - now)}</span>
    </div>`;
  }).join('');
}

function applyView() {
  world.style.setProperty('--pan-x', `${view.x}px`);
  world.style.setProperty('--pan-y', `${view.y}px`);
  world.style.setProperty('--zoom', view.scale);
}

function clampView() {
  view.scale = Math.min(1.35, Math.max(0.62, view.scale));
  view.x = Math.min(260, Math.max(-260, view.x));
  view.y = Math.min(220, Math.max(-180, view.y));
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
  document.querySelector('#attack-label').textContent = ownCity ? (originCity?.id === city.id ? 'Origem pronta' : 'Mobilizar') : 'Atacar';
  document.querySelector('#attack-action').disabled = ownCity && originCity?.id === city.id;
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
document.querySelector('#close-panel').addEventListener('click', closePanel);
document.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action}: ${selectedCity?.name ?? ''}`)));

document.querySelector('#attack-action').addEventListener('click', () => {
  if (!selectedCity) return;
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
