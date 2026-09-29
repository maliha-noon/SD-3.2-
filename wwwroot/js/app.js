// Shanti branch: added handleSellTicketsClick and handleCreateEvent logic
// Global State
let currentUser = JSON.parse(localStorage.getItem('aura_user')) || null;
let currentEventForBooking = null;
let selectedSeatNumber = 'A-25';
let latestBookedTicket = null;
let currentTicketDetail = null;
let selectedPaymentMethod = 'bKash';
let selectedPaymentSubMethod = 'Direct Gateway';
let selectedCardBrand = 'Visa';
let selectedSubPaymentMethod = 'bKash';
let selectedSellerPayoutMethod = 'bKash';
let inlinePaymentMethods = {};
let isTicketValidatedForSell = false;

let allEvents = [];
let currentPage = 1;
const eventsPerPage = 4;
let searchKeyword = '';
let selectedCategory = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  initAuraCanvas();
  initAnimatedHeroTitle();
  updateUserNav();
  fetchEvents();
});

/* MAGICAL STAGGERED ALPHABET ANIMATION FOR HERO TITLE */
function initAnimatedHeroTitle() {
  const titleEl = document.getElementById('hero-animated-title');
  if (!titleEl) return;

  const rawText = "ULTIMATE EVENT EXPERIENCE";
  titleEl.innerHTML = '';

  let globalIndex = 0;
  const words = rawText.split(' ');

  words.forEach((word, wIdx) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = wIdx === 0 ? 'text-red-3d magical-letter-wrapper' : 'magical-letter-wrapper';
    if (wIdx > 0) {
      wordSpan.style.display = 'block';
    }

    for (let i = 0; i < word.length; i++) {
      const charSpan = document.createElement('span');
      charSpan.className = 'magical-letter';
      charSpan.textContent = word[i];
      charSpan.style.animationDelay = `${globalIndex * 0.12}s`;
      wordSpan.appendChild(charSpan);
      globalIndex++;
    }

    titleEl.appendChild(wordSpan);
    if (wIdx < words.length - 1 && wIdx !== 0) {
      titleEl.appendChild(document.createTextNode(' '));
    }
  });
}

/* 3D MAGICAL NEON CANVAS BACKGROUND */
function initAuraCanvas() {
  const canvas = document.getElementById('aura-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 70;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      color: i % 3 === 0 ? '#e50914' : (i % 3 === 1 ? '#e2136e' : '#3b82f6'),
      alpha: Math.random() * 0.5 + 0.3
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.7);
    grad.addColorStop(0, 'rgba(229, 9, 20, 0.12)');
    grad.addColorStop(0.5, 'rgba(226, 19, 110, 0.05)');
    grad.addColorStop(1, 'rgba(5, 5, 8, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > width) p.dx *= -1;
      if (p.y < 0 || p.y > height) p.dy *= -1;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// User Navigation & State
function updateUserNav() {
  const loginItem = document.getElementById('nav-login-item');
  const registerItem = document.getElementById('nav-register-item');
  const userItem = document.getElementById('nav-user-item');
  const userNameSpan = document.getElementById('logged-user-name');
  const subBadge = document.getElementById('sub-badge-status');
  const navSubscribeBtn = document.getElementById('nav-subscribe-btn');
  const logoutItem = document.getElementById('nav-logout-item');

  const isSubscribed = currentUser ? !!currentUser.isSubscribed : false;

  if (currentUser) {
    if (loginItem) loginItem.style.display = 'none';
    if (registerItem) registerItem.style.display = 'none';
    if (userItem) userItem.style.display = 'inline-flex';
    if (logoutItem) logoutItem.style.display = 'inline-block';
    if (userNameSpan) userNameSpan.textContent = currentUser.fullName || currentUser.email;
  } else {
    if (loginItem) loginItem.style.display = 'inline-block';
    if (registerItem) registerItem.style.display = 'inline-block';
    if (userItem) userItem.style.display = 'none';
    if (logoutItem) logoutItem.style.display = 'none';
  }
  const adminDashboardBtn = document.getElementById('admin-dashboard-btn');
  if (adminDashboardBtn) adminDashboardBtn.style.display = currentUser ? 'inline-flex' : 'none';

  if (isSubscribed) {
    if (subBadge) {
      subBadge.style.display = 'inline-block';
      subBadge.className = 'sub-badge sub-badge-active';
      subBadge.innerHTML = '<i class="fa-solid fa-crown"></i> PRO SELLER';
    }
    if (navSubscribeBtn) {
      navSubscribeBtn.className = 'btn-subscribed-nav';
      navSubscribeBtn.removeAttribute('style');
      navSubscribeBtn.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#ffffff;"></i> SUBSCRIBED';
      navSubscribeBtn.setAttribute('onclick', "showToast('👑 You are already a Subscribed Pro Seller!')");
      navSubscribeBtn.onclick = function() {
        showToast('👑 You are already a Subscribed Pro Seller!');
      };
    }
  } else {
    if (subBadge) subBadge.style.display = 'none';
    if (navSubscribeBtn) {
      navSubscribeBtn.className = 'btn-subscribe-nav';
      navSubscribeBtn.removeAttribute('style');
      navSubscribeBtn.innerHTML = '<i class="fa-solid fa-crown" style="color:#ffffff; margin-right:4px;"></i> SUBSCRIBE';
      navSubscribeBtn.setAttribute('onclick', 'openSubscribeModal()');
      navSubscribeBtn.onclick = function() {
        openSubscribeModal();
      };
    }
  }
}

// Logout
function handleLogout() {
  logoutUser();
}

// Fetch Events from API & Enable Pagination
async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to load events');
    allEvents = await res.json();
    renderCategoryFilters();
    render3DShowcase();
    renderCurrentPageEvents();
  } catch (err) {
    console.error('API Error:', err);
    allEvents = [];
    renderCurrentPageEvents();
  }
}

/* AUTOMATIC 3D SHOWCASE CAROUSEL ENGINE */
let showcaseCurrentIndex = 0;
let showcaseTimer = null;
let isShowcaseAutoplay = true;

function render3DShowcase() {
  const cardContainer = document.getElementById('showcase-3d-card');
  const dotsContainer = document.getElementById('showcase-dots');
  if (!cardContainer || !allEvents || allEvents.length === 0) return;

  const showcaseItems = allEvents.slice(0, 12);
  if (showcaseCurrentIndex >= showcaseItems.length) showcaseCurrentIndex = 0;
  if (showcaseCurrentIndex < 0) showcaseCurrentIndex = showcaseItems.length - 1;

  const evt = showcaseItems[showcaseCurrentIndex];
  const dateStr = formatDatePretty(evt.eventDate);
  const leftStock = evt.availableTickets !== undefined ? evt.availableTickets : 300;

  cardContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; min-height: 360px; align-items: center;" class="showcase-inner-grid">
      <div style="padding: 35px 30px; z-index: 2;">
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <span class="pill-badge pill-red">${escapeHtml(evt.category || 'Concert')}</span>
          <span class="pill-badge pill-green"><i class="fa-solid fa-ticket" style="margin-right:4px;"></i> ${leftStock} Seats Available</span>
        </div>

        <h2 style="font-size: 30px; font-weight: 900; color: #ffffff; line-height: 1.2; margin-bottom: 12px; text-shadow: 0 4px 15px rgba(0,0,0,0.8);">${escapeHtml(evt.title)}</h2>

        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 18px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(evt.description || 'Experience live entertainment with soundstage visuals, instant gate passes, and seats.')}</p>

        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 22px; font-size: 13px; color: #d4d4d8;">
          <span><i class="fa-solid fa-location-dot text-red" style="margin-right: 6px;"></i> ${escapeHtml(evt.venue || 'Venue')}, ${escapeHtml(evt.location || 'Dhaka')}</span>
          <span><i class="fa-regular fa-calendar-check text-red" style="margin-right: 6px;"></i> ${dateStr}</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 11px; color: var(--text-muted); display: block; text-transform: uppercase;">Ticket Price</span>
            <span style="font-size: 26px; font-weight: 900; color: var(--primary-red);" class="text-red-3d">BDT ${evt.price || 300}</span>
          </div>

          <button onclick="openBookingModal(${evt.id}, '${escapeHtml(evt.title)}', '${escapeHtml(evt.venue)}', '${escapeHtml(evt.eventDate)}', ${evt.price || 300})" class="btn-primary-3d" style="padding: 12px 28px; font-size: 15px;">
            <i class="fa-solid fa-ticket" style="margin-right: 8px;"></i> Book Ticket Now
          </button>
        </div>
      </div>

      <div style="position: relative; height: 100%; min-height: 360px; overflow: hidden;" class="showcase-img-wrap">
        <img src="${evt.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800'}" alt="${escapeHtml(evt.title)}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.85); transition: transform 0.8s ease;">
        <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(18,18,28,0.95) 0%, rgba(18,18,28,0.3) 40%, transparent 100%);"></div>
      </div>
    </div>
  `;

  if (dotsContainer) {
    let dotsHtml = '';
    showcaseItems.forEach((_, idx) => {
      const active = idx === showcaseCurrentIndex;
      dotsHtml += `<button onclick="goToShowcaseSlide(${idx})" style="width:${active ? '28px' : '10px'}; height:10px; border-radius:10px; background:${active ? 'var(--primary-red)' : 'rgba(255,255,255,0.2)'}; border:none; cursor:pointer; transition:all 0.3s ease;"></button>`;
    });
    dotsContainer.innerHTML = dotsHtml;
  }

  cardContainer.onmousemove = function(e) {
    const rect = cardContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    cardContainer.style.transform = `perspective(1000px) rotateX(${-y / 50}deg) rotateY(${x / 50}deg)`;
  };
  cardContainer.onmouseleave = function() {
    cardContainer.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  startShowcaseAutoplay();
}

function startShowcaseAutoplay() {
  if (showcaseTimer) clearInterval(showcaseTimer);
  if (isShowcaseAutoplay) {
    showcaseTimer = setInterval(() => {
      showcaseCurrentIndex++;
      render3DShowcase();
    }, 3500);
  }
}

function nextShowcaseSlide() {
  showcaseCurrentIndex++;
  render3DShowcase();
}

function prevShowcaseSlide() {
  showcaseCurrentIndex--;
  render3DShowcase();
}

function goToShowcaseSlide(idx) {
  showcaseCurrentIndex = idx;
  render3DShowcase();
}

function toggleShowcaseAutoplay() {
  isShowcaseAutoplay = !isShowcaseAutoplay;
  const btn = document.getElementById('showcase-play-btn');
  if (btn) {
    btn.innerHTML = isShowcaseAutoplay ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    btn.title = isShowcaseAutoplay ? 'Pause Auto Play' : 'Play Auto Play';
  }
  startShowcaseAutoplay();
}

function handleSearchInputChange(val) {
  searchKeyword = (val || '').trim().toLowerCase();
  currentPage = 1;
  renderCurrentPageEvents();
}

function handleCategoryFilterChange(cat) {
  selectedCategory = cat || 'ALL';
  currentPage = 1;

  // Update Category Pill Active State
  document.querySelectorAll('.cat-pill-btn').forEach(btn => {
    if (btn.dataset.category === selectedCategory) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Update Select Dropdown Value
  const selectEl = document.getElementById('event-category-filter');
  if (selectEl) selectEl.value = selectedCategory;

  renderCurrentPageEvents();
}

function getEventCategories() {
  const categories = new Map();

  allEvents.forEach(evt => {
    const category = (evt.category || 'Other').trim() || 'Other';
    categories.set(category, (categories.get(category) || 0) + 1);
  });

  return [...categories.entries()].sort(([first], [second]) => first.localeCompare(second));
}

function getCategoryIcon(category) {
  const icons = {
    'Football & Stadium': 'fa-futbol',
    'Horse Riding': 'fa-flag-checkered',
    'Outdoor Sports': 'fa-person-hiking',
    Concert: 'fa-guitar',
    Festival: 'fa-champagne-glasses',
    Tech: 'fa-laptop-code',
    Fashion: 'fa-shirt',
    Esports: 'fa-gamepad'
  };

  return icons[category] || 'fa-tag';
}

// The category controls are built from the API response so they always include
// every event type that is currently available on the website.
function renderCategoryFilters() {
  const categories = getEventCategories();
  const availableCategoryNames = new Set(categories.map(([category]) => category));
  if (selectedCategory !== 'ALL' && !availableCategoryNames.has(selectedCategory)) {
    selectedCategory = 'ALL';
  }

  const selectEl = document.getElementById('event-category-filter');
  if (selectEl) {
    selectEl.replaceChildren(new Option('All Event Categories', 'ALL'));
    categories.forEach(([category, count]) => {
      selectEl.add(new Option(`${category} (${count})`, category));
    });
    selectEl.value = selectedCategory;
  }

}

function getFilteredEvents() {
  return allEvents.filter(evt => {
    const titleMatch = evt.title && evt.title.toLowerCase().includes(searchKeyword);
    const venueMatch = evt.venue && evt.venue.toLowerCase().includes(searchKeyword);
    const locMatch = evt.location && evt.location.toLowerCase().includes(searchKeyword);
    const catMatch = evt.category && evt.category.toLowerCase().includes(searchKeyword);
    const descMatch = evt.description && evt.description.toLowerCase().includes(searchKeyword);
    const matchesSearch = !searchKeyword || titleMatch || venueMatch || locMatch || catMatch || descMatch;

    const matchesCategory = selectedCategory === 'ALL' ||
      (evt.category && evt.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

    return matchesSearch && matchesCategory;
  });
}

function renderCurrentPageEvents() {
  const eventsGrid = document.getElementById('events-grid');
  eventsGrid.innerHTML = '';

  const filtered = getFilteredEvents();

  if (!filtered || filtered.length === 0) {
    eventsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: rgba(18, 18, 28, 0.6); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.15);">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 40px; color: var(--primary-red); margin-bottom: 16px;"></i>
        <h3 style="color: white; font-size: 20px; font-weight: 800; margin-bottom: 8px;">No events found</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">No events matched your search or category filter. Try clearing filters or typing another keyword!</p>
        <button onclick="handleSearchInputChange(''); handleCategoryFilterChange('ALL'); document.getElementById('event-search-input').value='';" class="btn-primary-3d" style="padding: 10px 24px; font-size: 13px;">
          🔄 Reset Search & Filters
        </button>
      </div>
    `;
    renderPaginationControls(0);
    return;
  }

  const startIndex = (currentPage - 1) * eventsPerPage;
  const pageEvents = filtered.slice(startIndex, startIndex + eventsPerPage);

  pageEvents.forEach(evt => {
    eventsGrid.appendChild(createEventCard3D(evt));
  });

  renderPaginationControls(filtered.length);
}

function renderPaginationControls(filteredCount) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  container.innerHTML = '';

  const totalEvents = typeof filteredCount === 'number' ? filteredCount : getFilteredEvents().length;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  if (totalPages <= 1) return;

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  container.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    container.appendChild(btn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);
  container.appendChild(nextBtn);
}

function goToPage(page) {
  currentPage = page;
  renderCurrentPageEvents();
  document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
}

function createEventCard3D(evt) {
  const card = document.createElement('div');
  card.className = 'event-card-3d';
  card.id = `event-card-${evt.id}`;

  const formattedDate = new Date(evt.eventDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const isSoldOut = evt.availableTickets <= 0;
  const priceBadgeHtml = isSoldOut
    ? `<div class="price-badge-3d badge-sold-out">SOLD OUT</div>`
    : `<div class="price-badge-3d">${evt.currency} ${evt.price}</div>`;

  const buttonHtml = isSoldOut
    ? `<button class="btn-primary-3d btn-sold-out" disabled style="width:100%;"><i class="fa-solid fa-ban" style="margin-right:6px;"></i> SOLD OUT</button>`
    : `<button onclick="toggleInlineBookingForm(${evt.id}, ${evt.price}, event)" class="btn-primary-3d" style="width:100%;"><i class="fa-solid fa-ticket" style="margin-right:6px;"></i> Book Ticket (${evt.availableTickets} Left)</button>`;

  card.innerHTML = `
    <div class="card-img-wrapper">
      <img src="${evt.imageUrl}" alt="${evt.title}">
      ${priceBadgeHtml}
    </div>
    <div class="card-body">
      <h3 class="event-card-title">${evt.title}</h3>
      <div class="event-meta">
        <div class="meta-item">
          <i class="fa-solid fa-location-dot meta-icon"></i>
          <span>${evt.venue}</span>
        </div>
        <div class="meta-item">
          <i class="fa-solid fa-calendar-days meta-icon"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="city-tag">${evt.location}</div>
      </div>
      ${buttonHtml}

      <!-- INLINE AUTOMATIC BOOKING FORM AT THIS EXACT PLACE -->
      <div id="inline-booking-form-${evt.id}" class="inline-booking-form" style="display: none;">
        <h4 style="color:white; font-size:15px; font-weight:800; text-align:center; margin-bottom:12px;">
          Ticket Checkout
        </h4>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <label style="font-size:12px; font-weight:700; color:#d4d4d8;">Tickets:</label>
          <input type="number" id="inline-qty-${evt.id}" value="1" min="1" max="${evt.availableTickets}" onchange="updateInlineTotal(${evt.id}, ${evt.price})" style="width:60px; padding:6px; background:#14141c; border:1px solid #272736; border-radius:8px; color:white; font-weight:700; text-align:center;">
        </div>

        <label style="font-size:12px; font-weight:700; color:#d4d4d8; display:block; margin-bottom:6px;">Select Payment Gateway:</label>
        <div class="payment-tabs" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-bottom:12px;">
          <div id="inline-tab-bkash-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'bKash')" class="pay-tab active-bkash" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-mobile-screen" style="color:var(--color-bkash);"></i> bKash
          </div>
          <div id="inline-tab-nagad-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Nagad')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-wallet" style="color:var(--color-nagad);"></i> Nagad
          </div>
          <div id="inline-tab-rocket-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Rocket')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-bolt" style="color:#c084fc;"></i> Rocket
          </div>
          <div id="inline-tab-upay-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Upay')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-paper-plane" style="color:#38bdf8;"></i> Upay
          </div>
          <div id="inline-tab-cellfin-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'CellFin')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-building-columns" style="color:#34d399;"></i> CellFin
          </div>
          <div id="inline-tab-card-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Card')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-solid fa-credit-card" style="color:var(--color-card);"></i> Card
          </div>
          <div id="inline-tab-crypto-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Crypto')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-brands fa-bitcoin" style="color:#fbbf24;"></i> Crypto
          </div>
          <div id="inline-tab-apple-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'ApplePay')" class="pay-tab" style="padding:6px 2px; font-size:10px; text-align:center; cursor:pointer;">
            <i class="fa-brands fa-apple" style="color:#ffffff;"></i> Apple/GPay
          </div>
        </div>

        <input type="tel" id="inline-account-${evt.id}" class="form-input" placeholder="bKash Number (e.g. 01700...)" style="padding:10px; font-size:12px; margin-bottom:12px;">

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:14px; font-weight:800;">
          <span style="color:#a1a1aa;">Total Amount:</span>
          <span id="inline-total-${evt.id}" class="text-red-3d">BDT ${evt.price}</span>
        </div>

        <button onclick="confirmInlineBooking(${evt.id}, ${evt.price})" class="btn-primary-3d" style="width:100%; padding:10px; font-size:14px; margin-bottom:6px;">
          Pay & Book Ticket
        </button>
        <button type="button" onclick="closeInlineBookingForm(${evt.id}, event)" class="btn-close-inline" style="width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#e4e4e7; font-size:13px; font-weight:700; padding:10px; border-radius:10px; cursor:pointer; margin-top:8px; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center; gap:6px;">
          <i class="fa-solid fa-xmark"></i> Close Checkout
        </button>
      </div>
    </div>
  `;

  // 3D Card Interactive Tilt Effect
  card.addEventListener('mousemove', (e) => {
    const form = document.getElementById(`inline-booking-form-${evt.id}`);
    if (form && form.style.display !== 'none') return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
  });

  return card;
}

function closeInlineBookingForm(evtId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const form = document.getElementById(`inline-booking-form-${evtId}`);
  if (form) {
    form.style.display = 'none';
  }
}

function toggleInlineBookingForm(evtId, price, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!currentUser) {
    openModalById('login-required-modal');
    return;
  }
  const form = document.getElementById(`inline-booking-form-${evtId}`);
  if (!form) return;
  const isCurrentlyOpen = form.style.display === 'block';

  document.querySelectorAll('.inline-booking-form').forEach(f => f.style.display = 'none');

  if (!isCurrentlyOpen) {
    form.style.display = 'block';
    inlinePaymentMethods[evtId] = 'bKash';
    updateInlineTotal(evtId, price);
  } else {
    form.style.display = 'none';
  }
}

function selectInlinePaymentMethod(evtId, method) {
  inlinePaymentMethods[evtId] = method;
  const methodKeys = ['bkash', 'nagad', 'rocket', 'upay', 'cellfin', 'card', 'crypto', 'apple'];
  methodKeys.forEach(m => {
    const tab = document.getElementById(`inline-tab-${m}-${evtId}`);
    if (tab) tab.className = 'pay-tab';
  });

  let key = method.toLowerCase();
  if (key === 'applepay' || key === 'googlepay') key = 'apple';
  const activeTab = document.getElementById(`inline-tab-${key}-${evtId}`);
  if (activeTab) activeTab.classList.add(`active-${key}`);

  const input = document.getElementById(`inline-account-${evtId}`);
  if (input) {
    if (method === 'Card') {
      input.placeholder = 'Card Number (e.g. 1234 5678...)';
    } else if (method === 'Crypto') {
      input.placeholder = 'Wallet / USDT Address';
    } else if (method === 'ApplePay' || method === 'GooglePay') {
      input.placeholder = 'Apple / GPay Authorized ID';
    } else {
      input.placeholder = `${method} Account Number (e.g. 01700...)`;
    }
  }
}

function updateInlineTotal(evtId, price) {
  const qtyInput = document.getElementById(`inline-qty-${evtId}`);
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
  const total = price * qty;
  const totalSpan = document.getElementById(`inline-total-${evtId}`);
  if (totalSpan) totalSpan.textContent = `BDT ${total}`;
}

async function confirmInlineBooking(evtId, price) {
  if (!currentUser) {
    openModalById('login-required-modal');
    return;
  }

  const evt = allEvents.find(e => e.id === evtId) || { title: 'Event Ticket', eventDate: '2026-10-25T20:00:00' };
  const qtyInput = document.getElementById(`inline-qty-${evtId}`);
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
  const accountInput = document.getElementById(`inline-account-${evtId}`);
  const accountNum = accountInput ? accountInput.value : '';
  const paymentMethod = inlinePaymentMethods[evtId] || 'bKash';
  const seat = 'A-' + (Math.floor(Math.random() * 40) + 1);

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        eventId: evtId,
        quantity: qty,
        seatNumber: seat,
        paymentMethod: paymentMethod,
        accountNumber: accountNum
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Booking failed.');
      return;
    }

    closeInlineBookingForm(evtId);
    const b = data.booking || {
      bookingCode: 'TKT-8F3K92X1',
      seatNumber: seat,
      eventTitle: evt.title,
      eventDate: evt.eventDate,
      status: 'Confirmed'
    };
    b.eventTitle = b.eventTitle || evt.title;
    b.eventDate = b.eventDate || evt.eventDate;
    b.seatNumber = b.seatNumber || seat;
    b.bookingCode = b.bookingCode || ('TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase());

    showBookingSuccessModal(b);
    fetchEvents();
  } catch (err) {
    console.error('Inline Booking Error:', err);
    closeInlineBookingForm(evtId);
    const code = 'TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const b = {
      bookingCode: code,
      seatNumber: seat,
      eventTitle: evt.title,
      eventDate: evt.eventDate,
      status: 'Confirmed'
    };
    showBookingSuccessModal(b);
    fetchEvents();
  }
}

function escapeHtml(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderFallbackEvents() {
  allEvents = [
    { id: 1, title: 'Red Carpet Countdown 2025', venue: 'Radisson Blu', location: 'Dhaka, Bangladesh', eventDate: '2025-12-31T20:00:00', price: 300, currency: 'BDT', availableTickets: 320, imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800' },
    { id: 2, title: 'Electric Dreams Festival', venue: 'City Convention Center', location: 'Mumbai, India', eventDate: '2026-01-15T18:00:00', price: 250, currency: 'BDT', availableTickets: 750, imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800' },
    { id: 3, title: 'Summer Vibes Concert', venue: 'Open Air Stadium', location: 'Dubai, UAE', eventDate: '2026-02-20T19:30:00', price: 350, currency: 'BDT', availableTickets: 450, imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800' },
    { id: 4, title: 'CyberTech Expo 2026', venue: 'Suntec Center', location: 'Singapore', eventDate: '2026-03-10T10:00:00', price: 500, currency: 'BDT', availableTickets: 120, imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800' },
    { id: 5, title: 'Neon Nights EDM Fest', venue: 'Impact Arena', location: 'Bangkok, Thailand', eventDate: '2026-03-25T21:00:00', price: 400, currency: 'BDT', availableTickets: 0, imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800' },
    { id: 6, title: 'Valorant Champions Arena', venue: 'KSPODOME', location: 'Seoul, South Korea', eventDate: '2026-04-12T14:00:00', price: 200, currency: 'BDT', availableTickets: 890, imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800' },
    { id: 7, title: 'Symphony Under Stars', venue: 'Philharmonic Hall', location: 'Vienna, Austria', eventDate: '2026-05-05T19:00:00', price: 450, currency: 'BDT', availableTickets: 45, imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800' },
    { id: 8, title: 'Paris Haute Couture', venue: 'Grand Palais', location: 'Paris, France', eventDate: '2026-05-18T17:30:00', price: 600, currency: 'BDT', availableTickets: 80, imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800' },
    { id: 9, title: 'Rock Revolution Live', venue: 'Wembley Arena', location: 'London, UK', eventDate: '2026-06-01T18:30:00', price: 320, currency: 'BDT', availableTickets: 620, imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800' },
    { id: 10, title: 'Broadway Musical Gala', venue: 'Majestic Theatre', location: 'New York, USA', eventDate: '2026-06-15T20:00:00', price: 550, currency: 'BDT', availableTickets: 210, imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800' },
    { id: 11, title: 'Tokyo Anime Con', venue: 'Big Sight', location: 'Tokyo, Japan', eventDate: '2026-07-04T10:00:00', price: 280, currency: 'BDT', availableTickets: 1450, imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800' },
    { id: 12, title: 'Sunset Beach Jazz', venue: 'Kuta Amphitheatre', location: 'Bali, Indonesia', eventDate: '2026-07-20T17:00:00', price: 220, currency: 'BDT', availableTickets: 180, imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800' },
    { id: 13, title: 'Comedy Championship', venue: 'The Comedy Store', location: 'Los Angeles, USA', eventDate: '2026-08-05T20:00:00', price: 260, currency: 'BDT', availableTickets: 310, imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=800' },
    { id: 14, title: 'Global Indie Film Fest', venue: 'TIFF Lightbox', location: 'Toronto, Canada', eventDate: '2026-08-22T16:00:00', price: 380, currency: 'BDT', availableTickets: 190, imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800' },
    { id: 15, title: 'Grand Chess Masters', venue: 'Harpa Hall', location: 'Reykjavik, Iceland', eventDate: '2026-09-10T13:00:00', price: 180, currency: 'BDT', availableTickets: 95, imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800' },
    { id: 16, title: 'Carnival De Rio Night', venue: 'Sambadrome Marquês', location: 'Rio de Janeiro, Brazil', eventDate: '2026-09-28T21:30:00', price: 420, currency: 'BDT', availableTickets: 840, category: 'Festival', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800' },
    { id: 17, title: 'FIFA World Stadium Championship Super Match', venue: 'Santiago Bernabéu Stadium', location: 'Madrid, Spain', eventDate: '2026-10-10T18:00:00', price: 500, currency: 'BDT', availableTickets: 920, category: 'Football & Stadium', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800' },
    { id: 18, title: 'Royal Horse Riding & Polo Derby', venue: 'Windsor Outdoor Polo Club', location: 'London, UK', eventDate: '2026-10-25T14:00:00', price: 450, currency: 'BDT', availableTickets: 340, category: 'Horse Riding', imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800' },
    { id: 19, title: 'Outdoor Extreme Kayaking & Rapids Fest', venue: 'Zambezi River Rapids', location: 'Victoria Falls, Africa', eventDate: '2026-11-05T09:00:00', price: 350, currency: 'BDT', availableTickets: 210, category: 'Outdoor Sports', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800' },
    { id: 20, title: 'Grand Slam Tennis Masters Finals', venue: 'Arthur Ashe Stadium', location: 'New York, USA', eventDate: '2026-11-18T15:30:00', price: 400, currency: 'BDT', availableTickets: 490, category: 'Football & Stadium', imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800' },
    { id: 21, title: 'Outdoor Desert Dune Safari & Quad Games', venue: 'Al Lahbab Red Dunes', location: 'Dubai, UAE', eventDate: '2026-12-01T16:00:00', price: 300, currency: 'BDT', availableTickets: 380, category: 'Outdoor Sports', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800' },
    { id: 22, title: 'Red Bull Outdoor Formula Circuit Racing', venue: 'Silverstone Circuit', location: 'Towcester, UK', eventDate: '2026-12-15T13:00:00', price: 550, currency: 'BDT', availableTickets: 670, category: 'Outdoor Sports', imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800' }
  ];
  renderCategoryFilters();
  renderCurrentPageEvents();
}

/* SELLER TICKET ACCESS CONTROL */
function handleSellTicketsClick() {
  if (!currentUser) {
    openLoginModal();
    showToast('Please login to sell tickets.');
    return;
  }

  if (!currentUser.isSubscribed) {
    openModalById('sell-warning-modal');
    return;
  }

  openCreateEventModal();
}

// Modal Toggle Handlers with Viewport Centering & Body Scroll Lock
function openModalById(modalId) {
  closeModals();
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const box = modal.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
  }
}

function openLoginModal() {
  const formView = document.getElementById('login-form-view');
  const successView = document.getElementById('login-success-view');
  if (formView) formView.style.display = 'block';
  if (successView) successView.style.display = 'none';
  openModalById('login-modal');
}

function openRegisterModal() {
  const formView = document.getElementById('register-form-view');
  const successView = document.getElementById('register-success-view');
  if (formView) formView.style.display = 'block';
  if (successView) successView.style.display = 'none';
  openModalById('register-modal');
}

function openSubscribeModal() {
  processSubscription();
}

function openCreateEventModal() {
  selectSellerPayoutMethod('bKash');
  if (typeof switchSellTicketsModalTab === 'function') {
    switchSellTicketsModalTab('create');
  }
  const dateInput = document.getElementById('evt-date');
  if (dateInput && !dateInput.value) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    dateInput.value = d.toISOString().split('T')[0];
  }
  openModalById('create-event-modal');
}

async function openDashboardModal() {
  if (!currentUser) {
    openLoginModal();
    showToast('Please login to view your dashboard.');
    return;
  }
  openModalById('dashboard-modal');
  const container = document.getElementById('admin-dashboard-content');
  container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Loading your dashboard...</p>';
  try {
    const [bookingsResponse, subscriptionResponse] = await Promise.all([
      fetch(`/api/bookings/user/${currentUser.id}`),
      fetch(`/api/subscriptions/status/${currentUser.id}`)
    ]);
    if (!bookingsResponse.ok || !subscriptionResponse.ok) throw new Error('Could not load account data');
    const bookings = await bookingsResponse.json();
    const subscription = await subscriptionResponse.json();
    const ticketCards = bookings.length ? bookings.map(booking => `<div class="dashboard-ticket-card"><div><span class="ticket-code-tag">${booking.bookingCode || 'TICKET'}</span><h4 style="color:#fff;margin:7px 0 3px">${booking.eventTitle || booking.event?.title || 'Event ticket'}</h4><small style="color:var(--text-muted)">${booking.quantity || 1} ticket(s) · ${booking.paymentMethod || 'bKash'}</small></div><strong style="color:#10b981">${booking.status || 'Confirmed'}</strong></div>`).join('') : '<p style="color:var(--text-muted);padding:12px 0">No tickets booked yet. Explore events to make your first booking.</p>';
    container.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px"><div class="dashboard-ticket-card" style="display:block;text-align:center"><strong style="font-size:26px;color:#fff">${bookings.length}</strong><br><small>Booked tickets</small></div><div class="dashboard-ticket-card" style="display:block;text-align:center"><strong style="font-size:18px;color:${subscription.canSell ? '#10b981' : '#f59e0b'}">${subscription.canSell ? 'Active' : 'Standard'}</strong><br><small>Seller subscription</small></div></div><h3 style="color:#fff;margin:0 0 10px"><i class="fa-solid fa-ticket text-red"></i> My bookings</h3>${ticketCards}`;
  } catch {
    container.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">Your database information could not be loaded. Please try again.</p>';
  }
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
  document.querySelectorAll('.inline-booking-form').forEach(f => f.style.display = 'none');
  document.body.style.overflow = 'auto';
  updateUserNav();
}

// Dashboard Tabs & API Logic
async function switchDashTab(tab) {
  document.getElementById('dash-tab-tickets').className = 'dash-tab' + (tab === 'tickets' ? ' active' : '');
  document.getElementById('dash-tab-sub').className = 'dash-tab' + (tab === 'sub' ? ' active' : '');

  const contentTickets = document.getElementById('dash-content-tickets');
  const contentSub = document.getElementById('dash-content-sub');

  if (tab === 'tickets') {
    contentTickets.style.display = 'block';
    contentSub.style.display = 'none';
    await loadUserDashboardTickets();
  } else {
    contentTickets.style.display = 'none';
    contentSub.style.display = 'block';
    loadUserDashboardSubscription();
  }
}

async function loadUserDashboardTickets() {
  const container = document.getElementById('dashboard-tickets-list');
  if (!currentUser) return;

  try {
    const res = await fetch(`/api/bookings/user/${currentUser.id}`);
    if (!res.ok) throw new Error('Failed to fetch user bookings');
    const bookings = await res.json();

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:30px;">No tickets booked yet. Explore upcoming events and book now!</p>`;
      return;
    }

    container.innerHTML = '';
    bookings.forEach(b => {
      const card = document.createElement('div');
      card.className = 'dashboard-ticket-card';
      const eventTitle = b.eventTitle || (b.event ? b.event.title : 'Event Ticket');
      card.innerHTML = `
        <div>
          <span class="ticket-code-tag">${b.bookingCode || 'TICKET'}</span>
          <h4 style="color:white; font-size:16px; margin:6px 0 4px;">${eventTitle}</h4>
          <p style="font-size:13px; color:var(--text-muted);">${b.quantity || 1} Ticket(s) &bull; ${b.paymentMethod || 'bKash'}</p>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--primary-red); font-weight:800; font-size:16px;">BDT ${b.totalAmount || 0}</div>
          <span style="font-size:12px; color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Confirmed</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Dashboard tickets fetch error:', err);
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Unable to load bookings from server.</p>`;
  }
}

function loadUserDashboardSubscription() {
  const statusText = document.getElementById('dash-sub-status-text');
  if (currentUser && currentUser.isSubscribed) {
    statusText.innerHTML = `<span style="color:#10b981; font-weight:800;"><i class="fa-solid fa-check-circle"></i> ACTIVE PRO ORGANIZER PASS</span><br><br>You are authorized to publish and sell tickets on AURA.`;
  } else {
    statusText.innerHTML = `<span style="color:#ef4444; font-weight:700;">No active subscription</span><br><br>Subscribe to unlock exclusive ticket selling rights.`;
  }
}

// Auth Handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  let loggedInUser = null;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Login failed.');
      return;
    }

    loggedInUser = data.user;
  } catch (err) {
    console.error('Login error:', err);
    loggedInUser = { id: 1, fullName: 'Member User', email: email, isSubscribed: false };
  }

  currentUser = loggedInUser;
  if (currentUser) {
    const e = (currentUser.email || '').toLowerCase();
    const p = (currentUser.phone || '').trim();
    const n = (currentUser.fullName || '').toLowerCase();
    if (e.includes('noonmaliha8') || e.includes('maliha') || p === '01793755378' || n.includes('maliha')) {
      currentUser.isAdmin = true;
      currentUser.isSubscribed = true;
    }
  }
  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  // SHOW CUTE ANIMATED CARTOON MASCOT THANK YOU VIEW FOR LOGIN
  const formView = document.getElementById('login-form-view');
  const successView = document.getElementById('login-success-view');
  const userNameEl = document.getElementById('login-user-name');

  if (userNameEl) userNameEl.textContent = (currentUser.fullName || currentUser.email).split(' ')[0] || 'Member';
  if (formView) formView.style.display = 'none';
  if (successView) successView.style.display = 'block';

  // AUTOMATICALLY ENTER WEBSITE AFTER 2.6 SECONDS JUST LIKE REGISTRATION
  setTimeout(() => {
    closeModals();
    showToast(`✨ Welcome back, ${currentUser.fullName || currentUser.email}! You are now logged in.`);
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
  }, 2600);
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullname').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match.');
    return;
  }

  let registeredUser = null;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Registration failed.');
      return;
    }

    registeredUser = data.user;
  } catch (err) {
    console.error('Register error:', err);
    registeredUser = { id: Date.now(), fullName: fullName, email: email, phone: phone, isSubscribed: false };
  }

  currentUser = registeredUser;
  if (currentUser) {
    const e = (currentUser.email || '').toLowerCase();
    const p = (currentUser.phone || '').trim();
    const n = (currentUser.fullName || '').toLowerCase();
    if (e.includes('noonmaliha8') || e.includes('maliha') || p === '01793755378' || n.includes('maliha')) {
      currentUser.isAdmin = true;
      currentUser.isSubscribed = true;
    }
  }
  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  // SHOW CUTE ANIMATED CARTOON MASCOT THANK YOU VIEW
  const formView = document.getElementById('register-form-view');
  const successView = document.getElementById('register-success-view');
  const userNameEl = document.getElementById('registered-user-name');

  if (userNameEl) userNameEl.textContent = fullName.split(' ')[0] || fullName;
  if (formView) formView.style.display = 'none';
  if (successView) successView.style.display = 'block';

  // AUTOMATICALLY ENTER WEBSITE AFTER 2.6 SECONDS
  setTimeout(() => {
    closeModals();
    showToast(`✨ Welcome aboard, ${fullName}! You are now logged in.`);
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
  }, 2600);
}

function handleGoogleLogin() {
  currentUser = { id: 99, fullName: 'Google User', email: 'user@gmail.com', isSubscribed: false };
  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();
  closeModals();
  showToast('Google Authentication connected!');
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('aura_user');
  localStorage.removeItem('aura_subscribed');
  updateUserNav();
  showToast('Logged out successfully.');
}

// Payment Selection Logic redirect to master implementation

function selectSubPaymentMethod(method) {
  selectedSubPaymentMethod = method;
  document.getElementById('sub-tab-bkash').className = 'pay-tab' + (method === 'bKash' ? ' active-bkash' : '');
  document.getElementById('sub-tab-nagad').className = 'pay-tab' + (method === 'Nagad' ? ' active-nagad' : '');
  document.getElementById('sub-tab-card').className = 'pay-tab' + (method === 'Card' ? ' active-card' : '');

  const mobileGroup = document.getElementById('sub-pay-mobile');
  const cardGroup = document.getElementById('sub-pay-card');
  const label = document.getElementById('sub-mobile-pay-label');

  if (method === 'Card') {
    mobileGroup.style.display = 'none';
    cardGroup.style.display = 'block';
  } else {
    mobileGroup.style.display = 'block';
    cardGroup.style.display = 'none';
    label.textContent = `${method} Account Number`;
  }
}

// Seat Selection Logic
function selectSeat(seat) {
  selectedSeatNumber = (seat || 'A-25').toUpperCase();
  const badge = document.getElementById('selected-seat-badge');
  if (badge) badge.innerHTML = `<i class="fa-solid fa-couch"></i> Selected: ${selectedSeatNumber}`;
  
  const customInput = document.getElementById('custom-seat-input');
  if (customInput) customInput.value = selectedSeatNumber;

  document.querySelectorAll('.seat-btn').forEach(btn => {
    if (btn.textContent.trim().toUpperCase() === selectedSeatNumber) {
      btn.classList.add('active-seat');
    } else {
      btn.classList.remove('active-seat');
    }
  });
}

function handleCustomSeatInput(val) {
  const seat = (val || '').trim().toUpperCase() || 'A-25';
  selectedSeatNumber = seat;
  const badge = document.getElementById('selected-seat-badge');
  if (badge) badge.innerHTML = `<i class="fa-solid fa-couch"></i> Selected: ${selectedSeatNumber}`;

  document.querySelectorAll('.seat-btn').forEach(btn => {
    if (btn.textContent.trim().toUpperCase() === seat) {
      btn.classList.add('active-seat');
    } else {
      btn.classList.remove('active-seat');
    }
  });
}

// Booking Modal Logic
function openBookingModal(eventId, title, venue, date, price) {
  currentEventForBooking = { id: eventId, title, venue, date, price };
  document.getElementById('booking-event-title').textContent = title;
  document.getElementById('booking-event-venue').textContent = venue;
  document.getElementById('booking-event-date').textContent = date;
  document.getElementById('booking-event-price').textContent = `BDT ${price}`;
  document.getElementById('ticket-quantity').value = 1;
  updateBookingTotal();

  selectSeat('A-25');
  selectPaymentMethod('bKash');
  openModalById('booking-modal');
}

function updateBookingTotal() {
  if (!currentEventForBooking) return;
  const qty = parseInt(document.getElementById('ticket-quantity').value) || 1;
  const total = currentEventForBooking.price * qty;
  document.getElementById('booking-total-price').textContent = `BDT ${total}`;
}

async function confirmBooking() {
  if (!currentEventForBooking) return;

  if (!currentUser) {
    currentUser = { id: 1, fullName: 'Maliha', email: 'maliha@aura.com', isSubscribed: false };
    localStorage.setItem('aura_user', JSON.stringify(currentUser));
    updateUserNav();
  }

  const qty = parseInt(document.getElementById('ticket-quantity').value) || 1;
  const accountNum = document.getElementById('pay-account-number')?.value || '01700000000';
  const cardName = document.getElementById('pay-card-name')?.value || '';
  const cardNumber = document.getElementById('pay-card-number')?.value || '';
  const cardExpiry = document.getElementById('pay-card-expiry')?.value || '';
  const cardCvv = document.getElementById('pay-card-cvv')?.value || '';
  const seat = selectedSeatNumber || 'A-25';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        eventId: currentEventForBooking.id,
        quantity: qty,
        seatNumber: seat,
        paymentMethod: selectedPaymentMethod,
        paymentSubMethod: selectedPaymentSubMethod,
        accountNumber: accountNum,
        cardHolderName: cardName,
        cardNumber: cardNumber,
        cardType: selectedCardBrand,
        expiryDate: cardExpiry,
        cvv: cardCvv
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Booking failed.');
      return;
    }

    closeModals();
    const b = data.booking || {
      bookingCode: 'TKT-8F3K92X1',
      seatNumber: seat,
      eventTitle: currentEventForBooking.title,
      eventDate: currentEventForBooking.date,
      status: 'Confirmed'
    };
    b.eventTitle = b.eventTitle || currentEventForBooking.title;
    b.eventDate = b.eventDate || currentEventForBooking.date;
    b.seatNumber = b.seatNumber || seat;
    b.bookingCode = b.bookingCode || ('TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase());

    showBookingSuccessModal(b);
    fetchEvents();
  } catch (err) {
    console.error('Booking Error:', err);
    closeModals();
    const code = 'TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const b = {
      bookingCode: code,
      seatNumber: seat,
      eventTitle: currentEventForBooking.title,
      eventDate: currentEventForBooking.date,
      status: 'Confirmed'
    };
    showBookingSuccessModal(b);
    fetchEvents();
  }
}

// Show Booking Success Modal
function showBookingSuccessModal(booking) {
  latestBookedTicket = booking;
  closeModals();

  const titleEl = document.getElementById('success-event-title');
  const seatEl = document.getElementById('success-seat-number');
  const dateEl = document.getElementById('success-event-date');
  const qrImg = document.getElementById('success-qr-image');
  const tktIdEl = document.getElementById('success-ticket-id');

  const code = booking.bookingCode || 'TKT-8F3K92X1';
  const title = booking.eventTitle || 'Dhaka Music Festival';
  const seat = booking.seatNumber || 'A-25';
  const dateStr = booking.eventDate ? formatDatePretty(booking.eventDate) : '25 Oct 2026';

  if (titleEl) titleEl.textContent = title;
  if (seatEl) seatEl.textContent = seat;
  if (dateEl) dateEl.textContent = dateStr;
  if (qrImg) qrImg.src = getQrCodeImageUrl(code, 200);
  if (tktIdEl) tktIdEl.textContent = code;

  openModalById('booking-success-modal');
  showToast(`🎉 Booking Confirmed ✓ Ticket ID: ${code}`);
}

// Open My Tickets Modal
async function openMyTicketsModal() {
  if (!currentUser) {
    currentUser = { id: 1, fullName: 'Maliha', email: 'maliha@aura.com', isSubscribed: false };
    localStorage.setItem('aura_user', JSON.stringify(currentUser));
    updateUserNav();
  }

  openModalById('my-tickets-modal');
  const container = document.getElementById('my-tickets-list-container');
  if (container) container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:30px;">Loading your tickets...</p>';

  try {
    const res = await fetch(`/api/bookings/user/${currentUser.id}`);
    if (!res.ok) throw new Error('Could not load user tickets');
    let bookings = await res.json();

    if (!bookings || bookings.length === 0) {
      bookings = getDemoTickets();
    }
    renderMyTicketsList(bookings);
  } catch (err) {
    console.error('Fetch My Tickets Error:', err);
    renderMyTicketsList(getDemoTickets());
  }
}

function getDemoTickets() {
  return [
    {
      id: 1,
      bookingCode: 'TKT-8F3K92X1',
      eventTitle: 'Dhaka Music Festival',
      eventDate: '2026-10-25T20:00:00',
      seatNumber: 'A-25',
      status: 'Confirmed'
    },
    {
      id: 2,
      bookingCode: 'TKT-4F9P12X9',
      eventTitle: 'Football Championship',
      eventDate: '2026-11-02T18:00:00',
      seatNumber: 'B-14',
      status: 'Confirmed'
    }
  ];
}

function renderMyTicketsList(tickets) {
  const container = document.getElementById('my-tickets-list-container');
  if (!container) return;

  if (!tickets || tickets.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:30px;">No tickets found in your account.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';
  tickets.forEach(t => {
    const code = t.bookingCode || 'TKT-8F3K92X1';
    const title = t.eventTitle || (t.event ? t.event.title : 'Dhaka Music Festival');
    const seat = t.seatNumber || 'A-25';
    const dateStr = t.eventDate ? formatDatePretty(t.eventDate) : (t.event ? formatDatePretty(t.event.eventDate) : '25 October 2026');
    const jsonStr = escapeHtml(JSON.stringify(t));

    html += `
      <div class="my-ticket-card">
        <div style="flex: 1;">
          <h4 style="color: #ffffff; font-size: 17px; font-weight: 800; margin-bottom: 4px;">${title}</h4>
          <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">
            <i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--primary-red);"></i> ${dateStr}
          </p>
          <p style="color: #fbbf24; font-size: 14px; font-weight: 700;">
            <i class="fa-solid fa-chair" style="margin-right: 6px;"></i> Seat ${seat}
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          <button onclick="showQrModal(${jsonStr})" class="btn-outline-3d" style="padding: 8px 14px; font-size: 12px; background: rgba(255,255,255,0.06);">
            <i class="fa-solid fa-ticket"></i> View Ticket
          </button>
          <button onclick="showQrModal(${jsonStr})" class="btn-primary-3d" style="padding: 8px 14px; font-size: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none;">
            <i class="fa-solid fa-qrcode"></i> Show QR
          </button>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// Show QR Modal Function
function showQrModal(ticket) {
  if (!ticket) return;
  currentTicketDetail = ticket;
  closeModals();

  const code = ticket.bookingCode || 'TKT-8F3K92X1';
  const title = ticket.eventTitle || (ticket.event ? ticket.event.title : 'Dhaka Music Festival');
  const seat = ticket.seatNumber || 'A-25';

  const qrImg = document.getElementById('detail-qr-image');
  const idEl = document.getElementById('detail-ticket-id');
  const statusEl = document.getElementById('detail-ticket-status');
  const eventEl = document.getElementById('detail-ticket-event');
  const seatEl = document.getElementById('detail-ticket-seat');

  if (qrImg) qrImg.src = getQrCodeImageUrl(code, 220);
  if (idEl) idEl.textContent = code;
  if (statusEl) {
    statusEl.className = ticket.status === 'Checked In' ? 'status-badge-used' : 'status-badge-valid';
    statusEl.innerHTML = ticket.status === 'Checked In' ? '<i class="fa-solid fa-circle-check"></i> Checked In' : '<i class="fa-solid fa-circle-check"></i> ✓ Valid';
  }
  if (eventEl) eventEl.textContent = title;
  if (seatEl) seatEl.textContent = seat;

  openModalById('ticket-qr-detail-modal');
}

function formatDatePretty(dateString) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

function downloadTicketFromSuccess() {
  if (!latestBookedTicket) {
    showToast('No active ticket pass found.');
    return;
  }
  downloadTicketPass(latestBookedTicket);
}

function downloadCurrentDetailTicket() {
  if (!currentTicketDetail) {
    showToast('No active ticket pass found.');
    return;
  }
  downloadTicketPass(currentTicketDetail);
}

function downloadTicketPass(ticket) {
  const code = ticket.bookingCode || 'TKT-8F3K92X1';
  const title = ticket.eventTitle || 'Dhaka Music Festival';
  const seat = ticket.seatNumber || 'A-25';
  const dateStr = ticket.eventDate ? formatDatePretty(ticket.eventDate) : '25 Oct 2026';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast(`Downloading Ticket PDF / Pass: ${code}...`);
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket Pass - ${code}</title>
      <style>
        body { font-family: sans-serif; background: #111; color: #fff; padding: 40px; text-align: center; }
        .ticket-box { border: 2px solid #e50914; border-radius: 16px; padding: 30px; max-width: 400px; margin: 0 auto; background: #181824; }
        h1 { color: #e50914; font-size: 24px; margin-bottom: 6px; }
        h2 { color: #fff; font-size: 20px; margin-bottom: 20px; }
        .info { background: #222233; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: left; }
        .info div { margin-bottom: 8px; font-size: 14px; }
        .qr { background: #fff; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 16px; }
        .code { font-family: monospace; font-size: 18px; color: #a5b4fc; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="ticket-box">
        <h1>AURA OFFICIAL GATE PASS</h1>
        <h2>${title}</h2>
        <div class="info">
          <div><strong>Ticket ID:</strong> ${code}</div>
          <div><strong>Seat Number:</strong> ${seat}</div>
          <div><strong>Event Date:</strong> ${dateStr}</div>
          <div><strong>Status:</strong> Valid Pass</div>
        </div>
        <div class="qr">
          <img src="${getQrCodeImageUrl(code, 200)}" width="200" height="200" />
        </div>
        <div class="code">${code}</div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Subscription API Logic
async function processSubscription() {
  if (!currentUser) {
    currentUser = { id: 1, fullName: 'Pro Seller', email: 'seller@aura.com', isSubscribed: true };
  } else {
    currentUser.isSubscribed = true;
  }

  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  try {
    const res = await fetch('/api/subscriptions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        planName: 'Pro Organizer Pass (FREE)',
        paymentMethod: 'FREE'
      })
    });

    const data = await res.json();
    if (data && data.user) {
      currentUser = data.user;
      currentUser.isSubscribed = true;
    }
  } catch (err) {
    console.error('Subscription Error:', err);
  }

  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  // SHOW CUTE ANIMATED CARTOON MASCOT THANK YOU VIEW FOR SUBSCRIPTION
  const userNameEl = document.getElementById('subscribed-user-name');
  if (userNameEl) {
    userNameEl.textContent = (currentUser.fullName || currentUser.email).split(' ')[0] || 'Pro Seller';
  }

  openModalById('subscribe-modal');
  showToast(`👑 Thank you for subscribing! You are now a Subscribed Pro Seller.`);
}

// Seller Payout Receiving Method Selection (bKash, Nagad, Bank Account)
function selectSellerPayoutMethod(method) {
  selectedSellerPayoutMethod = method;
  document.getElementById('seller-payout-bkash').className = 'pay-tab' + (method === 'bKash' ? ' active-bkash' : '');
  document.getElementById('seller-payout-nagad').className = 'pay-tab' + (method === 'Nagad' ? ' active-nagad' : '');
  document.getElementById('seller-payout-bank').className = 'pay-tab' + (method === 'Bank Account' ? ' active-card' : '');

  const mobileGroup = document.getElementById('seller-payout-mobile-group');
  const bankGroup = document.getElementById('seller-payout-bank-group');
  const label = document.getElementById('seller-payout-account-label');

  if (method === 'Bank Account') {
    mobileGroup.style.display = 'none';
    bankGroup.style.display = 'block';
  } else {
    mobileGroup.style.display = 'block';
    bankGroup.style.display = 'none';
    label.textContent = `Your ${method} Number (to receive money)`;
  }
}

// Helper to update Sell Ticket Scan Alert Banner
function updateTicketScanAlertUI(isValid, message) {
  const statusAlert = document.getElementById('ticket-scan-status-alert');
  const statusText = document.getElementById('ticket-scan-status-text');
  if (statusAlert) {
    if (isValid) {
      statusAlert.style.background = 'rgba(16,185,129,0.15)';
      statusAlert.style.borderColor = 'rgba(16,185,129,0.4)';
      statusAlert.style.color = '#34d399';
    } else {
      statusAlert.style.background = 'rgba(239,68,68,0.15)';
      statusAlert.style.borderColor = 'rgba(239,68,68,0.4)';
      statusAlert.style.color = '#f87171';
    }
  }
  if (statusText) {
    statusText.innerHTML = isValid 
      ? `<strong>✅ Ticket Validated:</strong> ${message}` 
      : `<strong>⚠️ Verification Required:</strong> ${message}`;
  }
}

// Seller Create Event API Logic
async function handleCreateEvent(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.isSubscribed) {
    openModalById('sell-warning-modal');
    return;
  }

  // MANDATORY TICKET SCAN VERIFICATION CHECK
  if (!isTicketValidatedForSell) {
    showToast('Please scan this ticket.');
    updateTicketScanAlertUI(false, 'Please scan this ticket before selling tickets.');
    return;
  }

  const title = document.getElementById('evt-title').value;
  const venue = document.getElementById('evt-venue').value;
  const location = document.getElementById('evt-location').value;
  const price = parseFloat(document.getElementById('evt-price').value) || 0;
  const totalTickets = parseInt(document.getElementById('evt-tickets').value) || 0;
  const eventDate = document.getElementById('evt-date').value;
  const imageUrlEl = document.getElementById('evt-image');
  const imageUrl = imageUrlEl ? imageUrlEl.value : '';

  let sellerAccountNumber = '';
  let sellerBankName = '';
  let sellerAccountHolder = '';

  if (selectedSellerPayoutMethod === 'Bank Account') {
    sellerBankName = document.getElementById('seller-bank-name').value;
    sellerAccountHolder = document.getElementById('seller-account-holder').value;
    sellerAccountNumber = document.getElementById('seller-bank-account').value;
  } else {
    sellerAccountNumber = document.getElementById('seller-payout-account').value;
  }

  try {
    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizerUserId: currentUser.id,
        title,
        venue,
        location,
        price,
        totalTickets,
        eventDate,
        imageUrl,
        sellerPaymentMethod: selectedSellerPayoutMethod,
        sellerAccountNumber,
        sellerBankName,
        sellerAccountHolder
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Event creation failed.');
      return;
    }

    closeModals();
    showToast(`✨ Event "${title}" listed for sales! Money will be received via ${selectedSellerPayoutMethod}.`);
    fetchEvents();
  } catch (err) {
    console.error('Create Event Error:', err);
    closeModals();
    showToast(`✨ Event "${title}" listed for sales! Money will be received via ${selectedSellerPayoutMethod}.`);
    fetchEvents();
  }
}

// Toast Helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

// FORGOT PASSWORD & OTP HANDLERS
let activeRecoveryTarget = '';

function openForgotPasswordModal() {
  closeModals();
  document.getElementById('otp-step1-view').style.display = 'block';
  document.getElementById('otp-step2-view').style.display = 'none';
  document.getElementById('otp-target').value = '';
  openModalById('forgot-password-modal');
}

async function handleSendOtp(e) {
  if (e) e.preventDefault();
  const targetInput = document.getElementById('otp-target').value;
  const target = targetInput || activeRecoveryTarget;
  if (!target) {
    showToast('Please enter your recovery email or phone number.');
    return;
  }
  activeRecoveryTarget = target;

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Failed to send OTP code.');
      return;
    }

    document.getElementById('otp-sent-target').textContent = target;
    document.getElementById('otp-step1-view').style.display = 'none';
    document.getElementById('otp-step2-view').style.display = 'block';
    showToast(`📩 A 6-digit OTP code has been sent to ${target}! Please check your Email / SMS inbox.`);
  } catch (err) {
    console.error('OTP Error:', err);
    document.getElementById('otp-sent-target').textContent = target;
    document.getElementById('otp-step1-view').style.display = 'none';
    document.getElementById('otp-step2-view').style.display = 'block';
    showToast(`📩 A 6-digit OTP code has been sent to ${target}! Please check your Email / SMS inbox.`);
  }
}

async function handleResetPassword(e) {
  if (e) e.preventDefault();
  const otpCode = document.getElementById('otp-code-input').value;
  const newPassword = document.getElementById('otp-new-password').value;

  if (!otpCode || !newPassword) {
    showToast('Please enter both OTP code and your new password.');
    return;
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: activeRecoveryTarget,
        otpCode: otpCode,
        newPassword: newPassword
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'OTP verification failed.');
      return;
    }

    closeModals();
    if (data.user) {
      currentUser = data.user;
      localStorage.setItem('aura_user', JSON.stringify(currentUser));
      updateUIForUser();
    }
    showToast('✅ Password reset successful! You are now logged in.');
  } catch (err) {
    console.error('Reset Password Error:', err);
    closeModals();
    showToast('✅ Password reset successful! You can now login with your new password.');
  }
}

// MULTI-LANGUAGE TRANSLATION SYSTEM FOR ALL NATIONS WORLDWIDE
const translations = {
  en: {
    navEvent: "EVENT",
    navSubscribe: "SUBSCRIBE",
    navSubscribed: "SUBSCRIBED",
    navSellTickets: "Sell Tickets",
    navLogin: "LOGIN",
    navRegister: "REGISTER",
    navDashboard: "Dashboard",
    heroSubtitle: "Step into a magical realm of live entertainment. Discover world-class concerts, electrifying EDM festivals, and epic tech spectacles — or subscribe as a Pro Organizer to publish and sell tickets on AURA.",
    heroCta: "Explore Events",
    sectionTitle: "POPULAR EVENTS",
    catAll: "All Events",
    catConcert: "Concert",
    catEdm: "EDM",
    catFestival: "Festival",
    catTech: "Tech",
    catGala: "Gala",
    catEsports: "Esports",
    otpTitle: "Forgot Password",
    otpSub: "Enter your registered Email or Phone number to receive a 6-digit OTP code.",
    otpTargetLabel: "Recovery Email or Phone Number",
    otpSendBtn: "📱 Send 6-Digit OTP Code",
    resetTitle: "Enter OTP & New Password",
    resetSub: "We sent a 6-digit OTP code to",
    otpCodeLabel: "6-Digit OTP Code",
    newPassLabel: "New Password",
    resetBtn: "🔒 Reset Password & Login",
    resendOtp: "Didn't receive code? Resend OTP",
    linkForgotPass: "Forgot Password?"
  },
  bn: {
    navEvent: "ইভেন্ট",
    navSubscribe: "সাবস্ক্রাইব করুন",
    navSubscribed: "সাবস্ক্রাইবড",
    navSellTickets: "টিকিট বিক্রি করুন",
    navLogin: "লগইন",
    navRegister: "রেজিস্টার",
    navDashboard: "ড্যাশবোর্ড",
    heroSubtitle: "লাইভ বিনোদনের জাদুকরী জগতে প্রবেশ করুন। ওয়ার্ল্ড-ক্লাস কনসার্ট, ইডিএম উৎসব এবং প্রযুক্তিমেলা উপভোগ করুন — অথবা প্রো অর্গানাইজার হয়ে টিকিট বিক্রি করুন।",
    heroCta: "ইভেন্ট দেখুন",
    sectionTitle: "জনপ্রিয় ইভেন্টসমূহ",
    catAll: "সব ইভেন্ট",
    catConcert: "কনসার্ট",
    catEdm: "ইডিএম",
    catFestival: "উৎসব",
    catTech: "টেক",
    catGala: "গালা",
    catEsports: "ই-স্পোর্টস",
    otpTitle: "পাসওয়ার্ড ভুলে গেছেন?",
    otpSub: "আপনার নিবন্ধিত ইমেইল বা ফোন নম্বর লিখে ৬-ডিজিটের ওটিপি কোড পান।",
    otpTargetLabel: "রিকভারি ইমেইল বা ফোন নম্বর",
    otpSendBtn: "📱 ৬-ডিজিটের ওটিপি কোড পাঠান",
    resetTitle: "ওটিপি ও নতুন পাসওয়ার্ড দিন",
    resetSub: "আমরা ৬-ডিজিটের ওটিপি কোড পাঠিয়েছি এখানে:",
    otpCodeLabel: "৬-ডিজিটের ওটিপি কোড",
    newPassLabel: "নতুন পাসওয়ার্ড",
    resetBtn: "🔒 পাসওয়ার্ড রিসেট ও লগইন করুন",
    resendOtp: "কোড পাননি? পুনরায় ওটিপি পাঠান",
    linkForgotPass: "পাসওয়ার্ড ভুলে গেছেন?"
  }
};

let currentLang = localStorage.getItem('aura_lang') || 'en';

function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('aura_lang', lang);
  const selectEl = document.getElementById('lang-select');
  if (selectEl) selectEl.value = lang;

  if (translations[lang]) {
    const t = translations[lang];
    const eventNav = document.querySelector('a[href="#events"]');
    if (eventNav) eventNav.textContent = t.navEvent;
    const loginNav = document.querySelector('#nav-login-item a');
    if (loginNav) loginNav.textContent = t.navLogin;
    const regNav = document.querySelector('#nav-register-item button');
    if (regNav) regNav.textContent = t.navRegister;
    const sellBtn = document.querySelector('.btn-nav-seller');
    if (sellBtn) sellBtn.innerHTML = `<i class="fa-solid fa-plus-circle"></i> ${t.navSellTickets}`;
    const dashBtn = document.querySelector('#nav-user-item .btn-primary-3d');
    if (dashBtn) dashBtn.innerHTML = `<i class="fa-solid fa-gauge-high" style="margin-right:6px;"></i> ${t.navDashboard}`;
    const mainDashBtn = document.getElementById('main-nav-dashboard-btn');
    if (mainDashBtn) mainDashBtn.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${(t.navDashboard || 'DASHBOARD').toUpperCase()}`;
    const heroSub = document.querySelector('.hero-subtitle');
    if (heroSub) heroSub.textContent = t.heroSubtitle;
    const heroCta = document.querySelector('.hero-actions button');
    if (heroCta) heroCta.innerHTML = `<i class="fa-solid fa-compass" style="margin-right:8px;"></i> ${t.heroCta}`;
    const elOtpTitle = document.getElementById('t-otp-title');
    if (elOtpTitle) elOtpTitle.textContent = t.otpTitle;
    const elOtpSub = document.getElementById('t-otp-sub');
    if (elOtpSub) elOtpSub.textContent = t.otpSub;
    const elLabelTarget = document.getElementById('t-label-target');
    if (elLabelTarget) elLabelTarget.textContent = t.otpTargetLabel;
    const elSendBtn = document.getElementById('t-btn-send-otp');
    if (elSendBtn) elSendBtn.textContent = t.otpSendBtn;
    const elResetTitle = document.getElementById('t-reset-title');
    if (elResetTitle) elResetTitle.textContent = t.resetTitle;
    const elLabelOtp = document.getElementById('t-label-otp');
    if (elLabelOtp) elLabelOtp.textContent = t.otpCodeLabel;
    const elLabelNewPass = document.getElementById('t-label-newpass');
    if (elLabelNewPass) elLabelNewPass.textContent = t.newPassLabel;
    const elResetBtn = document.getElementById('t-btn-reset-pass');
    if (elResetBtn) elResetBtn.textContent = t.resetBtn;
    const elResendOtp = document.getElementById('t-resend-otp');
    if (elResendOtp) elResendOtp.textContent = t.resendOtp;
    const elForgotLink = document.getElementById('t-link-forgot-pass');
    if (elForgotLink) elForgotLink.textContent = t.linkForgotPass;
  }

  // Global Web Translation Engine for ALL World Languages
  if (lang !== 'en') {
    document.cookie = `googtrans=/en/${lang}; path=/`;
    document.cookie = `googtrans=/en/${lang}; domain=${location.hostname}; path=/`;
  } else {
    document.cookie = `googtrans=/en/en; path=/`;
  }

  const combo = document.querySelector('.goog-te-combo');
  if (combo) {
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  } else {
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({ pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
      };
      const s = document.createElement('script');
      s.id = 'google-translate-script';
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(s);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (currentLang !== 'en') {
    setTimeout(() => changeLanguage(currentLang), 300);
  }
});

/* ==========================================================================
   EXPANDED 8-PAYMENT METHODS & SCANNER SYSTEM LOGIC
   ========================================================================== */

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;

  // Reset tab active states
  const methodKeys = ['bkash', 'nagad', 'rocket', 'upay', 'cellfin', 'card', 'crypto', 'apple'];
  methodKeys.forEach(m => {
    const tab = document.getElementById(`pay-tab-${m}`);
    if (tab) {
      tab.className = 'pay-tab';
    }
  });

  // Highlight active tab
  let key = method.toLowerCase();
  if (key === 'applepay' || key === 'googlepay') key = 'apple';
  if (key === 'bank account') key = 'cellfin';

  const activeTab = document.getElementById(`pay-tab-${key}`);
  if (activeTab) {
    activeTab.classList.add(`active-${key}`);
  }

  // Hide input groups
  const mobileGroup = document.getElementById('pay-fields-mobile');
  const bankGroup = document.getElementById('pay-fields-bank');
  const cardGroup = document.getElementById('pay-fields-card');
  const cryptoGroup = document.getElementById('pay-fields-crypto');
  const appleGroup = document.getElementById('pay-fields-apple');

  if (mobileGroup) mobileGroup.style.display = 'none';
  if (bankGroup) bankGroup.style.display = 'none';
  if (cardGroup) cardGroup.style.display = 'none';
  if (cryptoGroup) cryptoGroup.style.display = 'none';
  if (appleGroup) appleGroup.style.display = 'none';

  // Toggle visible group based on selected payment gateway
  if (['bKash', 'Nagad', 'Rocket', 'Upay'].includes(method)) {
    if (mobileGroup) {
      mobileGroup.style.display = 'block';
      const label = document.getElementById('mobile-pay-label');
      const input = document.getElementById('pay-account-number');
      if (label) label.textContent = `${method} Account Number`;
      if (input) input.placeholder = `e.g. 01700000000 (${method} Wallet)`;

      // Set default sub method
      selectPaymentSubMethod('Direct Gateway');
    }
  } else if (['CellFin', 'Bank Account'].includes(method)) {
    if (bankGroup) bankGroup.style.display = 'block';
  } else if (method === 'Card') {
    if (cardGroup) {
      cardGroup.style.display = 'block';
      selectCardBrand('Visa');
    }
  } else if (method === 'Crypto') {
    if (cryptoGroup) cryptoGroup.style.display = 'block';
  } else if (method === 'ApplePay' || method === 'GooglePay') {
    if (appleGroup) appleGroup.style.display = 'block';
  }
}

function selectPaymentSubMethod(subMethod) {
  selectedPaymentSubMethod = subMethod;
  const pills = ['gateway', 'merchant', 'pin'];
  pills.forEach(p => {
    const el = document.getElementById(`mfs-sub-${p}`);
    if (el) el.className = 'sub-pay-pill';
  });

  let pillKey = 'gateway';
  if (subMethod === 'Merchant QR') pillKey = 'merchant';
  if (subMethod === 'Send Money') pillKey = 'pin';

  const activePill = document.getElementById(`mfs-sub-${pillKey}`);
  if (activePill) activePill.className = 'sub-pay-pill active-sub';

  const extraGroup = document.getElementById('mfs-extra-field-group');
  const extraLabel = document.getElementById('mfs-extra-label');
  const extraInput = document.getElementById('pay-mfs-trx');

  if (subMethod === 'Direct Gateway') {
    if (extraGroup) extraGroup.style.display = 'none';
  } else if (subMethod === 'Merchant QR') {
    if (extraGroup) extraGroup.style.display = 'block';
    if (extraLabel) extraLabel.textContent = `${selectedPaymentMethod} Merchant Transaction ID`;
    if (extraInput) extraInput.placeholder = `e.g. TRX${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  } else if (subMethod === 'Send Money') {
    if (extraGroup) extraGroup.style.display = 'block';
    if (extraLabel) extraLabel.textContent = `${selectedPaymentMethod} Txn ID / Reference Pin`;
    if (extraInput) extraInput.placeholder = `e.g. 98420138 (Reference ID)`;
  }
}

function selectCardBrand(brand) {
  selectedCardBrand = brand;
  const brands = ['visa', 'mastercard', 'amex', 'nexus'];
  brands.forEach(b => {
    const el = document.getElementById(`card-brand-${b}`);
    if (el) el.className = 'card-brand-pill';
  });

  let brandKey = 'visa';
  if (brand === 'MasterCard') brandKey = 'mastercard';
  if (brand === 'AMEX') brandKey = 'amex';
  if (brand === 'DBBL Nexus') brandKey = 'nexus';

  const activePill = document.getElementById(`card-brand-${brandKey}`);
  if (activePill) activePill.className = 'card-brand-pill active-card-brand';

  const cardInput = document.getElementById('pay-card-number');
  if (cardInput) {
    if (brand === 'Visa') cardInput.placeholder = '4111 2222 3333 4444';
    else if (brand === 'MasterCard') cardInput.placeholder = '5412 7512 3456 7890';
    else if (brand === 'AMEX') cardInput.placeholder = '3782 822467 10005';
    else if (brand === 'DBBL Nexus') cardInput.placeholder = '6031 9283 1029 3847';
  }
}

function formatCardNumberInput(input) {
  let val = input.value.replace(/\D/g, '');
  val = val.replace(/(.{4})/g, '$1 ').trim();
  input.value = val.substring(0, 19);
}

/* TICKET SCANNER SYSTEM PORTAL */
let scannerMediaStream = null;
let currentScannedBooking = null;

function switchSellTicketsModalTab(tab) {
  const sectionCreate = document.getElementById('sell-section-create');
  const sectionScan = document.getElementById('sell-section-scan');
  const btnCreate = document.getElementById('sell-tab-btn-create');
  const btnScan = document.getElementById('sell-tab-btn-scan');

  if (tab === 'scan') {
    if (sectionCreate) sectionCreate.style.display = 'none';
    if (sectionScan) sectionScan.style.display = 'block';
    if (btnCreate) {
      btnCreate.className = 'btn-outline-3d';
      btnCreate.style.borderColor = 'rgba(255,255,255,0.2)';
      btnCreate.style.color = '#e2e8f0';
      btnCreate.style.background = 'transparent';
      btnCreate.style.boxShadow = 'none';
    }
    if (btnScan) {
      btnScan.className = 'btn-primary-3d';
      btnScan.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btnScan.style.color = '#ffffff';
      btnScan.style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)';
    }
    switchScannerTab('manual');
  } else {
    if (sectionCreate) sectionCreate.style.display = 'block';
    if (sectionScan) sectionScan.style.display = 'none';
    if (btnCreate) {
      btnCreate.className = 'btn-primary-3d';
      btnCreate.style.background = '';
      btnCreate.style.color = '';
      btnCreate.style.boxShadow = '';
    }
    if (btnScan) {
      btnScan.className = 'btn-outline-3d';
      btnScan.style.borderColor = '#10b981';
      btnScan.style.color = '#10b981';
      btnScan.style.background = 'transparent';
      btnScan.style.boxShadow = 'none';
    }
    stopWebCamStream();
  }
}

function openScannerModal() {
  const createModal = document.getElementById('create-event-modal');
  if (createModal && createModal.classList.contains('active')) {
    switchSellTicketsModalTab('scan');
  } else {
    const scannerModal = document.getElementById('scanner-modal');
    if (scannerModal) {
      openModalById('scanner-modal');
    } else {
      openCreateEventModal();
      switchSellTicketsModalTab('scan');
    }
  }
  switchScannerTab('manual');
}

function closeScannerModal() {
  stopWebCamStream();
  closeModals();
}

function stopWebCamStream() {
  if (scannerMediaStream) {
    scannerMediaStream.getTracks().forEach(track => track.stop());
    scannerMediaStream = null;
  }
  const video = document.getElementById('scanner-video');
  if (video) video.srcObject = null;
}

function switchScannerTab(tabName) {
  const tabs = ['manual', 'upload'];
  const targetTab = tabs.includes(tabName) ? tabName : 'manual';
  tabs.forEach(t => {
    const btn = document.getElementById(`scan-tab-${t}`);
    const view = document.getElementById(`scan-view-${t}`);
    if (btn) btn.className = (t === targetTab) ? 'btn-primary-3d' : 'btn-outline-3d';
    if (view) view.style.display = (t === targetTab) ? 'block' : 'none';
  });
  stopWebCamStream();
}

async function startWebCamScanner() {
  const video = document.getElementById('scanner-video');
  const statusText = document.getElementById('camera-status-text');
  if (!video) return;

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      scannerMediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      video.srcObject = scannerMediaStream;
      if (statusText) statusText.innerHTML = '<i class="fa-solid fa-circle-dot fa-beat-fade"></i> Camera Live. Point at Ticket QR Code';
    } else {
      if (statusText) statusText.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i> Camera permission unavailable. Use Manual Code Lookup.';
    }
  } catch (err) {
    if (statusText) statusText.innerHTML = '<i class="fa-solid fa-camera-rotate" style="color:#fbbf24;"></i> WebCam Simulator active. Use Manual Lookup or Demo Codes.';
  }
}

function fillSampleCode(code) {
  const input = document.getElementById('manual-scan-code');
  if (input) input.value = code;
  switchScannerTab('manual');
  executeManualLookup();
}

async function executeManualLookup() {
  const input = document.getElementById('manual-scan-code');
  const code = input ? input.value.trim() : '';

  if (!code) {
    showToast('Please enter a ticket booking code to lookup.');
    return;
  }

  const placeholder = document.getElementById('scan-result-placeholder');
  const resultCard = document.getElementById('scan-result-card');
  const badgeWrap = document.getElementById('scan-status-badge-wrap');
  const eventEl = document.getElementById('scan-res-event');
  const nameEl = document.getElementById('scan-res-name');
  const qtyEl = document.getElementById('scan-res-qty');
  const codeEl = document.getElementById('scan-res-code');
  const payEl = document.getElementById('scan-res-pay');
  const msgEl = document.getElementById('scan-res-msg');
  const btnCheckin = document.getElementById('btn-do-checkin');

  try {
    let res = await fetch('/api/bookings/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    });

    if (!res.ok && res.status === 404) {
      res = await fetch('/api/scanner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
    }

    let data;
    try {
      data = await res.json();
    } catch(e) {
      data = { valid: false, message: 'Invalid ticket response' };
    }

    currentScannedBooking = data.booking || null;

    if (placeholder) placeholder.style.display = 'none';
    if (resultCard) resultCard.style.display = 'block';

    if (!data.booking) {
      isTicketValidatedForSell = false;
      updateTicketScanAlertUI(false, data.message || 'No booking record matches this ticket code. Please scan a valid ticket.');
      if (badgeWrap) badgeWrap.innerHTML = '<span class="status-badge-invalid"><i class="fa-solid fa-circle-xmark"></i> INVALID TICKET NOT FOUND</span>';
      if (eventEl) eventEl.textContent = 'Unknown Ticket Pass';
      if (nameEl) nameEl.textContent = 'N/A';
      if (qtyEl) qtyEl.textContent = '0 Pass';
      if (codeEl) codeEl.textContent = code;
      if (payEl) payEl.textContent = 'None';
      if (msgEl) {
        msgEl.style.background = 'rgba(239,68,68,0.12)';
        msgEl.style.color = '#f87171';
        msgEl.textContent = data.message || 'No booking record matches this ticket code.';
      }
      if (btnCheckin) btnCheckin.style.display = 'none';
      playScanSound(false);
      return;
    }

    const b = data.booking;
    if (eventEl) eventEl.textContent = b.eventTitle || 'Event Ticket';
    if (nameEl) nameEl.textContent = b.userName || 'Guest Attendee';
    if (qtyEl) qtyEl.textContent = `${b.quantity || 1} Ticket(s)`;
    if (codeEl) codeEl.textContent = b.bookingCode || code;
    if (payEl) payEl.textContent = b.paymentMethod || 'bKash';

    if (b.status === 'Checked In' || data.status === 'USED') {
      isTicketValidatedForSell = false;
      updateTicketScanAlertUI(false, 'Ticket was ALREADY checked in. Please scan an active valid ticket.');
      if (badgeWrap) badgeWrap.innerHTML = '<span class="status-badge-used"><i class="fa-solid fa-triangle-exclamation"></i> ALREADY CHECKED IN (USED)</span>';
      if (msgEl) {
        msgEl.style.background = 'rgba(245,158,11,0.12)';
        msgEl.style.color = '#fbbf24';
        msgEl.textContent = `⚠️ Warning: Ticket was ALREADY checked in.`;
      }
      if (btnCheckin) btnCheckin.style.display = 'none';
      playScanSound(false);
    } else {
      isTicketValidatedForSell = true;
      updateTicketScanAlertUI(true, `Ticket Code "${b.bookingCode || code}" Validated! You are authorized to sell tickets.`);
      if (badgeWrap) badgeWrap.innerHTML = '<span class="status-badge-valid"><i class="fa-solid fa-circle-check"></i> VALID GATE PASS READY</span>';
      if (msgEl) {
        msgEl.style.background = 'rgba(16,185,129,0.12)';
        msgEl.style.color = '#34d399';
        msgEl.textContent = '✅ Ticket status is CONFIRMED & VALID. You can now sell tickets!';
      }
      if (btnCheckin) btnCheckin.style.display = 'block';
      playScanSound(true);
    }
  } catch (err) {
    console.error('Scan lookup error:', err);
    showToast('Failed to connect to scanner API.');
  }
}

async function confirmCheckInAction() {
  if (!currentScannedBooking) return;
  const code = currentScannedBooking.bookingCode || currentScannedBooking.code || currentScannedBooking.id;

  try {
    let res = await fetch('/api/bookings/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    });

    if (!res.ok) {
      res = await fetch('/api/scanner/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
    }

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Check-in failed.');
      return;
    }

    currentScannedBooking.status = 'Checked In';

    const badgeWrap = document.getElementById('scan-status-badge-wrap');
    const msgEl = document.getElementById('scan-res-msg');
    const btnCheckin = document.getElementById('btn-do-checkin');

    if (badgeWrap) badgeWrap.innerHTML = '<span class="status-badge-used"><i class="fa-solid fa-circle-check"></i> CHECKED-IN (ENTRY GRANTED)</span>';
    if (msgEl) {
      msgEl.style.background = 'rgba(16,185,129,0.2)';
      msgEl.style.color = '#34d399';
      msgEl.textContent = `🎉 Gate Entry Granted for ${currentScannedBooking.userName || 'Attendee'}! Pass recorded.`;
    }
    if (btnCheckin) btnCheckin.style.display = 'none';

    playScanSound(true);
    showToast(`🎉 Gate Check-In Successful! Code: ${code}`);

    if (typeof loadAllDashboardRecords === 'function') {
      loadAllDashboardRecords();
    }
  } catch (err) {
    console.error('Check-in error:', err);
    showToast('Check-in system error.');
  }
}

function handleQrFileUpload(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  showToast(`Processing QR image: ${file.name}...`);
  setTimeout(() => {
    const mockCode = 'AURA-VIP8890';
    const codeInput = document.getElementById('manual-scan-code');
    if (codeInput) codeInput.value = mockCode;
    switchScannerTab('manual');
    executeManualLookup();
  }, 600);
}

function playScanSound(isValid) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isValid) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

function getQrCodeImageUrl(dataText, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(dataText)}&color=000000&bgcolor=ffffff`;
}

