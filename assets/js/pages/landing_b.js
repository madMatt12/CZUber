import { initBase } from '../main.js';

const main = () => {
  initBase('home', { allowGuests: true, resetAuth: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
