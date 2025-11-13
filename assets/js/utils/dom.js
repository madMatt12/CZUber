// DOM helper utilities for FaremSpolu homepage
export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const toggleHidden = (element, force) => {
  if (!element) return;
  element.hidden = typeof force === 'boolean' ? force : !element.hidden;
};

export const trapFocus = (container) => {
  if (!container) return () => {};
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  const getFocusable = () => qsa(focusableSelectors.join(','), container).filter((el) => !el.hidden);

  const handleKeydown = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKeydown);

  return () => container.removeEventListener('keydown', handleKeydown);
};

export const delegate = (eventName, selector, handler, scope = document) => {
  const listener = (event) => {
    const target = event.target.closest(selector);
    if (target && scope.contains(target)) {
      handler.call(target, event);
    }
  };

  scope.addEventListener(eventName, listener);
  return () => scope.removeEventListener(eventName, listener);
};
