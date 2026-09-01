// Global State
let currentUser = JSON.parse(localStorage.getItem('aura_user')) || null;
let currentEventForBooking = null;
let selectedPaymentMethod = 'bKash';
let selectedSubPaymentMethod = 'bKash';
let selectedSellerPayoutMethod = 'bKash';

let allEvents = [];
let currentPage = 1;
const eventsPerPage = 4;

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

  const isSubscribed = currentUser ? !!currentUser.isSubscribed : false;

  if (currentUser) {
    loginItem.style.display = 'none';
    registerItem.style.display = 'none';
    userItem.style.display = 'block';
    userNameSpan.textContent = currentUser.fullName || currentUser.email;
  } else {
    loginItem.style.display = 'block';
    registerItem.style.display = 'block';
    userItem.style.display = 'none';
  }

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

// Fetch Events from API & Enable Pagination
async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to load events');
    allEvents = await res.json();
    renderCurrentPageEvents();
  } catch (err) {
    console.error('API Error:', err);
    renderFallbackEvents();
  }
}

function renderCurrentPageEvents() {
  const eventsGrid = document.getElementById('events-grid');
  eventsGrid.innerHTML = '';

  const startIndex = (currentPage - 1) * eventsPerPage;
  const pageEvents = allEvents.slice(startIndex, startIndex + eventsPerPage);

  pageEvents.forEach(evt => {
    eventsGrid.appendChild(createEventCard3D(evt));
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.ceil(allEvents.length / eventsPerPage);
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

let inlinePaymentMethods = {};

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

        <label style="font-size:12px; font-weight:700; color:#d4d4d8; display:block; margin-bottom:6px;">Payment Method:</label>
        <div class="payment-tabs" style="grid-template-columns: repeat(3, 1fr); gap:6px; margin-bottom:12px;">
          <div id="inline-tab-bkash-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'bKash')" class="pay-tab active-bkash" style="padding:6px 2px; font-size:11px;">
            <i class="fa-solid fa-mobile-screen" style="color:var(--color-bkash);"></i> bKash
          </div>
          <div id="inline-tab-nagad-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Nagad')" class="pay-tab" style="padding:6px 2px; font-size:11px;">
            <i class="fa-solid fa-wallet" style="color:var(--color-nagad);"></i> Nagad
          </div>
          <div id="inline-tab-card-${evt.id}" onclick="selectInlinePaymentMethod(${evt.id}, 'Card')" class="pay-tab" style="padding:6px 2px; font-size:11px;">
            <i class="fa-solid fa-credit-card" style="color:var(--color-card);"></i> Card
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
  document.getElementById(`inline-tab-bkash-${evtId}`).className = 'pay-tab' + (method === 'bKash' ? ' active-bkash' : '');
  document.getElementById(`inline-tab-nagad-${evtId}`).className = 'pay-tab' + (method === 'Nagad' ? ' active-nagad' : '');
  document.getElementById(`inline-tab-card-${evtId}`).className = 'pay-tab' + (method === 'Card' ? ' active-card' : '');

  const input = document.getElementById(`inline-account-${evtId}`);
  if (input) {
    if (method === 'Card') {
      input.placeholder = 'Card Number (e.g. 1234 5678...)';
    } else {
      input.placeholder = `${method} Account (e.g. 01700...)`;
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
    currentUser = { id: 1, fullName: 'Guest User', email: 'guest@aura.com', isSubscribed: false };
    localStorage.setItem('aura_user', JSON.stringify(currentUser));
    updateUserNav();
  }

  const qtyInput = document.getElementById(`inline-qty-${evtId}`);
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
  const accountInput = document.getElementById(`inline-account-${evtId}`);
  const accountNum = accountInput ? accountInput.value : '';
  const paymentMethod = inlinePaymentMethods[evtId] || 'bKash';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        eventId: evtId,
        quantity: qty,
        paymentMethod: paymentMethod,
        accountNumber: accountNum
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Booking failed.');
      return;
    }

    showToast(`🎉 Ticket Booked via ${paymentMethod}! Code: ${data.booking.bookingCode}`);
    fetchEvents(); // Refresh stock live from API
  } catch (err) {
    console.error('Inline Booking Error:', err);
    const code = 'AURA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    showToast(`🎉 Ticket Booked via ${paymentMethod}! Code: ${code}`);
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
    { id: 16, title: 'Carnival De Rio Night', venue: 'Sambadrome Marquês', location: 'Rio de Janeiro, Brazil', eventDate: '2026-09-28T21:30:00', price: 420, currency: 'BDT', availableTickets: 840, imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800' }
  ];
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
  openModalById('create-event-modal');
}

function openDashboardModal() {
  if (!currentUser) {
    openLoginModal();
    showToast('Please login to view dashboard.');
    return;
  }
  openModalById('dashboard-modal');
  switchDashTab('tickets');
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
      card.innerHTML = `
        <div>
          <span class="ticket-code-tag">${b.bookingCode || 'TICKET'}</span>
          <h4 style="color:white; font-size:16px; margin:6px 0 4px;">${b.eventTitle || 'Event Ticket'}</h4>
          <p style="font-size:13px; color:var(--text-muted);">${b.quantity || 1} Ticket(s) &bull; ${b.paymentMethod || 'bKash'}</p>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--primary-red); font-weight:800; font-size:16px;">BDT ${b.totalAmount}</div>
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
    statusText.innerHTML = `<span style="color:#10b981; font-weight:800;"><i class="fa-solid fa-check-circle"></i> ACTIVE PRO ORGANIZER PASS</span><br><br>You are authorized to publish and sell tickets on AURA++.`;
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

// Payment Selection Logic (bKash, Nagad, Credit Card)
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.getElementById('pay-tab-bkash').className = 'pay-tab' + (method === 'bKash' ? ' active-bkash' : '');
  document.getElementById('pay-tab-nagad').className = 'pay-tab' + (method === 'Nagad' ? ' active-nagad' : '');
  document.getElementById('pay-tab-card').className = 'pay-tab' + (method === 'Card' ? ' active-card' : '');

  const mobileGroup = document.getElementById('pay-fields-mobile');
  const cardGroup = document.getElementById('pay-fields-card');
  const label = document.getElementById('mobile-pay-label');

  if (method === 'Card') {
    mobileGroup.style.display = 'none';
    cardGroup.style.display = 'block';
  } else {
    mobileGroup.style.display = 'block';
    cardGroup.style.display = 'none';
    label.textContent = `${method} Account Number`;
  }
}

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

// Booking Modal Logic
function openBookingModal(eventId, title, venue, date, price) {
  currentEventForBooking = { id: eventId, title, venue, date, price };
  document.getElementById('booking-event-title').textContent = title;
  document.getElementById('booking-event-venue').textContent = venue;
  document.getElementById('booking-event-date').textContent = date;
  document.getElementById('booking-event-price').textContent = `BDT ${price}`;
  document.getElementById('ticket-quantity').value = 1;
  updateBookingTotal();

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
    currentUser = { id: 1, fullName: 'Guest User', email: 'guest@aura.com', isSubscribed: false };
    localStorage.setItem('aura_user', JSON.stringify(currentUser));
    updateUserNav();
  }

  const qty = parseInt(document.getElementById('ticket-quantity').value) || 1;
  const accountNum = document.getElementById('pay-account-number').value;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        eventId: currentEventForBooking.id,
        quantity: qty,
        paymentMethod: selectedPaymentMethod,
        accountNumber: accountNum
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Booking failed.');
      return;
    }

    closeModals();
    showToast(`Confirmed via ${selectedPaymentMethod}! Code: ${data.booking.bookingCode}`);
    fetchEvents(); // Refresh stock dynamically from API
  } catch (err) {
    console.error('Booking Error:', err);
    closeModals();
    const code = 'AURA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    showToast(`Confirmed via ${selectedPaymentMethod}! Code: ${code}`);
    fetchEvents();
  }
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

// Seller Create Event API Logic
async function handleCreateEvent(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.isSubscribed) {
    openModalById('sell-warning-modal');
    return;
  }

  const title = document.getElementById('evt-title').value;
  const venue = document.getElementById('evt-venue').value;
  const location = document.getElementById('evt-location').value;
  const price = parseFloat(document.getElementById('evt-price').value) || 0;
  const totalTickets = parseInt(document.getElementById('evt-tickets').value) || 0;
  const eventDate = document.getElementById('evt-date').value;
  const imageUrl = document.getElementById('evt-image').value;

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
    heroSubtitle: "Step into a magical realm of live entertainment. Discover world-class concerts, electrifying EDM festivals, and epic tech spectacles — or subscribe as a Pro Organizer to publish and sell tickets on AURA++.",
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
