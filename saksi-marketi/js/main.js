/* ============================================
   YESILDOKANUS PEYZAJ — MAIN JAVASCRIPT
   ============================================ */

'use strict';

/* ---------- HEADER SCROLL ---------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
  backToTop.classList.toggle('visible', window.scrollY > 400);
});

/* ---------- HAMBURGER MENU ---------- */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// Close on nav link click
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ---------- BACK TO TOP ---------- */
const backToTop = document.getElementById('backToTop');
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- SCROLL REVEAL ---------- */
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

function addReveal(selector, stagger = false) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = `opacity .65s ease ${stagger ? i * 0.1 : 0}s, transform .65s ease ${stagger ? i * 0.1 : 0}s`;
    revealObserver.observe(el);
  });
}

addReveal('.service-card', true);
addReveal('.pot-card', true);
addReveal('.blog-card', true);
addReveal('.why-item', true);
addReveal('.about-text', false);
addReveal('.about-images', false);
addReveal('.why-text', false);

/* ---------- CONTACT FORM ---------- */
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('<i class="fas fa-check-circle"></i> Talebiniz alındı! En kısa sürede iletişime geçeceğiz.');
  contactForm.reset();
});

/* ---------- NEWSLETTER FORM ---------- */
const newsletterForm = document.getElementById('newsletterForm');
newsletterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('<i class="fas fa-envelope"></i> E-bültenimize başarıyla kayıt oldunuz!');
  newsletterForm.reset();
});

/* ---------- TOAST NOTIFICATION ---------- */
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ---------- SMOOTH ACTIVE NAV ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav > a, .nav .dropdown > a');

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;
  sections.forEach(section => {
    if (
      section.offsetTop <= scrollPos &&
      section.offsetTop + section.offsetHeight > scrollPos
    ) {
      navLinks.forEach(link => {
        link.style.color = '';
        link.style.background = '';
        if (link.getAttribute('href') === `#${section.id}`) {
          link.style.color = 'var(--green-main)';
          link.style.background = 'var(--green-bg)';
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

/* ---------- HERO PARALLAX (light) ---------- */
const heroBg = document.querySelector('.hero-bg img');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    heroBg.style.transform = `translateY(${scrolled * 0.25}px)`;
  }, { passive: true });
}

/* ---------- COUNTER ANIMATION ---------- */
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString('tr-TR') + suffix;
  }, 20);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const stats = entry.target.querySelectorAll('.stat strong');
      const values = [
        { val: 2500, suffix: '+' },
        { val: 98,   suffix: '%' },
        { val: 15,   suffix: ' Yıl' },
        { val: 50,   suffix: '+' }
      ];
      stats.forEach((stat, i) => {
        if (values[i]) animateCounter(stat, values[i].val, values[i].suffix);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) statsObserver.observe(statsSection);
