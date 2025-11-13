import { initBase, showToast } from '../main.js';
import { getRideById } from '../data.js';
import { qs } from '../utils/dom.js';

const formatLongDate = (iso) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const renderReviews = (ride) => {
  const list = qs('[data-ride-reviews]');
  if (!list) return;
  list.innerHTML = '';
  if (!ride.reviews.length) {
    list.innerHTML = '<li>Žádná hodnocení zatím nejsou.</li>';
    return;
  }
  ride.reviews.forEach((review) => {
    const item = document.createElement('li');
    const ratingStars = '★'.repeat(Math.round(review.rating));
    item.innerHTML = `
      <strong>${review.author}</strong>
      <span aria-label="Hodnocení ${review.rating} z 5">${ratingStars}</span>
      <p>${review.text}</p>
      <span>${review.date}</span>
    `;
    list.appendChild(item);
  });
};

const hydrateRideDetail = (ride) => {
  const route = qs('[data-ride-route]');
  const summary = qs('[data-ride-summary]');
  const dateEl = qs('[data-ride-date]');
  const departure = qs('[data-ride-departure]');
  const meeting = qs('[data-ride-meeting]');
  const distance = qs('[data-ride-distance]');
  const price = qs('[data-ride-price]');
  const description = qs('[data-ride-description]');
  const tags = qs('[data-ride-tags]');
  const score = qs('[data-ride-score]');

  if (route) route.textContent = `${ride.from} → ${ride.to}`;
  if (summary) summary.textContent = `${ride.availableSeats} volná místa, cena ${ride.price} ${ride.currency}`;
  if (dateEl) dateEl.textContent = formatLongDate(ride.departure);
  if (departure) departure.textContent = formatLongDate(ride.departure);
  if (meeting) meeting.textContent = ride.meetingPoint;
  if (distance) distance.textContent = `${ride.duration} • ${ride.distance}`;
  if (price) price.textContent = `${ride.price} ${ride.currency} / osoba`;
  if (description) description.textContent = ride.description;
  if (tags) {
    tags.innerHTML = ride.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
  }
  if (score) score.textContent = `${ride.driver.rating.toFixed(1)}★`;
  const requestButtons = document.querySelectorAll('[data-modal-open="request-modal"]');
  requestButtons.forEach((button) => {
    button.setAttribute('data-ride-title', `${ride.from} → ${ride.to}`);
  });

  const driverName = qs('[data-driver-name]');
  const driverRating = qs('[data-driver-rating]');
  const driverCar = qs('[data-driver-car]');
  const driverColor = qs('[data-driver-color]');
  const driverPlate = qs('[data-driver-plate]');
  const driverTrips = qs('[data-driver-trips]');
  const driverBio = qs('[data-driver-bio]');
  const driverAvatar = qs('[data-driver-initials]');

  if (driverName) driverName.textContent = ride.driver.name;
  if (driverRating) driverRating.textContent = `${ride.driver.rating.toFixed(1)}★ (${ride.driver.trips} jízd)`;
  if (driverCar) driverCar.textContent = ride.driver.car;
  if (driverColor) driverColor.textContent = ride.driver.color;
  if (driverPlate) driverPlate.textContent = ride.driver.plate;
  if (driverTrips) driverTrips.textContent = ride.driver.trips;
  if (driverBio) driverBio.textContent = ride.driver.bio;
  if (driverAvatar) driverAvatar.textContent = ride.driver.initials;

  renderReviews(ride);
};

const renderNotFound = () => {
  const container = qs('[data-ride-detail]');
  if (!container) return;
  container.innerHTML = `
    <div class="rides-empty">
      Tuto jízdu jsme bohužel nenašli. Zkontroluj prosím odkaz nebo přejdi na <a href="rides.html">přehled jízd</a>.
    </div>
  `;
  showToast('Jízdu se nepodařilo načíst.', 'error');
};

const main = async () => {
  initBase('rides');
  const params = new URLSearchParams(window.location.search);
  const rideId = params.get('id');
  if (!rideId) {
    renderNotFound();
    return;
  }
  try {
    const ride = await getRideById(rideId);
    if (!ride) {
      renderNotFound();
      return;
    }
    hydrateRideDetail(ride);
  } catch (error) {
    console.error('Nepodařilo se načíst detail jízdy', error);
    renderNotFound();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
