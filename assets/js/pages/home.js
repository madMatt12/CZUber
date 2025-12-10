import { initBase, showToast } from '../main.js';
import { getFeaturedRides } from '../data.js';
import { initScrollAnimations } from '../utils/animate.js';
import { qs } from '../utils/dom.js';

const STORAGE_KEY = 'faremspolu:lastSearch';
const CAMPUS_LOCATION = 'ČZU';
const searchState = {
  direction: 'to',
  locations: {
    from: '',
    to: ''
  }
};

const formatDepartureLabel = (isoString) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const renderRideCard = (ride) => {
  const article = document.createElement('article');
  article.className = 'rides-card card';
  article.dataset.animate = '';
  article.innerHTML = `
    <div class="rides-card__route">
      <span>${ride.from} → ${ride.to}</span>
      <span>${formatDepartureLabel(ride.departure)}</span>
    </div>
    <div class="rides-card__meta">
      <span>Řidič: <strong>${ride.driver.name}</strong></span>
      <span>${ride.availableSeats} volná místa</span>
    </div>
    <div class="rides-card__tags">
      ${ride.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <div class="rides-card__footer">
      <span class="rides-card__price">${ride.price} ${ride.currency}</span>
      <a class="btn btn--ghost" href="ride.html?id=${ride.id}" data-ride-title="${ride.from} → ${ride.to}">Detail jízdy</a>
    </div>
  `;
  return article;
};

const renderFeaturedRides = async () => {
  const container = qs('[data-rides-preview]');
  if (!container) return;

  container.innerHTML = '<p>Načítám nejbližší jízdy...</p>';
  try {
    const rides = await getFeaturedRides();
    if (!rides.length) {
      container.innerHTML = '<p>Aktuálně nejsou žádné volné jízdy. Zkus to později.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    rides.forEach((ride) => fragment.appendChild(renderRideCard(ride)));
    container.innerHTML = '';
    container.appendChild(fragment);
    initScrollAnimations(container.querySelectorAll('[data-animate]'));
  } catch (error) {
    console.error('Nepodařilo se načíst jízdy', error);
    container.innerHTML = '<p>Nepodařilo se načíst jízdy. Zkus to prosím znovu.</p>';
  }
};

const updateDirectionButtons = () => {
  const form = qs('.search-form');
  if (!form) return;
  const buttons = form.querySelectorAll('[data-search-direction-option]');
  buttons.forEach((button) => {
    const targetDirection = button.getAttribute('data-search-direction-option');
    const isActive = targetDirection === searchState.direction;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

const updateDirectionFields = () => {
  const form = qs('.search-form');
  if (!form) return;

  const fromInput = form.elements.namedItem('from');
  const toInput = form.elements.namedItem('to');
  const directionValue = form.querySelector('[data-search-direction-value]');

  if (directionValue) {
    directionValue.value = searchState.direction;
  }

  if (searchState.direction === 'to') {
    if (fromInput) {
      fromInput.readOnly = false;
      fromInput.removeAttribute('aria-readonly');
      fromInput.value = searchState.locations.from;
      fromInput.placeholder = 'Např. Kolín';
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
      toInput.value = searchState.locations.to;
      toInput.placeholder = 'Např. Kolín nebo centrum Prahy';
    }
  }
};

const setSearchDirection = (direction) => {
  const next = direction === 'from' ? 'from' : 'to';
  if (next === searchState.direction) return;
  searchState.direction = next;
  updateDirectionButtons();
  updateDirectionFields();
};

const restoreSearch = () => {
  const form = qs('.search-form');
  if (!form) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      updateDirectionButtons();
      updateDirectionFields();
      return;
    }
    const values = JSON.parse(raw);

    searchState.direction = values.direction === 'from' ? 'from' : 'to';
    searchState.locations.from = searchState.direction === 'to' ? values.from || '' : '';
    searchState.locations.to = searchState.direction === 'from' ? values.to || '' : '';

    ['date', 'time', 'seats'].forEach((key) => {
      const field = form.elements.namedItem(key);
      if (field && values[key]) {
        field.value = values[key];
      }
    });

    updateDirectionButtons();
    updateDirectionFields();
  } catch (error) {
    console.warn('Nepodařilo se obnovit uložené hledání', error);
    updateDirectionButtons();
    updateDirectionFields();
  }
};

const handleSearchSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const direction = searchState.direction;
  const fromValue = direction === 'to' ? form.from.value.trim() : CAMPUS_LOCATION;
  const toValue = direction === 'to' ? CAMPUS_LOCATION : form.to.value.trim();

  const payload = {
    direction,
    from: fromValue,
    to: toValue
  };

  ['date', 'time', 'seats'].forEach((key) => {
    const value = form.elements.namedItem(key)?.value;
    if (value) {
      payload[key] = value;
    }
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    showToast('Poslední hledání uloženo.');
  } catch (error) {
    console.warn('LocalStorage není dostupný', error);
    showToast('Nepodařilo se uložit hledání.', 'error');
  }

  window.location.href = `rides.html?${new URLSearchParams(payload).toString()}`;
};

const initSearchForm = () => {
  const form = qs('.search-form');
  if (!form || form.dataset.enhanced) return;

  const buttons = form.querySelectorAll('[data-search-direction-option]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-search-direction-option');
      setSearchDirection(target);
    });
  });

  const fromInput = form.elements.namedItem('from');
  const toInput = form.elements.namedItem('to');

  fromInput?.addEventListener('input', (event) => {
    if (searchState.direction === 'to') {
      searchState.locations.from = event.target.value;
    }
  });

  toInput?.addEventListener('input', (event) => {
    if (searchState.direction === 'from') {
      searchState.locations.to = event.target.value;
    }
  });

  form.addEventListener('submit', handleSearchSubmit);
  form.dataset.enhanced = 'true';
};

const main = () => {
  initBase('home');
  restoreSearch();
  initSearchForm();
  renderFeaturedRides();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
