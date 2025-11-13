import { qs, qsa, toggleHidden, trapFocus, delegate } from './utils/dom.js';
import { initScrollAnimations } from './utils/animate.js';

document.documentElement.classList.add('has-js');

const state = {
  activeModal: null,
  modalCleanup: null,
  toastTimeout: null,
  isAuthenticated: false,
  authBound: false,
  profile: {
    name: 'Matěj Kořínek',
    initials: 'MK'
  }
};

const AUTH_STORAGE_KEY = 'faremspolu-authenticated';

const NAV_LINKS = [
  { href: 'index.html', label: 'Domů', key: 'home' },
  { href: 'rides.html', label: 'Hledat jízdu', key: 'rides' },
  { href: 'account.html', label: 'Můj účet', key: 'account' },
  { href: 'index.html#next-steps', label: 'O projektu', key: 'about' }
];

const FOOTER_LINKS = [
  { href: 'mailto:team@faremspolu.cz', label: 'Kontakt' },
  { href: 'https://github.com/czu-students/faremspolu', label: 'GitHub repo' },
  { href: '#', label: 'Zásady' },
  { href: 'https://opensource.org/license/mit', label: 'Licence MIT' }
];

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

const renderHeader = (activeKey) => {
  const header = qs('[data-component="header"]');
  if (!header) return;
  header.setAttribute('role', 'banner');

  const linksHtml = NAV_LINKS.map((link) => {
    const current = link.key === activeKey ? ' aria-current="page"' : '';
    return `<li><a class="nav__link" href="${link.href}" data-nav="${link.key}"${current}>${link.label}</a></li>`;
  }).join('');

  const firstName = state.profile.name.split(' ')[0] || state.profile.name;

  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="site-header__brand" href="index.html">
        <img src="assets/img/logo.svg" alt="FaremSpolu" />
        <span class="site-header__name">FaremSpolu</span>
      </a>
      <nav class="site-header__nav" aria-label="Hlavní navigace">
        <ul class="nav__list">${linksHtml}</ul>
      </nav>
      <div class="site-header__actions">
        <div class="site-header__auth" data-auth-container>
          <div class="site-header__auth-guest" data-auth-guest>
            <button class="btn btn--ghost" type="button" data-auth-login>Přihlásit</button>
            <button class="btn btn--secondary" type="button" data-auth-register>Registrovat</button>
          </div>
          <button
            class="site-header__profile"
            type="button"
            data-auth-profile
            hidden
            aria-label="Profil uživatele ${state.profile.name}"
          >
            <span class="site-header__avatar" data-auth-initials aria-hidden="true">${state.profile.initials}</span>
            <span class="site-header__profile-name" data-auth-name aria-hidden="true">${firstName}</span>
          </button>
        </div>
        <div class="site-header__cta">
          <a class="btn btn--ghost" href="rides.html">Najít jízdu</a>
          <button class="btn btn--primary" data-modal-open="offer-modal">Přidat jízdu</button>
        </div>
      </div>
      <button class="site-header__menu" type="button" aria-expanded="false" aria-controls="nav-menu">
        <span class="sr-only">Otevřít navigaci</span>
        <span class="site-header__menu-line"></span>
      </button>
    </div>
    <nav class="site-header__mobile" id="nav-menu" hidden aria-label="Mobilní navigace">
      <ul class="nav__list">${linksHtml}</ul>
      <div class="site-header__auth site-header__auth--mobile" data-auth-container>
        <div class="site-header__auth-guest" data-auth-guest>
          <button class="btn btn--ghost" type="button" data-auth-login>Přihlásit</button>
          <button class="btn btn--secondary" type="button" data-auth-register>Registrovat</button>
        </div>
        <button
          class="site-header__profile"
          type="button"
          data-auth-profile
          hidden
          aria-label="Profil uživatele ${state.profile.name}"
        >
          <span class="site-header__avatar" data-auth-initials aria-hidden="true">${state.profile.initials}</span>
          <span class="site-header__profile-name" data-auth-name aria-hidden="true">${firstName}</span>
        </button>
      </div>
      <div class="site-header__cta-mobile">
        <a class="btn btn--ghost" href="rides.html">Najít jízdu</a>
        <button class="btn btn--primary" data-modal-open="offer-modal">Přidat jízdu</button>
      </div>
    </nav>
  `;
};

const renderFooter = () => {
  const footer = qs('[data-component="footer"]');
  if (!footer) return;

  const linksHtml = FOOTER_LINKS.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('');

  footer.classList.add('footer');
  footer.setAttribute('role', 'contentinfo');
  footer.innerHTML = `
    <div class="container footer__inner">
      <a class="site-header__brand" href="index.html" aria-label="Zpět na domovskou stránku">
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
              <input id="offer-name" name="name" type="text" required autocomplete="name" />
            </label>
            <label class="input" for="offer-car">
              <span class="input__label">Auto (nepovinné)</span>
              <input id="offer-car" name="car" type="text" placeholder="Škoda Fabia" />
            </label>
            <label class="input" for="offer-capacity">
              <span class="input__label">Volná místa</span>
              <input id="offer-capacity" name="capacity" type="number" min="1" max="6" required />
            </label>
            <label class="input" for="offer-departure">
              <span class="input__label">Datum a čas odjezdu</span>
              <input id="offer-departure" name="departure" type="datetime-local" required />
            </label>
            <label class="input" for="offer-notes">
              <span class="input__label">Poznámka</span>
              <textarea id="offer-notes" name="notes" rows="3" placeholder="Preferuji tichou jízdu..."></textarea>
            </label>
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

  if (modal.id === 'request-modal' && trigger) {
    const summary = qs('[data-request-summary]', modal);
    const rideTitle = trigger.getAttribute('data-ride-title');
    summary.textContent = rideTitle
      ? `Žádost o jízdu: ${rideTitle}`
      : 'Vyber si jízdu, o kterou chceš požádat.';
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
      if (!offerForm.checkValidity()) {
        offerForm.reportValidity();
        return;
      }
      const formData = new FormData(offerForm);
      const payload = Object.fromEntries(formData.entries());
      console.info('Odeslání nabídky jízdy', payload);
      // TODO: Odeslat data do PHP API.
      offerForm.reset();
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

const readAuthState = () => {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('Nepodařilo se načíst stav přihlášení', error);
    return false;
  }
};

const persistAuthState = (value) => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.warn('Nepodařilo se uložit stav přihlášení', error);
  }
};

const updateAuthUI = () => {
  qsa('[data-auth-container]').forEach((container) => {
    const guest = qs('[data-auth-guest]', container);
    const profile = qs('[data-auth-profile]', container);
    const name = qs('[data-auth-name]', container);
    const initials = qs('[data-auth-initials]', container);

    if (!profile) return;

    if (state.isAuthenticated) {
      guest?.setAttribute('hidden', '');
      profile.removeAttribute('hidden');
      if (name) {
        name.textContent = state.profile.name.split(' ')[0] || state.profile.name;
      }
      if (initials) {
        initials.textContent = state.profile.initials;
      }
    } else {
      guest?.removeAttribute('hidden');
      profile.setAttribute('hidden', '');
    }
  });
};

const loginUser = () => {
  if (state.isAuthenticated) return;
  state.isAuthenticated = true;
  persistAuthState(true);
  updateAuthUI();
  showToast('Vítej zpět, Matěji!');
};

const setupAuthControls = () => {
  state.isAuthenticated = readAuthState();
  updateAuthUI();

  if (state.authBound) return;

  delegate('click', '[data-auth-login]', (event) => {
    event.preventDefault();
    loginUser();
  });

  delegate('click', '[data-auth-register]', (event) => {
    event.preventDefault();
    showToast('Registrace bude brzy dostupná.');
  });

  delegate('click', '[data-auth-profile]', (event) => {
    event.preventDefault();
    showToast('Správa profilu je ve vývoji.');
  });

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

export const initBase = (activeKey = '') => {
  renderHeader(activeKey);
  renderFooter();
  ensureToastRoot();
  setupHeaderMenu();
  setupAuthControls();
  setupFooterMeta();
  setupModalInteractions();
  highlightNav(activeKey);
  initScrollAnimations();
};

export const utils = { openModal, closeModal };
