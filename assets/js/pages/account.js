import { initBase, showToast } from '../main.js';
import { getAccountOverview } from '../data.js';
import { qs } from '../utils/dom.js';

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
};

const main = async () => {
  initBase('account');
  try {
    const data = await getAccountOverview();
    hydrateAccount(data);
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
