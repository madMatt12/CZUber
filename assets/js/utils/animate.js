// IntersectionObserver-based animations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -80px 0px'
};

export const initScrollAnimations = (elements = document.querySelectorAll('[data-animate]')) => {
  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);

  elements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
};
