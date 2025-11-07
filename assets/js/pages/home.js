import { initBase, showToast } from '../main.js';
import { getFeaturedRides } from '../data.js';
import { initScrollAnimations } from '../utils/animate.js';
import { qs } from '../utils/dom.js';

const STORAGE_KEY = 'faremspolu:lastSearch';

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

const restoreSearch = () => {
  const form = qs('.search-form');
  if (!form) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const values = JSON.parse(raw);
    Object.entries(values).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (field) {
        field.value = value;
      }
    });
  } catch (error) {
    console.warn('Nepodařilo se obnovit uložené hledání', error);
  }
};

const handleSearchSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
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
  form?.addEventListener('submit', handleSearchSubmit);
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
