/* =========================================================
   SHIRWAL REALTY — main.js
   Shared behaviour: nav, loader, reveal-on-scroll, counters,
   WhatsApp message builder, settings loader.
   ========================================================= */

const SR = (() => {

  const state = { settings: null };

  async function loadSettings() {
    if (state.settings) return state.settings;
    try {
      const res = await fetch(resolvePath('data/settings.json'));
      state.settings = await res.json();
    } catch (e) {
      state.settings = { whatsapp: '917066644476', phone: '+91 70666 44476' };
    }
    return state.settings;
  }

  // Resolve a root-relative data/asset path correctly whether the current
  // page lives at the site root or is a nested page.
  function resolvePath(path) {
    const depth = document.body.getAttribute('data-depth') || '0';
    return '../'.repeat(parseInt(depth, 10)) + path;
  }

  function initLoader() {
    window.addEventListener('load', () => {
      const loader = document.querySelector('.loader');
      if (loader) setTimeout(() => loader.classList.add('hide'), 350);
    });
  }

  function initNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 30) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = document.querySelector('.nav-burger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeBtn = document.querySelector('.close-menu');
    if (burger && mobileMenu) {
      burger.addEventListener('click', () => mobileMenu.classList.add('open'));
      closeBtn?.addEventListener('click', () => mobileMenu.classList.remove('open'));
      mobileMenu.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => mobileMenu.classList.remove('open'))
      );
    }
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 70}ms`;
      io.observe(el);
    });
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-counter'), 10);
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString('en-IN');
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  }

  // ---------- WhatsApp message builder ----------
  // property: object (or null for generic enquiry), extra: {name, phone, budget, date, time, message}
  function buildWhatsAppMessage(property, extra = {}) {
    const lines = ['🏡 *Property Inquiry*', ''];
    lines.push(`👤 Name: ${extra.name || '-'}`);
    lines.push(`📞 Phone: ${extra.phone || '-'}`);
    lines.push(`🏠 Interested Property: ${property ? property.title : 'General Enquiry'}`);
    lines.push(`🆔 Property ID: ${property ? property.id : '-'}`);
    lines.push(`📍 Location: ${property ? property.location : '-'}`);
    lines.push(`💰 Price: ${property ? property.priceLabel : '-'}`);
    lines.push(`🏘 Property Type: ${property ? property.type : '-'}`);
    lines.push(`💵 Customer Budget: ${extra.budget || '-'}`);
    lines.push(`📅 Preferred Visit Date: ${extra.date || '-'}`);
    lines.push(`⏰ Preferred Visit Time: ${extra.time || '-'}`);
    lines.push(`📝 Message: ${extra.message || '-'}`);
    lines.push('');
    lines.push('Kindly contact me regarding this property.');
    return lines.join('\n');
  }

  async function openWhatsApp(property, extra = {}) {
    const settings = await loadSettings();
    const text = buildWhatsAppMessage(property, extra);
    const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function initGenericWhatsAppButtons() {
    document.querySelectorAll('[data-wa-generic]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp(null, {});
      });
    });
  }

  function initFooterYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  function formatPrice(n) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  function init() {
    initLoader();
    initNavbar();
    initReveal();
    initCounters();
    initGenericWhatsAppButtons();
    initFooterYear();
    loadSettings().then(s => {
      document.querySelectorAll('[data-phone-link]').forEach(el => el.href = `tel:${s.phone.replace(/\s/g, '')}`);
      document.querySelectorAll('[data-phone-text]').forEach(el => el.textContent = s.phone);
      document.querySelectorAll('[data-email-text]').forEach(el => el.textContent = s.email);
      document.querySelectorAll('[data-address-text]').forEach(el => el.textContent = s.address);
      document.querySelectorAll('[data-wa-link]').forEach(el => el.href = `https://wa.me/${s.whatsapp}`);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { resolvePath, loadSettings, buildWhatsAppMessage, openWhatsApp, formatPrice, initReveal, initCounters };
})();
