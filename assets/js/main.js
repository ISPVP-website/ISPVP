const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

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

const slideshows = Array.from(document.querySelectorAll('[data-slideshow]'));

slideshows.forEach((slideshow) => {
  const slides = Array.from(slideshow.querySelectorAll('[data-slide]'));
  const dotsWrap = slideshow.querySelector('[data-slide-dots]');
  const prev = slideshow.querySelector('[data-slide-prev]');
  const next = slideshow.querySelector('[data-slide-next]');
  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => {
      index = i;
      render();
      restartAuto();
    });
    dotsWrap?.appendChild(dot);
    return dot;
  });

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
  }

  function go(step) {
    index = (index + step + slides.length) % slides.length;
    render();
  }

  function startAuto() {
    timer = window.setInterval(() => {
      go(1);
    }, 5000);
  }

  function restartAuto() {
    if (timer) {
      window.clearInterval(timer);
    }
    startAuto();
  }

  prev?.addEventListener('click', () => {
    go(-1);
    restartAuto();
  });

  next?.addEventListener('click', () => {
    go(1);
    restartAuto();
  });

  render();
  startAuto();
});
