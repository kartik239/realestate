/* =========================================================
   SHIRWAL REALTY — property-detail.js
   Renders a single property page from properties.json based
   on the ?id= query param, wires the gallery lightbox, the
   related-properties strip, and the inquiry → WhatsApp flow.
   ========================================================= */

(() => {
  let property = null;
  let galleryIndex = 0;

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  async function init() {
    const id = qs('id') || 'SR001';
    const all = await SRProperties.loadAll();
    property = all.find(p => p.id === id) || all[0];
    if (!property) return;

    renderMeta();
    renderHero();
    renderOverview();
    renderAmenities();
    renderNearby();
    renderGallery();
    renderRelated(all);
    bindForm();
    bindLightbox();
    bindCtaButtons();
    SR.initReveal();
  }

  function renderMeta() {
    document.title = `${property.title} | ${property.id} | Shirwal Realty`;
    document.querySelector('#metaDescription')?.setAttribute('content', property.seo.metaDescription);
    document.querySelector('#ogImage')?.setAttribute('content', property.seo.ogImage);
    const bc = document.querySelector('#breadcrumbCurrent');
    if (bc) bc.textContent = property.title;
  }

  function renderHero() {
    const cover = document.querySelector('#heroImage');
    if (cover) cover.src = property.coverImage;
    const thumbs = document.querySelector('#thumbStrip');
    if (thumbs) {
      thumbs.innerHTML = property.gallery.map((src, i) => `
        <button class="thumb-btn" data-index="${i}" style="border:${i===0?'2px solid var(--emerald)':'2px solid transparent'};border-radius:10px;overflow:hidden;padding:0;width:84px;height:64px;flex:none;">
          <img src="${src}" style="width:100%;height:100%;object-fit:cover;" alt="${property.title} photo ${i+1}">
        </button>`).join('');
      thumbs.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-index'), 10);
          document.querySelector('#heroImage').src = property.gallery[i];
          thumbs.querySelectorAll('.thumb-btn').forEach(b => b.style.border = '2px solid transparent');
          btn.style.border = '2px solid var(--emerald)';
        });
      });
    }
  }

  function renderOverview() {
    const map = {
      '#propTitle': property.title,
      '#propLocation': `📍 ${property.location}, ${property.city}`,
      '#propPrice': SR.formatPrice(property.price) + (property.purpose === 'Rent' ? ' /month' : ''),
      '#propId': property.id,
      '#propType': property.type,
      '#propPurpose': property.purpose,
      '#propStatus': property.status,
      '#propArea': `${property.area} ${property.areaUnit}`,
      '#propBedrooms': property.bedrooms || '—',
      '#propBathrooms': property.bathrooms || '—',
      '#propParking': property.parking || '—',
      '#propDescription': property.description
    };
    Object.entries(map).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    });

    // hide bed/bath/parking row for land parcels
    if (!property.bedrooms && !property.bathrooms) {
      document.querySelector('#bedBathRow')?.classList.add('is-hidden-row');
      document.querySelectorAll('#bedBathRow .stat-block').forEach(el => el.style.display = 'none');
    }
  }

  function renderAmenities() {
    const el = document.querySelector('#amenityList');
    if (!el) return;
    el.innerHTML = property.amenities.map(a => `<span class="amenity-pill">✓ ${a}</span>`).join('');
  }

  function renderNearby() {
    const map = {
      '#nearSchools': property.nearby.schools,
      '#nearHospitals': property.nearby.hospitals,
      '#nearHighway': property.nearby.highway,
      '#nearRailway': property.nearby.railway
    };
    Object.entries(map).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    });
  }

  function renderGallery() {
    const el = document.querySelector('#galleryGrid');
    if (!el) return;
    el.innerHTML = property.gallery.map((src, i) => `
      <button class="gallery-thumb" data-index="${i}" style="border:none;padding:0;border-radius:14px;overflow:hidden;cursor:pointer;aspect-ratio:4/3;">
        <img src="${src}" alt="${property.title} gallery ${i+1}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
      </button>`).join('');
  }

  function renderRelated(all) {
    const el = document.querySelector('#relatedGrid');
    if (!el) return;
    const related = all.filter(p => p.id !== property.id && p.type === property.type).slice(0, 3);
    const fallback = related.length ? related : all.filter(p => p.id !== property.id).slice(0, 3);
    el.innerHTML = fallback.map(p => `
      <article class="p-card reveal in">
        <div class="p-media">
          <a href="property.html?id=${p.id}"><img src="${p.coverImage}" alt="${p.title}" loading="lazy"></a>
          <div class="p-badges"><span class="badge emerald">${p.purpose}</span></div>
        </div>
        <div class="p-body">
          <div class="p-price">${SR.formatPrice(p.price)}</div>
          <h3 class="p-title"><a href="property.html?id=${p.id}">${p.title}</a></h3>
          <div class="p-loc">📍 ${p.location}</div>
          <div class="p-cta"><a href="property.html?id=${p.id}" class="btn btn-outline btn-sm btn-block">View Details</a></div>
        </div>
      </article>`).join('');
  }

  // ---------- Lightbox ----------
  function bindLightbox() {
    const lb = document.querySelector('#lightbox');
    if (!lb) return;
    const img = lb.querySelector('img');
    const counter = lb.querySelector('.lightbox-counter');

    function open(i) {
      galleryIndex = i;
      show();
      lb.classList.add('open');
    }
    function show() {
      img.src = property.gallery[galleryIndex];
      counter.textContent = `${galleryIndex + 1} / ${property.gallery.length}`;
    }
    function next() { galleryIndex = (galleryIndex + 1) % property.gallery.length; show(); }
    function prev() { galleryIndex = (galleryIndex - 1 + property.gallery.length) % property.gallery.length; show(); }

    document.querySelectorAll('.gallery-thumb').forEach(btn => {
      btn.addEventListener('click', () => open(parseInt(btn.getAttribute('data-index'), 10)));
    });
    document.querySelector('#heroImage')?.addEventListener('click', () => open(0));
    lb.querySelector('.lightbox-close').addEventListener('click', () => lb.classList.remove('open'));
    lb.querySelector('.lb-next').addEventListener('click', next);
    lb.querySelector('.lb-prev').addEventListener('click', prev);
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') lb.classList.remove('open');
    });

    // touch swipe
    let touchStartX = 0;
    lb.addEventListener('touchstart', (e) => touchStartX = e.touches[0].clientX);
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 50) prev(); else if (dx < -50) next();
    });
  }

  // ---------- Inquiry form ----------
  function bindForm() {
    // populate hidden fields
    ['#hf_propertyName', '#hf_propertyId', '#hf_propertyPrice', '#hf_propertyType', '#hf_propertyLocation']
      .forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        if (sel.includes('Name')) el.value = property.title;
        if (sel.includes('Id')) el.value = property.id;
        if (sel.includes('Price')) el.value = property.priceLabel;
        if (sel.includes('Type')) el.value = property.type;
        if (sel.includes('Location')) el.value = property.location;
      });

    const form = document.querySelector('#inquiryForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      SR.openWhatsApp(property, {
        name: data.name, phone: data.phone, budget: data.budget,
        date: data.visitDate, time: data.visitTime, message: data.message
      });
    });
  }

  function bindCtaButtons() {
    document.querySelectorAll('[data-wa-enquire]').forEach(btn => {
      btn.addEventListener('click', () => SR.openWhatsApp(property, {}));
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
