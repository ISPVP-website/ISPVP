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

const registrationForm = document.querySelector('[data-checkout-form]');
const donationForm = document.querySelector('[data-donation-form]');

if (registrationForm || donationForm) {
  const params = new URLSearchParams(window.location.search);
  const useLocalApi = params.get('localApi') === '1';
  const defaultCheckoutApiBase = useLocalApi
    ? 'http://127.0.0.1:3000'
    : 'https://ispvp-payments-api.vercel.app';

  window.ISPVP_CONFIG = window.ISPVP_CONFIG || {
    CHECKOUT_API_BASE: defaultCheckoutApiBase
  };

  async function submitCheckout(payload, messageEl, submitEl, pendingMessage) {
    if (submitEl) {
      submitEl.disabled = true;
    }

    if (messageEl) {
      messageEl.textContent = pendingMessage || 'Preparing secure checkout...';
    }

    try {
      const response = await fetch(`${window.ISPVP_CONFIG.CHECKOUT_API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Unable to start checkout session.');
      }

      window.location.href = data.url;
    } catch (error) {
      if (messageEl) {
        messageEl.textContent = error.message || 'Checkout failed. Please try again.';
      }
      if (submitEl) {
        submitEl.disabled = false;
      }
    }
  }

  if (registrationForm) {
    const feePreview = document.getElementById('selected-fee');
    const message = document.getElementById('checkout-message');
    const submitButton = registrationForm.querySelector('[data-submit-button]');
    const ticketType = document.getElementById('ticketType');
    const pricingWindow = document.getElementById('pricingWindow');

    const feeTable = {
      early: { regular: 450, research: 350, student: 250 },
      general: { regular: 500, research: 400, student: 300 },
      late: { regular: 550, research: 450, student: 350 }
    };

    function toUtcDate(year, month, day) {
      return new Date(Date.UTC(year, month - 1, day));
    }

    function getActivePricingWindow() {
      const now = new Date();
      const todayUtc = toUtcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

      const generalStart = toUtcDate(2026, 8, 2);
      const generalEnd = toUtcDate(2026, 8, 23);
      const lateStart = toUtcDate(2026, 8, 24);
      const lateEnd = toUtcDate(2026, 9, 25);

      // Early bird is intentionally available now until general opens.
      if (todayUtc < generalStart) {
        return 'early';
      }

      if (todayUtc >= generalStart && todayUtc <= generalEnd) {
        return 'general';
      }

      if (todayUtc >= lateStart && todayUtc <= lateEnd) {
        return 'late';
      }

      return '';
    }

    function applyPricingWindowAvailability() {
      const activeWindow = getActivePricingWindow();
      const windowOptions = Array.from(pricingWindow?.options || []);

      windowOptions.forEach((option) => {
        option.disabled = Boolean(activeWindow) && option.value !== activeWindow;
      });

      if (activeWindow && pricingWindow) {
        pricingWindow.value = activeWindow;
      }

      if (!activeWindow && message) {
        message.textContent = 'Registration is currently closed. Please check the registration schedule.';
      }
    }

    function updateFeePreview() {
      const ticket = ticketType?.value || 'regular';
      const windowKey = pricingWindow?.value || 'early';
      const amount = feeTable[windowKey]?.[ticket] || feeTable.early.regular;
      if (feePreview) {
        feePreview.textContent = `USD ${amount}`;
      }
    }

    ticketType?.addEventListener('change', updateFeePreview);
    pricingWindow?.addEventListener('change', updateFeePreview);
    applyPricingWindowAvailability();
    updateFeePreview();

    registrationForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        checkoutType: 'registration',
        name: document.getElementById('fullName')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '',
        affiliation: document.getElementById('affiliation')?.value?.trim() || '',
        businessTitle: document.getElementById('businessTitle')?.value?.trim() || '',
        ticketType: ticketType?.value || 'regular',
        pricingWindow: pricingWindow?.value || 'early'
      };

      if (!payload.name || !payload.email || !payload.affiliation || !payload.businessTitle) {
        if (message) {
          message.textContent = 'Please complete all required fields.';
        }
        return;
      }

      if (!getActivePricingWindow()) {
        if (message) {
          message.textContent = 'Registration is currently closed. Please check the registration schedule.';
        }
        return;
      }

      await submitCheckout(payload, message, submitButton, 'Preparing secure checkout...');
    });
  }

  if (donationForm) {
    const donationMessage = document.getElementById('donation-message');
    const donationSubmit = donationForm.querySelector('[data-donation-submit]');

    donationForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        checkoutType: 'donation',
        name: document.getElementById('donorName')?.value?.trim() || '',
        email: document.getElementById('donorEmail')?.value?.trim() || '',
        affiliation: document.getElementById('donorAffiliation')?.value?.trim() || 'ISPVP Supporter'
      };

      if (!payload.name || !payload.email) {
        if (donationMessage) {
          donationMessage.textContent = 'Please enter name and email.';
        }
        return;
      }

      await submitCheckout(payload, donationMessage, donationSubmit, 'Preparing donation checkout...');
    });
  }
}
