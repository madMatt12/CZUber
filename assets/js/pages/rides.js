import { initBase, showToast } from '../main.js';
import { getRides } from '../data.js';
import { initScrollAnimations } from '../utils/animate.js';
import { qs } from '../utils/dom.js';

const form = () => qs('#rides-filters');
const ridesContainer = () => qs('[data-rides-list]');
const ridesCount = () => qs('[data-rides-count]');

const CAMPUS_LOCATION = 'ČZU';
const filterState = {
  direction: 'to',
  locations: {
    from: '',
    to: ''
  }
};

const updateDirectionButtons = () => {
  const filtersForm = form();
  if (!filtersForm) return;
  const buttons = filtersForm.querySelectorAll('[data-filter-direction-option]');
  buttons.forEach((button) => {
    const targetDirection = button.getAttribute('data-filter-direction-option');
    const isActive = targetDirection === filterState.direction;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

const updateDirectionFields = () => {
  const filtersForm = form();
  if (!filtersForm) return;

  const fromInput = filtersForm.elements.namedItem('from');
  const toInput = filtersForm.elements.namedItem('to');
  const directionValue = filtersForm.querySelector('[data-filter-direction-value]');

  if (directionValue) {
    directionValue.value = filterState.direction;
  }

  if (filterState.direction === 'to') {
    if (fromInput) {
      fromInput.readOnly = false;
      fromInput.removeAttribute('aria-readonly');
      fromInput.value = filterState.locations.from;
      fromInput.placeholder = 'Odkud jedeš?';
    }
    if (toInput) {
      toInput.value = CAMPUS_LOCATION;
      toInput.readOnly = true;
      toInput.setAttribute('aria-readonly', 'true');
      toInput.placeholder = CAMPUS_LOCATION;
    }
  } else {
    if (fromInput) {
      fromInput.value = CAMPUS_LOCATION;
      fromInput.readOnly = true;
      fromInput.setAttribute('aria-readonly', 'true');
      fromInput.placeholder = CAMPUS_LOCATION;
    }
    if (toInput) {
      toInput.readOnly = false;
      toInput.removeAttribute('aria-readonly');
      toInput.value = filterState.locations.to;
      toInput.placeholder = 'Kam máš namířeno?';
    }
  }
};

const setFilterDirection = (direction) => {
  const next = direction === 'from' ? 'from' : 'to';
  if (next === filterState.direction) return;
  filterState.direction = next;
  updateDirectionButtons();
  updateDirectionFields();
};

const parseFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const filters = {};

  filters.direction = params.get('direction') === 'from' ? 'from' : 'to';

  ['from', 'to', 'date', 'seats', 'maxPrice'].forEach((key) => {
    if (params.has(key)) {
      filters[key] = params.get(key);
    }
  });

  return filters;
};

const syncFormWithFilters = (filters) => {
  const filtersForm = form();
  if (!filtersForm) return;

  filterState.direction = filters.direction === 'from' ? 'from' : 'to';
  filterState.locations.from = filterState.direction === 'to' ? filters.from || '' : '';
  filterState.locations.to = filterState.direction === 'from' ? filters.to || '' : '';

  const dateField = filtersForm.elements.namedItem('date');
  if (dateField) dateField.value = filters.date || '';

  const seatsField = filtersForm.elements.namedItem('seats');
  if (seatsField) seatsField.value = filters.seats || '';

  const maxPriceField = filtersForm.elements.namedItem('maxPrice');
  if (maxPriceField) maxPriceField.value = filters.maxPrice || '';

  updateDirectionButtons();
  updateDirectionFields();
};

const renderRideCard = (ride) => {
  const template = document.getElementById('ride-card-template');
  if (!template) return null;
  const content = template.content.cloneNode(true);
  content.querySelector('[data-route]').textContent = `${ride.from} → ${ride.to}`;
  const formattedDeparture = new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',     
    month: '2-digit',    
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
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

  const params = new URLSearchParams();

  params.set('direction', filterState.direction);

  const fromValue = filterState.direction === 'to' ? filtersForm.from.value.trim() : CAMPUS_LOCATION;
  const toValue = filterState.direction === 'to' ? CAMPUS_LOCATION : filtersForm.to.value.trim();
  const dateValue = filtersForm.date.value;
  const seatsValue = filtersForm.seats.value;
  const maxPriceValue = filtersForm.maxPrice.value.trim();

  if (filterState.direction === 'to') {
    if (fromValue) {
      params.set('from', fromValue);
    }
    params.set('to', CAMPUS_LOCATION);
  } else {
    params.set('from', CAMPUS_LOCATION);
    if (toValue) {
      params.set('to', toValue);
    }
  }

  if (dateValue) {
    params.set('date', dateValue);
  }

  if (seatsValue) {
    params.set('seats', seatsValue);
  }

  if (maxPriceValue) {
    const maxPriceNumber = Number(maxPriceValue);
    if (Number.isNaN(maxPriceNumber) || maxPriceNumber < 0) {
      showToast('Cena musí být nula nebo kladné číslo.', 'error');
      return;
    }
    params.set('maxPrice', maxPriceNumber.toString());
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
  if (filtersForm) {
    filtersForm.reset();
  }
  filterState.direction = 'to';
  filterState.locations.from = '';
  filterState.locations.to = '';
  updateDirectionButtons();
  updateDirectionFields();
  window.history.replaceState({}, '', window.location.pathname);
  renderRides();
  showToast('Zobrazuji všechny jízdy.');
};

const setupFilterControls = () => {
  const filtersForm = form();
  if (!filtersForm || filtersForm.dataset.enhanced) return;

  const fromInput = filtersForm.elements.namedItem('from');
  const toInput = filtersForm.elements.namedItem('to');

  const buttons = filtersForm.querySelectorAll('[data-filter-direction-option]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-filter-direction-option');
      setFilterDirection(target);
    });
  });

  fromInput?.addEventListener('input', (event) => {
    if (filterState.direction === 'to') {
      filterState.locations.from = event.target.value;
    }
  });

  toInput?.addEventListener('input', (event) => {
    if (filterState.direction === 'from') {
      filterState.locations.to = event.target.value;
    }
  });

  filtersForm.dataset.enhanced = 'true';
};

const main = () => {
  initBase('rides');
  const filters = parseFilters();
  syncFormWithFilters(filters);
  setupFilterControls();
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
