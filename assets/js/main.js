import { qs, qsa, toggleHidden, trapFocus, delegate } from './utils/dom.js';
import { initScrollAnimations } from './utils/animate.js';
import { getAccountOverview } from './data.js';

document.documentElement.classList.add('has-js');

const state = {
  activeModal: null,
  modalCleanup: null,
  toastTimeout: null,
  isLoggedIn: false,
  authBound: false,
  profile: {
    name: 'Matěj Kořínek',
    initials: 'MK'
  },
  userVehicles: [],
  accountLoaded: false,
  accountLoading: false
};

const AUTH_STORAGE_KEY = 'faremspolu-authenticated';

const NAV_LINKS = [
  { href: 'index.html', label: 'Domů', key: 'home' },
  { href: 'rides.html', label: 'Hledat jízdu', key: 'rides' },
  { href: 'index.html#next-steps', label: 'O projektu', key: 'about' }
];

const GUEST_NAV_LINKS = [
  { href: 'landing.html', label: 'Domů', key: 'home' },
  { href: 'landing.html#about', label: 'O projektu', key: 'about' }
];

const FOOTER_LINKS = [
  { href: 'mailto:team@faremspolu.cz', label: 'Kontakt' },
  { href: 'https://github.com/czu-students/faremspolu', label: 'GitHub repo' },
  { href: '#', label: 'Zásady' },
  { href: 'https://opensource.org/license/mit', label: 'Licence MIT' }
];

const CZU_LOCATION = 'ČZU Suchdol';
const offerFormState = {
  direction: 'to',
  tags: [],
  locations: {
    origin: '',
    destination: ''
  }
};

const ensureToastRoot = () => {
  let toast = qs('#toast-root');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-root';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  return toast;
};

const computeInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'FS';

const applyProfileSnapshot = (accountData = {}) => {
  if (!accountData?.name) return;
  state.profile.name = accountData.name;
  state.profile.initials = computeInitials(accountData.name);
  if (state.isLoggedIn) {
    updateAuthUI();
  }
};

const renderHeader = (activeKey, { navLinks = NAV_LINKS, showGuestNav = false } = {}) => {
  const header = qs('[data-component="header"]');
  if (!header) return;
  header.setAttribute('role', 'banner');

  const linksHtml = navLinks.map((link) => {
    const current = link.key === activeKey ? ' aria-current="page"' : '';
    return `<li><a class="nav__link" href="${link.href}" data-nav="${link.key}"${current}>${link.label}</a></li>`;
  }).join('');

  const firstName = state.profile.name.split(' ')[0] || state.profile.name;

  const homeHref = state.isLoggedIn ? 'index.html' : 'landing.html';

  const guestActions = `
    <div class="site-header__auth" data-auth-container>
      <div class="site-header__auth-guest" data-auth-guest>
        <button class="btn btn--ghost" type="button" data-auth-login>Přihlásit</button>
        <button class="btn btn--secondary" type="button" data-auth-register>Registrovat</button>
      </div>
    </div>
  `;

  const memberActions = `
    <div class="site-header__quick" data-auth-quick>
      <a class="btn btn--ghost" href="rides.html">Najít jízdu</a>
      <button class="btn btn--secondary" type="button" data-modal-open="offer-modal">Přidat jízdu</button>
    </div>
    <div class="site-header__auth" data-auth-container>
      <button
        class="site-header__profile"
        type="button"
        data-auth-profile
        aria-label="Profil uživatele ${state.profile.name}"
      >
        <span class="site-header__avatar" data-auth-initials aria-hidden="true">${state.profile.initials}</span>
        <span class="site-header__profile-name" data-auth-name aria-hidden="true">${firstName}</span>
      </button>
    </div>
  `;

  const actionArea = state.isLoggedIn ? memberActions : guestActions;

  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="site-header__brand" href="${homeHref}">
        <img src="assets/img/logo.svg" alt="FaremSpolu" />
        <span class="site-header__name">FaremSpolu</span>
      </a>
      <nav class="site-header__nav" aria-label="Hlavní navigace" ${showGuestNav ? '' : ''}>
        <ul class="nav__list">${linksHtml}</ul>
      </nav>
      <div class="site-header__actions">${actionArea}</div>
      <button class="site-header__menu" type="button" aria-expanded="false" aria-controls="nav-menu">
        <span class="sr-only">Otevřít navigaci</span>
        <span class="site-header__menu-line"></span>
      </button>
    </div>
    <nav class="site-header__mobile" id="nav-menu" hidden aria-label="Mobilní navigace">
      <ul class="nav__list">${linksHtml}</ul>
      <div class="site-header__actions site-header__actions--mobile">${actionArea}</div>
    </nav>
  `;
};

const renderFooter = () => {
  const footer = qs('[data-component="footer"]');
  if (!footer) return;

  const linksHtml = FOOTER_LINKS.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('');
  const homeHref = state.isLoggedIn ? 'index.html' : 'landing.html';

  footer.classList.add('footer');
  footer.setAttribute('role', 'contentinfo');
  footer.innerHTML = `
    <div class="container footer__inner">
      <a class="site-header__brand" href="${homeHref}" aria-label="Zpět na domovskou stránku">
        <img src="assets/img/logo.svg" alt="FaremSpolu" />
        <span class="site-header__name">FaremSpolu</span>
      </a>
      <ul class="footer__links">${linksHtml}</ul>
      <p class="footer__meta">&copy; <span id="year"></span> FaremSpolu — studentský projekt (Client Side Programming).</p>
    </div>
  `;
};

const ensureModals = () => {
  if (!qs('#offer-modal')) {
    const offerModal = document.createElement('div');
    offerModal.className = 'modal';
    offerModal.id = 'offer-modal';
    offerModal.hidden = true;
    offerModal.innerHTML = `
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="offer-modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="offer-modal-title">Nabídnout jízdu</h2>
          <button class="modal__close" type="button" data-modal-close aria-label="Zavřít dialog">&times;</button>
        </div>
        <div class="modal__content">
          <p>Vyplň detaily své jízdy. Ostatní spolužáci uvidí nabídku hned po schválení.</p>
          <form class="modal__form" id="offer-form">
            <label class="input" for="offer-name">
              <span class="input__label">Jméno</span>
              <input
                id="offer-name"
                name="name"
                type="text"
                required
                autocomplete="name"
                placeholder="Přihlas se pro automatické doplnění"
              />
            </label>
            <label class="input" for="offer-car">
              <span class="input__label">Auto</span>
              <select id="offer-car" name="car" required>
                <option value="" disabled selected hidden>Vyber vozidlo</option>
              </select>
              <span class="input__hint">Vozidla spravuješ v sekci Můj účet.</span>
            </label>
            <label class="input" for="offer-capacity">
              <span class="input__label">Volná místa</span>
              <input id="offer-capacity" name="capacity" type="number" min="1" max="6" required />
            </label>
            <div class="input input--switch">
              <span class="input__label">Směr jízdy</span>
              <div class="switch" data-direction-switch role="group" aria-label="Směr jízdy">
                <button class="switch__option is-active" type="button" data-direction-option="to" aria-pressed="true">
                  Na ČZU
                </button>
                <button class="switch__option" type="button" data-direction-option="from" aria-pressed="false">
                  Z ČZU
                </button>
              </div>
              <input type="hidden" name="direction" value="to" data-direction-value />
            </div>
            <label class="input" for="offer-origin" data-direction-field="origin">
              <span class="input__label">Odkud jedeš?</span>
              <input id="offer-origin" name="from" type="text" placeholder="Např. Kolín hl.n." autocomplete="off" required />
            </label>
            <label class="input" for="offer-destination" data-direction-field="destination" hidden>
              <span class="input__label">Kam jedeš?</span>
              <input
                id="offer-destination"
                name="to"
                type="text"
                placeholder="Např. Praha Suchdol"
                autocomplete="off"
              />
            </label>
            <label class="input" for="offer-departure">
              <span class="input__label">Datum a čas odjezdu</span>
              <input id="offer-departure" name="departure" type="datetime-local" required />
            </label>
            <label class="input" for="offer-notes">
              <span class="input__label">Poznámka</span>
              <textarea id="offer-notes" name="notes" rows="3" placeholder="Preferuji tichou jízdu..."></textarea>
            </label>
            <div class="input input--tags">
              <span class="input__label">Tagy (volitelné)</span>
              <div class="tag-input" data-tag-root>
                <ul class="tag-input__list" data-tag-list aria-live="polite" aria-label="Zvolené tagy"></ul>
                <div class="tag-input__controls">
                  <input
                    type="text"
                    id="offer-tag-input"
                    data-tag-input
                    placeholder="např. Wi-Fi, Tichá jízda"
                    autocomplete="off"
                    aria-label="Přidat tag"
                  />
                  <button class="btn btn--ghost" type="button" data-tag-add>Přidat</button>
                </div>
                <p class="input__hint">Zadej až 6 tagů. Pomohou studentům najít tvou jízdu.</p>
              </div>
              <input type="hidden" name="tags" data-tag-hidden />
            </div>
            <button class="btn btn--primary" type="submit">Odeslat nabídku</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(offerModal);
  }

  if (!qs('#request-modal')) {
    const requestModal = document.createElement('div');
    requestModal.className = 'modal';
    requestModal.id = 'request-modal';
    requestModal.hidden = true;
    requestModal.innerHTML = `
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="request-modal-title">Žádost o místo</h2>
          <button class="modal__close" type="button" data-modal-close aria-label="Zavřít dialog">&times;</button>
        </div>
        <div class="modal__content">
          <p data-request-summary>O jakou jízdu máš zájem?</p>
          <form class="modal__form" id="request-form">
            <label class="input" for="request-name">
              <span class="input__label">Jméno</span>
              <input id="request-name" name="name" type="text" required autocomplete="name" />
            </label>
            <label class="input" for="request-email">
              <span class="input__label">Email</span>
              <input id="request-email" name="email" type="email" required autocomplete="email" />
            </label>
            <label class="input" for="request-message">
              <span class="input__label">Zpráva řidiči</span>
              <textarea id="request-message" name="message" rows="3" placeholder="Např. vezu si batoh s notebookem" required></textarea>
            </label>
            <button class="btn btn--primary" type="submit">Odeslat žádost</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(requestModal);
  }

  if (!qs('#login-modal')) {
    const loginModal = document.createElement('div');
    loginModal.className = 'modal';
    loginModal.id = 'login-modal';
    loginModal.hidden = true;
    loginModal.innerHTML = `
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="login-modal-title">Přihlášení do FaremSpolu</h2>
          <button class="modal__close" type="button" data-modal-close aria-label="Zavřít dialog">&times;</button>
        </div>
        <div class="modal__content">
          <p>Vítej! Přihlas se svým školním účtem a pokračuj k nabídkám jízd.</p>
          <form class="modal__form" id="login-form" novalidate>
            <label class="input" for="login-email">
              <span class="input__label">Školní e-mail</span>
              <input id="login-email" name="email" type="email" autocomplete="email" required />
            </label>
            <label class="input" for="login-password">
              <span class="input__label">Heslo</span>
              <input id="login-password" name="password" type="password" autocomplete="current-password" required />
            </label>
            <p class="auth-error" role="alert" aria-live="polite" data-auth-error></p>
            <button class="btn btn--primary" type="submit">Přihlásit</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(loginModal);
  }

  if (!qs('#register-modal')) {
    const registerModal = document.createElement('div');
    registerModal.className = 'modal';
    registerModal.id = 'register-modal';
    registerModal.hidden = true;
    registerModal.innerHTML = `
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="register-modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="register-modal-title">Registrace pro studenty ČZU</h2>
          <button class="modal__close" type="button" data-modal-close aria-label="Zavřít dialog">&times;</button>
        </div>
        <div class="modal__content">
          <p>Registrace je dostupná pouze pro studenty a zaměstnance ČZU. Použij školní e-mail.</p>
          <form class="modal__form" id="register-form" novalidate>
            <label class="input" for="register-email">
              <span class="input__label">Školní e-mail (czu.cz / studenti.czu.cz)</span>
              <input id="register-email" name="email" type="email" autocomplete="email" required />
            </label>
            <label class="input" for="register-password">
              <span class="input__label">Heslo</span>
              <input id="register-password" name="password" type="password" autocomplete="new-password" required />
              <span class="input__hint">Min. 6 znaků, alespoň jedno číslo a velké písmeno.</span>
            </label>
            <label class="input" for="register-confirm">
              <span class="input__label">Heslo znovu</span>
              <input id="register-confirm" name="confirm" type="password" autocomplete="new-password" required />
            </label>
            <div class="split split--compact">
              <label class="input" for="register-first-name">
                <span class="input__label">Jméno</span>
                <input id="register-first-name" name="firstName" type="text" autocomplete="given-name" required />
              </label>
              <label class="input" for="register-last-name">
                <span class="input__label">Příjmení</span>
                <input id="register-last-name" name="lastName" type="text" autocomplete="family-name" required />
              </label>
            </div>
            <label class="input" for="register-gender">
              <span class="input__label">Gender</span>
              <select id="register-gender" name="gender" required>
                <option value="" disabled selected hidden>Zvol možnost</option>
                <option value="male">Muž</option>
                <option value="female">Žena</option>
                <option value="other">Jiné</option>
              </select>
            </label>
            <p class="auth-error" role="alert" aria-live="polite" data-auth-error></p>
            <button class="btn btn--primary" type="submit">Registrovat</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(registerModal);
  }
};

const populateOfferCars = () => {
  const select = qs('#offer-car');
  if (!select) return;
  const hasVehicles = state.userVehicles.length > 0;
  const placeholderText = hasVehicles
    ? 'Vyber vozidlo'
    : 'Nejdřív si přidej auto v sekci Můj účet';
  select.innerHTML = `<option value="" disabled selected hidden>${placeholderText}</option>`;

  state.userVehicles.forEach((vehicle) => {
    const option = document.createElement('option');
    option.value = vehicle.id;
    const label = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
    option.textContent = vehicle.plate ? `${label} · ${vehicle.plate}`.trim() : label || vehicle.plate || 'Moje vozidlo';
    option.dataset.plate = vehicle.plate;
    select.appendChild(option);
  });

  const addOption = document.createElement('option');
  addOption.value = 'new';
  addOption.textContent = 'Přidat nové vozidlo';
  select.appendChild(addOption);
};

export const syncUserVehicles = (vehicles = []) => {
  state.userVehicles = Array.isArray(vehicles) ? [...vehicles] : [];
  populateOfferCars();
};

const updateDirectionButtons = () => {
  qsa('[data-direction-option]').forEach((button) => {
    const targetDirection = button.getAttribute('data-direction-option');
    const isActive = targetDirection === offerFormState.direction;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

const updateDirectionFields = () => {
  const form = qs('#offer-form');
  if (!form) return;
  const originField = qs('[data-direction-field="origin"]', form);
  const destinationField = qs('[data-direction-field="destination"]', form);
  const originInput = qs('#offer-origin', form);
  const destinationInput = qs('#offer-destination', form);
  const directionValue = qs('[data-direction-value]', form);
  if (!originField || !destinationField || !originInput || !destinationInput) return;

  const direction = offerFormState.direction;
  if (directionValue) {
    directionValue.value = direction;
  }

  if (direction === 'to') {
    originField.hidden = false;
    destinationField.hidden = true;
    originInput.required = true;
    destinationInput.required = false;
    originInput.readOnly = false;
    destinationInput.readOnly = true;
    originInput.value = offerFormState.locations.origin || '';
    destinationInput.value = CZU_LOCATION;
  } else {
    originField.hidden = true;
    destinationField.hidden = false;
    destinationInput.required = true;
    originInput.required = false;
    destinationInput.readOnly = false;
    originInput.readOnly = true;
    originInput.value = CZU_LOCATION;
    destinationInput.value = offerFormState.locations.destination || '';
  }
};

const resetOfferFormState = () => {
  offerFormState.direction = 'to';
  offerFormState.tags = [];
  offerFormState.locations.origin = '';
  offerFormState.locations.destination = '';
};

const setOfferDirection = (direction) => {
  const next = direction === 'from' ? 'from' : 'to';
  if (offerFormState.direction === next) return;
  offerFormState.direction = next;
  updateDirectionButtons();
  updateDirectionFields();
};

const refreshOfferTags = () => {
  const form = qs('#offer-form');
  if (!form) return;
  const list = qs('[data-tag-list]', form);
  const hiddenInput = qs('[data-tag-hidden]', form);
  if (hiddenInput) {
    hiddenInput.value = offerFormState.tags.join(',');
  }
  if (!list) return;
  list.innerHTML = '';
  if (!offerFormState.tags.length) {
    const empty = document.createElement('li');
    empty.className = 'tag-input__empty';
    empty.textContent = 'Zatím bez tagů.';
    list.appendChild(empty);
    return;
  }
  offerFormState.tags.forEach((tag) => {
    const item = document.createElement('li');
    item.className = 'tag-input__item';
    const label = document.createElement('span');
    label.textContent = tag;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'tag-input__remove';
    remove.dataset.tagRemove = tag;
    remove.innerHTML = `<span class="sr-only">Odebrat ${tag}</span>&times;`;
    item.append(label, remove);
    list.appendChild(item);
  });
};

const addOfferTag = (value) => {
  const clean = value?.trim().replace(/\s+/g, ' ');
  if (!clean) {
    return false;
  }
  if (offerFormState.tags.length >= 6) {
    showToast('Můžeš přidat maximálně 6 tagů.', 'error');
    return false;
  }
  const exists = offerFormState.tags.some((tag) => tag.toLowerCase() === clean.toLowerCase());
  if (exists) {
    showToast('Tento tag už máš přidaný.', 'error');
    return false;
  }
  offerFormState.tags = [...offerFormState.tags, clean];
  refreshOfferTags();
  return true;
};

const removeOfferTag = (value) => {
  offerFormState.tags = offerFormState.tags.filter((tag) => tag !== value);
  refreshOfferTags();
};

const prepareOfferForm = () => {
  const offerForm = qs('#offer-form');
  if (!offerForm) return;
  offerForm.reset();
  resetOfferFormState();
  const nameInput = qs('#offer-name', offerForm);
  if (nameInput) {
    if (state.isLoggedIn) {
      nameInput.value = state.profile.name;
      nameInput.readOnly = true;
      nameInput.setAttribute('aria-readonly', 'true');
    } else {
      nameInput.value = '';
      nameInput.readOnly = false;
      nameInput.removeAttribute('aria-readonly');
    }
  }
  populateOfferCars();
  updateDirectionButtons();
  updateDirectionFields();
  refreshOfferTags();
};

const setupOfferFormControls = () => {
  const form = qs('#offer-form');
  if (!form || form.dataset.enhanced) return;
  form.dataset.enhanced = 'true';

  const carSelect = qs('#offer-car', form);
  carSelect?.addEventListener('change', (event) => {
    if (event.target.value === 'new') {
      showToast('Otevřu správu vozidel…');
      closeModal();
      window.location.href = 'account.html#vehicles';
    }
  });

  qsa('[data-direction-option]', form).forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-direction-option');
      setOfferDirection(target);
    });
  });

  const originInput = qs('#offer-origin', form);
  const destinationInput = qs('#offer-destination', form);

  originInput?.addEventListener('input', (event) => {
    offerFormState.locations.origin = event.target.value;
  });

  destinationInput?.addEventListener('input', (event) => {
    offerFormState.locations.destination = event.target.value;
  });

  const tagInput = qs('[data-tag-input]', form);
  const addTagButton = qs('[data-tag-add]', form);

  const handleAddTag = () => {
    if (!tagInput) return;
    const added = addOfferTag(tagInput.value);
    if (added) {
      tagInput.value = '';
      tagInput.focus();
    }
  };

  addTagButton?.addEventListener('click', (event) => {
    event.preventDefault();
    handleAddTag();
  });

  tagInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  });

  delegate(
    'click',
    '[data-tag-remove]',
    function (event) {
      event.preventDefault();
      const value = this.dataset.tagRemove;
      if (value) {
        removeOfferTag(value);
      }
    },
    form
  );

  form.addEventListener('reset', () => {
    resetOfferFormState();
    updateDirectionButtons();
    updateDirectionFields();
    refreshOfferTags();
  });

  refreshOfferTags();
  updateDirectionButtons();
  updateDirectionFields();
};

const highlightNav = (activeKey) => {
  qsa('[data-nav]').forEach((link) => {
    const isActive = link.getAttribute('data-nav') === activeKey;
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const openModal = (id, trigger) => {
  const modal = document.getElementById(id);
  if (!modal || !modal.hidden) return;

  modal.hidden = false;
  state.activeModal = modal;
  modal.dataset.openedBy = trigger?.id || '';
  const focusable = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
  const firstFocusable = focusable[0];
  state.modalCleanup = trapFocus(modal);
  document.body.style.overflow = 'hidden';

  if (modal.id === 'offer-modal') {
    prepareOfferForm();
  }

  if (modal.id === 'request-modal' && trigger) {
    const summary = qs('[data-request-summary]', modal);
    const rideTitle = trigger.getAttribute('data-ride-title');
    summary.textContent = rideTitle
      ? `Žádost o jízdu: ${rideTitle}`
      : 'Vyber si jízdu, o kterou chceš požádat.';
  }

  if (modal.id === 'login-modal' || modal.id === 'register-modal') {
    const form = qs('form', modal);
    form?.reset();
    const errorBox = form ? qs('[data-auth-error]', form) : null;
    if (errorBox) {
      errorBox.textContent = '';
    }
  }

  requestAnimationFrame(() => firstFocusable?.focus());
};

const closeModal = () => {
  if (!state.activeModal) return;
  const modal = state.activeModal;
  modal.hidden = true;
  state.modalCleanup?.();
  state.modalCleanup = null;
  document.body.style.overflow = '';
  const openerId = modal.dataset.openedBy;
  const opener = openerId ? document.getElementById(openerId) : null;
  opener?.focus();
  state.activeModal = null;
};

const setupModalInteractions = () => {
  ensureModals();
  setupOfferFormControls();

  delegate('click', '[data-modal-open]', function (event) {
    event.preventDefault();
    const targetId = this.getAttribute('data-modal-open');
    if (!targetId) return;
    if (!this.id) {
      this.id = `modal-trigger-${Date.now()}`;
    }
    openModal(targetId, this);
  });

  delegate('click', '[data-modal-close]', (event) => {
    event.preventDefault();
    closeModal();
  });

  document.addEventListener('click', (event) => {
    if (!state.activeModal) return;
    if (event.target === state.activeModal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.activeModal) {
      closeModal();
    }
  });

  const offerForm = qs('#offer-form');
  if (offerForm && !offerForm.dataset.bound) {
    offerForm.dataset.bound = 'true';
    offerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateDirectionFields();
      if (!offerForm.checkValidity()) {
        offerForm.reportValidity();
        return;
      }
      const originInput = qs('#offer-origin', offerForm);
      const destinationInput = qs('#offer-destination', offerForm);
      if (offerFormState.direction === 'to' && !originInput?.value.trim()) {
        showToast('Doplň odkud jedeš.', 'error');
        originInput?.focus();
        return;
      }
      if (offerFormState.direction === 'from' && !destinationInput?.value.trim()) {
        showToast('Doplň kam jedeš.', 'error');
        destinationInput?.focus();
        return;
      }
      const formData = new FormData(offerForm);
      const fromValue = offerFormState.direction === 'to' ? originInput?.value.trim() : CZU_LOCATION;
      const toValue = offerFormState.direction === 'to' ? CZU_LOCATION : destinationInput?.value.trim();
      formData.set('from', fromValue || '');
      formData.set('to', toValue || '');
      formData.set('direction', offerFormState.direction);
      formData.set('tags', offerFormState.tags.join(','));
      const payload = Object.fromEntries(formData.entries());
      payload.tags = [...offerFormState.tags];
      const selectedVehicle = state.userVehicles.find((vehicle) => vehicle.id === payload.car);
      if (selectedVehicle) {
        payload.vehicle = selectedVehicle;
      }
      console.info('Odeslání nabídky jízdy', payload);
      // TODO: Odeslat data do PHP API.
      offerForm.reset();
      resetOfferFormState();
      refreshOfferTags();
      updateDirectionButtons();
      updateDirectionFields();
      closeModal();
      showToast('Jízda byla odeslána ke schválení.');
    });
  }

  const requestForm = qs('#request-form');
  if (requestForm && !requestForm.dataset.bound) {
    requestForm.dataset.bound = 'true';
    requestForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!requestForm.checkValidity()) {
        requestForm.reportValidity();
        return;
      }
      const formData = new FormData(requestForm);
      const payload = Object.fromEntries(formData.entries());
      console.info('Žádost o místo', payload);
      // TODO: Odeslat žádost na serverovou část.
      requestForm.reset();
      closeModal();
      showToast('Žádost byla odeslána řidiči.');
    });
  }
};

const setupHeaderMenu = () => {
  const menuButton = qs('.site-header__menu');
  const mobileNav = qs('#nav-menu');
  if (!menuButton || !mobileNav) return;

  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    toggleHidden(mobileNav, expanded);
  });

  delegate(
    'click',
    '.nav__link',
    () => {
      if (window.innerWidth < 768) {
        menuButton.setAttribute('aria-expanded', 'false');
        toggleHidden(mobileNav, true);
      }
    },
    mobileNav
  );
};

const setupFooterMeta = () => {
  const yearEl = qs('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

const loadAccountSnapshot = async () => {
  if (state.accountLoaded || state.accountLoading || !state.isLoggedIn) return;
  state.accountLoading = true;
  try {
    const account = await getAccountOverview();
    if (account?.vehicles) {
      syncUserVehicles(account.vehicles);
    }
    applyProfileSnapshot(account);
    state.accountLoaded = true;
    state.accountLoading = false;
  } catch (error) {
    console.warn('Nepodařilo se načíst údaje účtu pro nabídku jízdy', error);
    state.accountLoading = false;
  }
};

const readLoginState = () => {
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored === null) return false;
    return stored === 'true';
  } catch (error) {
    console.warn('Nepodařilo se načíst stav přihlášení', error);
    return false;
  }
};

const persistLoginState = (value) => {
  try {
    if (value) {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Nepodařilo se uložit stav přihlášení', error);
  }
};

const updateAuthUI = () => {
  qsa('[data-auth-container]').forEach((container) => {
    const profile = qs('[data-auth-profile]', container);
    const name = qs('[data-auth-name]', container);
    const initials = qs('[data-auth-initials]', container);

    if (!profile) return;

    if (state.isLoggedIn) {
      profile.removeAttribute('hidden');
      if (name) {
        name.textContent = state.profile.name.split(' ')[0] || state.profile.name;
      }
      if (initials) {
        initials.textContent = state.profile.initials;
      }
    } else {
      profile.setAttribute('hidden', '');
    }
  });

};

const loginUser = (overrideName) => {
  if (state.isLoggedIn) return;
  if (overrideName) {
    state.profile.name = overrideName;
    state.profile.initials = computeInitials(overrideName);
  }
  state.isLoggedIn = true;
  persistLoginState(true);
  updateAuthUI();
  showToast('Vítej zpět ve FaremSpolu!');
  window.location.href = 'index.html';
};

const handleLoginSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const errorBox = qs('[data-auth-error]', form);
  if (!email || !password) {
    errorBox.textContent = 'Vyplň prosím e-mail i heslo.';
    return;
  }
  errorBox.textContent = '';
  closeModal();
  loginUser();
};

const handleRegisterSubmit = (event) => {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const confirm = form.confirm.value.trim();
  const firstName = form.firstName.value.trim();
  const lastName = form.lastName.value.trim();
  const gender = form.gender.value;
  const errorBox = qs('[data-auth-error]', form);

  const emailPattern = /@(czu\.cz|studenti\.czu\.cz)$/i;
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(password);

  if (!emailPattern.test(email)) {
    errorBox.textContent = 'Použij školní e-mail s doménou czu.cz nebo studenti.czu.cz.';
    return;
  }
  if (!hasMinLength || !hasNumber || !hasUpper) {
    errorBox.textContent = 'Heslo musí mít min. 6 znaků, obsahovat číslo a velké písmeno.';
    return;
  }
  if (password !== confirm) {
    errorBox.textContent = 'Hesla se neshodují.';
    return;
  }
  if (!firstName || !lastName || !gender) {
    errorBox.textContent = 'Doplň své jméno, příjmení i gender.';
    return;
  }

  errorBox.textContent = '';
  const fullName = `${firstName} ${lastName}`.trim();
  closeModal();
  loginUser(fullName);
};

const setupAuthControls = () => {
  ensureModals();
  state.isLoggedIn = readLoginState();
  updateAuthUI();

  if (state.authBound) return;

  delegate('click', '[data-auth-login]', (event) => {
    event.preventDefault();
    openModal('login-modal', event.currentTarget);
  });

  delegate('click', '[data-auth-register]', (event) => {
    event.preventDefault();
    openModal('register-modal', event.currentTarget);
  });

  delegate('click', '[data-auth-profile]', (event) => {
    event.preventDefault();
    window.location.href = 'account.html';
  });

  const loginForm = qs('#login-form');
  if (loginForm && !loginForm.dataset.bound) {
    loginForm.dataset.bound = 'true';
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const registerForm = qs('#register-form');
  if (registerForm && !registerForm.dataset.bound) {
    registerForm.dataset.bound = 'true';
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  state.authBound = true;
};

export const showToast = (message, type = 'info') => {
  const toast = ensureToastRoot();
  toast.textContent = message;
  toast.classList.remove('toast--visible', 'toast--error');
  if (type === 'error') {
    toast.classList.add('toast--error');
  }
  window.clearTimeout(state.toastTimeout);
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  state.toastTimeout = window.setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 3500);
};

export const initBase = (activeKey = '', options = {}) => {
  const { allowGuests = false, guestNavLinks = GUEST_NAV_LINKS, resetAuth = false } = options;

  if (resetAuth) {
    persistLoginState(false);
  }

  state.isLoggedIn = readLoginState();

  const isLandingPage = document.body?.dataset.page === 'landing' || window.location.pathname.endsWith('landing.html');

  if (!state.isLoggedIn && !isLandingPage) {
    window.location.replace('landing.html');
    return;
  }

  if (allowGuests && state.isLoggedIn && isLandingPage) {
    window.location.replace('index.html');
    return;
  }

  const navLinks = state.isLoggedIn ? NAV_LINKS : guestNavLinks;

  renderHeader(activeKey, { navLinks, showGuestNav: !state.isLoggedIn && allowGuests });
  renderFooter();
  ensureToastRoot();
  setupHeaderMenu();
  setupAuthControls();
  setupFooterMeta();
  setupModalInteractions();
  highlightNav(activeKey);
  initScrollAnimations();
  loadAccountSnapshot();
};

export const utils = { openModal, closeModal };
