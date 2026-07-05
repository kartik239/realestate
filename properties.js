/* =========================================================
   SHIRWAL REALTY — properties.js
   Loads data/properties.json and renders dynamic cards on
   the Home (featured) and Properties (full listing) pages.
   ========================================================= */

const SRProperties = (() => {

  let all = [];
  let filtered = [];
  let view = 'grid';
  let visibleCount = 9;
  const PAGE_SIZE = 9;

  async function loadAll() {
    if (all.length) return all;
    const res = await fetch(SR.resolvePath('data/properties.json'));
    all = await res.json();
    return all;
  }

  function cardTemplate(p) {
    const bedBath = (p.bedrooms || p.bathrooms)
      ? `<span>🛏 ${p.bedrooms} Bed</span><span>🛁 ${p.bathrooms} Bath</span>`
      : `<span>📐 Plot</span>`;
    return `
    <article class="p-card reveal in">
      <div class="p-media">
        <a href="${SR.resolvePath('property.html')}?id=${p.id}">
          <img src="${p.coverImage}" alt="${p.title}" loading="lazy">
        </a>
        <div class="p-badges">
          <span class="badge emerald">${p.purpose}</span>
          <span class="badge gold">${p.status}</span>
        </div>
        <button class="p-fav" aria-label="Save property">♡</button>
      </div>
      <div class="p-body">
        <div class="p-price">${SR.formatPrice(p.price)} <small>${p.purpose === 'Rent' ? '/month' : ''}</small></div>
        <h3 class="p-title"><a href="${SR.resolvePath('property.html')}?id=${p.id}">${p.title}</a></h3>
        <div class="p-loc">📍 ${p.location}</div>
        <div class="p-meta">
          ${bedBath}
          <span>📏 ${p.area} ${p.areaUnit}</span>
        </div>
        <div class="p-cta">
          <a href="${SR.resolvePath('property.html')}?id=${p.id}" class="btn btn-outline btn-sm btn-block">View Details</a>
        </div>
      </div>
    </article>`;
  }

  function skeletonCards(n) {
    return Array.from({ length: n }).map(() => `<div class="skeleton skel-card"></div>`).join('');
  }

  // ---------- Featured (home page) ----------
  async function renderFeatured(targetSelector, count = 6) {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    el.innerHTML = skeletonCards(count);
    const data = await loadAll();
    const featured = data.filter(p => p.featured).slice(0, count);
    el.innerHTML = featured.map(cardTemplate).join('');
    SR.initReveal();
  }

  // ---------- Full listing page ----------
  async function initListingPage() {
    const grid = document.querySelector('#propertyGrid');
    if (!grid) return;
    grid.innerHTML = skeletonCards(9);
    await loadAll();
    filtered = [...all];

    populateLocationOptions();
    bindFilterEvents();
    renderGrid();
  }

  function populateLocationOptions() {
    const sel = document.querySelector('#filterLocation');
    if (!sel) return;
    const locs = [...new Set(all.map(p => p.location))].sort();
    locs.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc; opt.textContent = loc;
      sel.appendChild(opt);
    });
  }

  function getFilterValues() {
    return {
      q: document.querySelector('#filterSearch')?.value.trim().toLowerCase() || '',
      type: document.querySelector('#filterType')?.value || '',
      location: document.querySelector('#filterLocation')?.value || '',
      priceMax: document.querySelector('#filterPrice')?.value || '',
      bedrooms: document.querySelector('#filterBedrooms')?.value || '',
      purpose: document.querySelector('.chip[data-purpose].active')?.getAttribute('data-purpose') || '',
      sort: document.querySelector('#filterSort')?.value || 'newest'
    };
  }

  function applyFilters() {
    const f = getFilterValues();
    filtered = all.filter(p => {
      if (f.q && !(p.title.toLowerCase().includes(f.q) || p.location.toLowerCase().includes(f.q) || p.id.toLowerCase().includes(f.q))) return false;
      if (f.type && p.type !== f.type) return false;
      if (f.location && p.location !== f.location) return false;
      if (f.purpose && f.purpose !== 'All' && p.purpose !== f.purpose) return false;
      if (f.priceMax && p.price > parseInt(f.priceMax, 10)) return false;
      if (f.bedrooms && p.bedrooms < parseInt(f.bedrooms, 10)) return false;
      return true;
    });

    if (f.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (f.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (f.sort === 'area-desc') filtered.sort((a, b) => b.area - a.area);
    else filtered.sort((a, b) => b.id.localeCompare(a.id)); // newest

    visibleCount = PAGE_SIZE;
    renderGrid();
  }

  function renderGrid() {
    const grid = document.querySelector('#propertyGrid');
    const countEl = document.querySelector('#resultsCount');
    const loadMoreBtn = document.querySelector('#loadMoreBtn');
    if (!grid) return;

    const toShow = filtered.slice(0, visibleCount);
    grid.classList.toggle('list-view', view === 'list');

    if (!toShow.length) {
      grid.innerHTML = `<div class="text-center" style="grid-column:1/-1;padding:60px 0;">
        <h3>No properties match your filters</h3>
        <p>Try adjusting your search or clearing filters.</p>
      </div>`;
    } else {
      grid.innerHTML = toShow.map(cardTemplate).join('');
    }

    if (countEl) countEl.textContent = `${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'} found`;
    if (loadMoreBtn) loadMoreBtn.style.display = visibleCount >= filtered.length ? 'none' : 'inline-flex';
    SR.initReveal();
  }

  function bindFilterEvents() {
    ['#filterSearch', '#filterType', '#filterLocation', '#filterPrice', '#filterBedrooms', '#filterSort']
      .forEach(sel => document.querySelector(sel)?.addEventListener('input', applyFilters));
    ['#filterType', '#filterLocation', '#filterPrice', '#filterBedrooms', '#filterSort']
      .forEach(sel => document.querySelector(sel)?.addEventListener('change', applyFilters));

    document.querySelectorAll('.chip[data-purpose]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip[data-purpose]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilters();
      });
    });

    document.querySelector('#viewGrid')?.addEventListener('click', () => {
      view = 'grid';
      document.querySelector('#viewGrid').classList.add('active');
      document.querySelector('#viewList')?.classList.remove('active');
      renderGrid();
    });
    document.querySelector('#viewList')?.addEventListener('click', () => {
      view = 'list';
      document.querySelector('#viewList').classList.add('active');
      document.querySelector('#viewGrid')?.classList.remove('active');
      renderGrid();
    });

    document.querySelector('#loadMoreBtn')?.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });

    document.querySelector('#clearFiltersBtn')?.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar input, .filter-bar select').forEach(el => el.value = '');
      document.querySelectorAll('.chip[data-purpose]').forEach(c => c.classList.remove('active'));
      document.querySelector('.chip[data-purpose="All"]')?.classList.add('active');
      applyFilters();
    });
  }

  return { loadAll, renderFeatured, initListingPage };
})();

document.addEventListener('DOMContentLoaded', () => {
  SRProperties.renderFeatured('#featuredGrid', 6);
  SRProperties.initListingPage();
});
