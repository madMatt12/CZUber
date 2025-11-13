import { initBase, showToast } from '../main.js';
import { getRides } from '../data.js';
import { initScrollAnimations } from '../utils/animate.js';
import { qs } from '../utils/dom.js';

const form = () => qs('#rides-filters');
const ridesContainer = () => qs('[data-rides-list]');
const ridesCount = () => qs('[data-rides-count]');

const parseFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const filters = Object.fromEntries(params.entries());
  if (params.has('onlyAvailable')) {
    filters.onlyAvailable = params.get('onlyAvailable') === 'true';
  }
  return filters;
};

const syncFormWithFilters = (filters) => {
  const filtersForm = form();
  if (!filtersForm) return;
  Object.entries(filters).forEach(([key, value]) => {
    const field = filtersForm.elements.namedItem(key);
    if (!field) return;
    if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) {
      field.value = value;
    } else if (field.type === 'checkbox') {
      field.checked = value === true || value === 'true';
    } else {
      field.value = value;
    }
  });
};

const renderRideCard = (ride) => {
  const template = document.getElementById('ride-card-template');
  if (!template) return null;
  const content = template.content.cloneNode(true);
  content.querySelector('[data-route]').textContent = `${ride.from} → ${ride.to}`;
  const formattedDeparture = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ride.departure));
  content.querySelector('[data-departure]').textContent = formattedDeparture;
  content.querySelector('[data-driver]').textContent = `Řidič: ${ride.driver.name}`;
  content.querySelector('[data-availability]').textContent = `${ride.availableSeats} volná místa`;
  content.querySelector('[data-price]').textContent = `${ride.price} ${ride.currency}`;
  const tagsContainer = content.querySelector('[data-tags]');
  tagsContainer.innerHTML = ride.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
  const link = content.querySelector('[data-link]');
  link.href = `ride.html?id=${ride.id}`;
  link.setAttribute('data-ride-title', `${ride.from} → ${ride.to}`);
  return content;
};

const renderRides = async () => {
  const container = ridesContainer();
  const countEl = ridesCount();
  if (!container) return;

  container.innerHTML = '<p>Načítám jízdy...</p>';
  const filters = parseFilters();
  try {
    const data = await getRides(filters);
    if (countEl) {
      countEl.textContent = `${data.length} jízd nalezeno`;
    }
    if (!data.length) {
      container.innerHTML = '<div class="rides-empty">Pro zvolené filtry nejsou dostupné žádné jízdy.</div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    data.forEach((ride) => {
      const node = renderRideCard(ride);
      if (node) fragment.appendChild(node);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
    initScrollAnimations(container.querySelectorAll('[data-animate]'));
  } catch (error) {
    console.error('Nepodařilo se načíst jízdy', error);
    container.innerHTML = '<div class="rides-empty">Nastala chyba při načítání jízd.</div>';
    showToast('Nepodařilo se načíst jízdy.', 'error');
  }
};

const handleFiltersSubmit = (event) => {
  event.preventDefault();
  const filtersForm = form();
  if (!filtersForm) return;

  const formData = new FormData(filtersForm);
  const params = new URLSearchParams();
  formData.forEach((value, key) => {
    if (value) {
      params.set(key, value.toString());
    }
  });
  if (filtersForm.onlyAvailable.checked) {
    params.set('onlyAvailable', 'true');
  }
  const query = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  renderRides();
  if (query) {
    showToast('Filtry byly aplikovány.');
  } else {
    showToast('Filtry byly vymazány.');
  }
};

const handleFiltersReset = (event) => {
  event.preventDefault();
  const filtersForm = form();
  filtersForm?.reset();
  window.history.replaceState({}, '', window.location.pathname);
  renderRides();
  showToast('Zobrazuji všechny jízdy.');
};

const main = () => {
  initBase('rides');
  const filters = parseFilters();
  syncFormWithFilters(filters);
  const filtersForm = form();
  filtersForm?.addEventListener('submit', handleFiltersSubmit);
  const resetButton = filtersForm?.querySelector('button[type="reset"]');
  resetButton?.addEventListener('click', handleFiltersReset);
  renderRides();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
