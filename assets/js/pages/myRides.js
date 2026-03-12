import { initBase } from '../main.js';
import { api, showToast } from '../utils/api.js';
import { qs } from '../utils/dom.js';

const formatDate = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

const statusLabel = (s) => {
  const map = { pending: 'Čeká', approved: 'Přijato', rejected: 'Zamítnuto' };
  return map[s] || s;
};

const statusClass = (s) => `status-badge--${s}`;

// ============ SEKCE: ŘIDIČ ============
const renderDriverRides = (rides) => {
  const container = qs('[data-driver-rides-list]');
  const counter = qs('[data-driver-count]');
  if (counter) counter.textContent = rides.length;
  
  if (!rides.length) {
    container.innerHTML = '<div class="empty-state">Zatím nemáš žádné nabízené jízdy.</div>';
    return;
  }

  container.innerHTML = rides.map((ride) => `
    <div class="ride-card-my" data-ride-id="${ride.id}">
      <div class="ride-card-my__header" data-toggle-ride="${ride.id}">
        <div>
          <div class="ride-card-my__route">${ride.from} → ${ride.to}</div>
          <div class="ride-card-my__meta">
            <span>📅 ${formatDate(ride.departure)}</span>
            <span>💺 ${ride.capacity} míst</span>
            <span>💰 ${ride.price} Kč</span>
            ${ride.duration ? `<span>⏱ ${ride.duration}</span>` : ''}
            <span>🚗 ${ride.car}</span>
          </div>
        </div>
        <button class="ride-card-my__toggle" type="button" aria-label="Rozbalit žádosti" data-toggle-btn="${ride.id}">▼</button>
      </div>
      <div class="ride-card-my__body" hidden data-ride-body="${ride.id}">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 600;">Žádosti o místo (${ride.requests.length})</h3>
        ${ride.requests.length === 0 
          ? '<p style="font-size: 0.85rem; color: var(--clr-muted, #6b7280);">Zatím žádné žádosti.</p>'
          : ride.requests.map(req => `
            <div class="request-item" data-request-id="${req.id}">
              <div class="request-item__info">
                <span class="request-item__name">${req.passengerName}</span>
                <span style="font-size: 0.8rem; color: var(--clr-muted);">(${req.passengerEmail})</span>
                ${req.message ? `<div class="request-item__message">„${req.message}"</div>` : ''}
                <div style="margin-top: 0.25rem;"><span class="status-badge ${statusClass(req.status)}">${statusLabel(req.status)}</span></div>
              </div>
              ${req.status === 'pending' ? `
                <div class="request-item__actions">
                  <button class="btn btn--primary" type="button" data-approve="${req.id}">✓ Přijmout</button>
                  <button class="btn btn--ghost" type="button" data-reject="${req.id}">✗ Zamítnout</button>
                </div>
              ` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `).join('');
};

// ============ SEKCE: PASAŽÉR ============
const renderPassengerRides = (rides) => {
  const container = qs('[data-passenger-rides-list]');
  const counter = qs('[data-passenger-count]');
  if (counter) counter.textContent = rides.length;

  if (!rides.length) {
    container.innerHTML = '<div class="empty-state">Zatím jsi nežádal o žádnou jízdu.</div>';
    return;
  }

  container.innerHTML = rides.map((ride) => `
    <div class="passenger-card">
      <div style="flex: 1;">
        <div class="passenger-card__route">${ride.from} → ${ride.to}</div>
        <div class="passenger-card__details">
          📅 ${formatDate(ride.departure)} · 💰 ${ride.price} Kč · 🧑 Řidič: ${ride.driverName}
          ${ride.duration ? ` · ⏱ ${ride.duration}` : ''}
        </div>
        ${ride.myMessage ? `<div class="passenger-card__message">Tvá zpráva: „${ride.myMessage}"</div>` : ''}
      </div>
      <span class="status-badge ${statusClass(ride.requestStatus)}">${statusLabel(ride.requestStatus)}</span>
    </div>
  `).join('');
};

// ============ SEKCE: HISTORIE ============
const renderHistory = (rides) => {
  const container = qs('[data-history-list]');

  if (!rides.length) {
    container.innerHTML = '<div class="empty-state">Zatím nemáš žádné dokončené jízdy.</div>';
    return;
  }

  container.innerHTML = rides.map((ride) => `
    <div class="history-card">
      <div>
        <div class="history-card__route">${ride.from} → ${ride.to}</div>
        <div class="history-card__meta">
          ${formatDate(ride.departure)} · ${ride.role === 'driver' ? '🚗 Řidič' : '🎒 Pasažér'}
          ${ride.duration ? ` · ⏱ ${ride.duration}` : ''}
        </div>
      </div>
      <span class="status-badge ${ride.status === 'completed' ? 'status-badge--approved' : 'status-badge--rejected'}">
        ${ride.status === 'completed' ? 'Dokončeno' : 'Zrušeno'}
      </span>
    </div>
  `).join('');
};

// ============ TOGGLE + AKCE ============
const setupInteractions = () => {
  document.addEventListener('click', async (e) => {
    // Toggle řidičské jízdy
    const toggleBtn = e.target.closest('[data-toggle-ride], [data-toggle-btn]');
    if (toggleBtn) {
      const rideId = toggleBtn.dataset.toggleRide || toggleBtn.dataset.toggleBtn;
      const body = qs(`[data-ride-body="${rideId}"]`);
      const btn = qs(`[data-toggle-btn="${rideId}"]`);
      if (body) {
        body.hidden = !body.hidden;
        btn?.classList.toggle('is-open', !body.hidden);
      }
      return;
    }

    // Schválení žádosti
    const approveBtn = e.target.closest('[data-approve]');
    if (approveBtn) {
      const reqId = approveBtn.dataset.approve;
      try {
        approveBtn.disabled = true;
        await api.user.respondToRequest(reqId, 'approved');
        showToast('Žádost byla schválena!', 'success');
        loadData(); // Reload
      } catch (err) {
        showToast(err.message || 'Nepodařilo se schválit žádost.', 'error');
        approveBtn.disabled = false;
      }
      return;
    }

    // Zamítnutí žádosti
    const rejectBtn = e.target.closest('[data-reject]');
    if (rejectBtn) {
      const reqId = rejectBtn.dataset.reject;
      try {
        rejectBtn.disabled = true;
        await api.user.respondToRequest(reqId, 'rejected');
        showToast('Žádost byla zamítnuta.', 'success');
        loadData(); // Reload
      } catch (err) {
        showToast(err.message || 'Nepodařilo se zamítnout žádost.', 'error');
        rejectBtn.disabled = false;
      }
      return;
    }
  });
};

// ============ HLAVNÍ FLOW ============
const loadData = async () => {
  try {
    const data = await api.user.getMyRides();
    renderDriverRides(data.driverRides || []);
    renderPassengerRides(data.passengerRides || []);
    renderHistory(data.history || []);
  } catch (err) {
    console.error('Chyba při načítání mých jízd:', err);
    showToast('Nepodařilo se načíst tvé jízdy. Přihlaš se prosím.', 'error');
  }
};

const main = async () => {
  initBase('my-rides');
  setupInteractions();
  await loadData();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
