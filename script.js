const cities = [
  { id: 'aurora', name: 'Aurora', level: 83, owner: 'Guardiões', troops: 128400, x: 43, y: 44, tone: 'blue' },
  { id: 'pedra-alta', name: 'Pedra Alta', level: 34, owner: 'Clã do Norte', troops: 43700, x: 69, y: 31, tone: 'red' },
  { id: 'vale-verde', name: 'Vale Verde', level: 12, owner: 'Sem aliança', troops: 8900, x: 27, y: 67, tone: 'green' },
  { id: 'forte-sol', name: 'Forte do Sol', level: 157, owner: 'Império Dourado', troops: 305200, x: 76, y: 71, tone: 'gold' }
];

const world = document.querySelector('#world');
const viewport = document.querySelector('#world-viewport');
const cityLayer = document.querySelector('#cities');
const marchLayer = document.querySelector('#marches');
const panel = document.querySelector('#city-panel');
const toast = document.querySelector('#toast');
const hint = document.querySelector('#map-hint');

let view = { x: 0, y: 20, scale: 0.88 };
let drag = null;
let selectedCity = null;
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
marchLayer.innerHTML = `
  <div class="march" aria-label="Exército aliado em marcha, 12 mil tropas, 3 minutos restantes">
    <span class="march-path"></span><span class="army">⚔<i>12K</i></span><span class="march-time">02:48</span>
  </div>`;

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
  panel.classList.add('visible');
  panel.setAttribute('aria-hidden', 'false');
  hint.classList.add('hidden');
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
  view = { x: 0, y: 20, scale: 0.88 };
  applyView();
  showToast('Mapa centralizado');
});
document.querySelector('#close-panel').addEventListener('click', closePanel);
document.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action}: ${selectedCity?.name ?? ''}`)));

applyView();
