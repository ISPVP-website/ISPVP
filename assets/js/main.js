const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const themeButtons = document.querySelectorAll('.theme-option');
const THEME_KEY = 'ispvp-theme';

const validThemes = new Set(['fungal', 'coastal', 'monograph']);

function applyTheme(theme) {
  const selected = validThemes.has(theme) ? theme : 'fungal';
  if (selected === 'fungal') {
    document.body.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', selected);
    document.documentElement.setAttribute('data-theme', selected);
  }

  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === selected;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

let savedTheme = 'fungal';
try {
  savedTheme = localStorage.getItem(THEME_KEY) || 'fungal';
} catch (error) {
  savedTheme = 'fungal';
}

applyTheme(savedTheme);

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = button.dataset.theme || 'fungal';
    applyTheme(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      // Ignore storage failures (private mode or restricted environment).
    }
  });
});

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
}

if (nav) {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  nav.querySelectorAll('a').forEach((link) => {
    const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}
