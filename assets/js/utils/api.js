/**
 * FaremSpolu API klient (Napojeno na PHP Backend)
 */

const API_BASE_URL = 'api/index.php?action=';

// Pomocna funkce pro unifikovane volani fetch()
async function fetchAPI(action, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${action}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Chyba na serveru (neplatna odpoved).');
  }

  if (!response.ok || data.error) {
    throw new Error(data.message || 'Doslo k chybe pri komunikaci se serverem.');
  }

  return data;
}

export const api = {
  auth: {
    async login(email, password) {
      const data = await fetchAPI('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      return data;
    },
    async register(dataPayload) {
      const data = await fetchAPI('auth/register', {
        method: 'POST',
        body: JSON.stringify(dataPayload)
      });
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      return data;
    }
  },
  rides: {
    async getAll(filters = {}) {
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.direction) queryParams.append('direction', filters.direction);
      if (filters.seats) queryParams.append('seats', filters.seats);
      const url = `rides${queryParams.toString() ? '&' + queryParams.toString() : ''}`;
      
      const data = await fetchAPI(url, { method: 'GET' });
      return Array.isArray(data) ? data : []; 
    },
    async getFeaturedRides() {
      const data = await fetchAPI('rides&featured=1', { method: 'GET' });
      return Array.isArray(data) ? data : []; 
    },
    async getRideById(id) {
      return await fetchAPI(`rides&id=${id}`, { method: 'GET' });
    },
    async create(rideData) {
      return await fetchAPI('rides', {
        method: 'POST',
        body: JSON.stringify(rideData)
      });
    },
    async requestSeat(rideId, requestData) {
      return await fetchAPI('rides/request', {
        method: 'POST',
        body: JSON.stringify({ rideId, ...requestData })
      });
    }
  },
  user: {
    async getAccountOverview() {
      return await fetchAPI('user/account', { method: 'GET' });
    },
    async getVehicles() {
      const data = await fetchAPI('user/vehicles', { method: 'GET' });
      return Array.isArray(data) ? data : [];
    },
    async addVehicle(vehicleData) {
      return await fetchAPI('user/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      });
    },
    async getMyRides() {
      return await fetchAPI('user/my-rides', { method: 'GET' });
    },
    async respondToRequest(requestId, status) {
      return await fetchAPI('rides/request/respond', {
        method: 'POST',
        body: JSON.stringify({ requestId, status })
      });
    }
  }
};

export const showToast = (message, type = 'success') => {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-container';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icon = type === 'success' ? '✓' : '✖';

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icon}</span>
    <div class="toast__content">${message}</div>
    <button class="toast__close" aria-label="Zavřít zprávu">&times;</button>
  `;

  root.appendChild(toast);

  void toast.offsetWidth;
  toast.classList.add('is-visible');

  const closeBtn = toast.querySelector('.toast__close');

  const removeToast = () => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  closeBtn.addEventListener('click', removeToast);
  setTimeout(removeToast, 4000);
};

export const clearValidation = (form) => {
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.input__error-msg').forEach(el => el.remove());
};

export const showValidationError = (input, message) => {
  input.classList.add('is-invalid');
  const errorMsg = document.createElement('div');
  errorMsg.className = 'input__error-msg';
  errorMsg.textContent = message;
  const wrapper = input.closest('.input');
  if (wrapper) {
    wrapper.appendChild(errorMsg);
  } else {
    input.parentNode.insertBefore(errorMsg, input.nextSibling);
  }
};
