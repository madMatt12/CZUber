import { initBase, showToast, syncUserVehicles } from '../main.js';
import { getAccountOverview } from '../data.js';
import { qs } from '../utils/dom.js';

const ENGINE_LABELS = {
  benzin: 'Benzín',
  diesel: 'Diesel',
  lpg: 'LPG',
  electro: 'Elektro',
  hybrid: 'Hybrid'
};

let accountState = null;

const roleLabel = (role) => {
  if (role === 'driver') return 'Preferovaná role: řidič';
  if (role === 'passenger') return 'Preferovaná role: pasažér';
  return 'Zapojený student FaremSpolu';
};

const renderRideList = (selector, rides) => {
  const list = qs(selector);
  if (!list) return;
  list.innerHTML = '';
  if (!rides.length) {
    list.innerHTML = '<li>Žádné jízdy zatím nejsou k dispozici.</li>';
    return;
  }
  rides.forEach((ride) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${ride.title}</strong>
      <span>${ride.date} • ${ride.seats}</span>
      <span>${ride.status}</span>
      <a class="btn btn--ghost" href="ride.html?id=${ride.id}">Detail</a>
    `;
    list.appendChild(item);
  });
};

const getEngineLabel = (engine) => ENGINE_LABELS[engine] || engine;

const createVehicleItem = (vehicle) => {
  const item = document.createElement('li');
  item.className = 'account-vehicles__item';

  const header = document.createElement('div');
  header.className = 'account-vehicles__item-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'account-vehicles__item-title';

  const title = document.createElement('strong');
  title.textContent = `${vehicle.brand} ${vehicle.model}`.trim();

  const subtitle = document.createElement('span');
  subtitle.className = 'account-vehicles__item-sub';
  subtitle.textContent = vehicle.color;

  titleWrap.append(title, subtitle);

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = getEngineLabel(vehicle.engine);

  header.append(titleWrap, badge);

  const meta = document.createElement('dl');
  meta.className = 'account-vehicles__meta';

  const colorGroup = document.createElement('div');
  const colorLabel = document.createElement('dt');
  colorLabel.textContent = 'Barva';
  const colorValue = document.createElement('dd');
  colorValue.textContent = vehicle.color;
  colorGroup.append(colorLabel, colorValue);

  const plateGroup = document.createElement('div');
  const plateLabel = document.createElement('dt');
  plateLabel.textContent = 'SPZ';
  const plateValue = document.createElement('dd');
  plateValue.textContent = vehicle.plate;
  plateGroup.append(plateLabel, plateValue);

  meta.append(colorGroup, plateGroup);

  item.append(header, meta);

  return item;
};

const renderVehicles = (vehicles = []) => {
  const list = qs('[data-vehicle-list]');
  if (!list) return;
  list.innerHTML = '';

  if (!vehicles.length) {
    const empty = document.createElement('li');
    empty.className = 'account-vehicles__empty';
    empty.textContent = 'Zatím nemáš uložená žádná vozidla.';
    list.append(empty);
    return;
  }

  vehicles.forEach((vehicle) => {
    list.append(createVehicleItem(vehicle));
  });
};

const hydrateAccount = (data) => {
  const roleEl = qs('[data-account-role]');
  const driverCount = qs('[data-account-driver-count]');
  const passengerCount = qs('[data-account-passenger-count]');
  const ratingEl = qs('[data-account-rating]');
  const driverRole = qs('[data-driver-role]');
  const passengerRole = qs('[data-passenger-role]');

  if (roleEl) roleEl.textContent = `${data.name} — ${roleLabel(data.role)}`;
  if (driverCount) driverCount.textContent = data.driverRides.length;
  if (passengerCount) passengerCount.textContent = data.passengerRides.length;
  if (ratingEl) ratingEl.textContent = `${data.rating.toFixed(1)}★`;
  if (driverRole) driverRole.textContent = 'Řidič';
  if (passengerRole) passengerRole.textContent = 'Pasažér';

  renderRideList('[data-driver-rides]', data.driverRides);
  renderRideList('[data-passenger-rides]', data.passengerRides);
  renderVehicles(data.vehicles || []);
  syncUserVehicles(data.vehicles || []);
};

const cleanInput = (value) => value.toString().trim().replace(/\s+/g, ' ');

const formatPlate = (value) =>
  value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

const setupVehicleForm = () => {
  const form = qs('[data-vehicle-form]');
  if (!form || form.dataset.bound) return;

  form.dataset.bound = 'true';
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!accountState) {
      showToast('Počkej na načtení účtu.', 'error');
      return;
    }

    const formData = new FormData(form);
    const brand = cleanInput(formData.get('brand') || '');
    const model = cleanInput(formData.get('model') || '');
    const color = cleanInput(formData.get('color') || '');
    const plate = formatPlate(formData.get('plate') || '');
    const engine = formData.get('engine');

    if (!brand || !model || !color || !plate || !engine) {
      showToast('Vyplň všechna povinná pole.', 'error');
      return;
    }

    const vehicle = {
      id: `vehicle-${Date.now()}`,
      brand,
      model,
      color,
      plate,
      engine
    };

    accountState.vehicles = [...(accountState.vehicles || []), vehicle];
    renderVehicles(accountState.vehicles);
    syncUserVehicles(accountState.vehicles);
    showToast('Vozidlo bylo přidáno do profilu.');
    form.reset();
    qs('#vehicle-brand', form)?.focus();
  });
};

const main = async () => {
  initBase('account');
  try {
    const data = await getAccountOverview();
    accountState = {
      ...data,
      driverRides: Array.isArray(data.driverRides) ? [...data.driverRides] : [],
      passengerRides: Array.isArray(data.passengerRides) ? [...data.passengerRides] : [],
      vehicles: Array.isArray(data.vehicles) ? [...data.vehicles] : []
    };
    hydrateAccount(accountState);
    setupVehicleForm();
  } catch (error) {
    console.error('Nepodařilo se načíst profil', error);
    showToast('Nepodařilo se načíst účet.', 'error');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
