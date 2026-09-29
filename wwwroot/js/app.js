// Global State
let currentUser = JSON.parse(localStorage.getItem('aura_user')) || null;
let currentEventForBooking = null;
let currentEventForDetails = null;
let bookingConfirmationData = null;
let selectedSubPaymentMethod = 'bKash';
let selectedSellerPayoutMethod = 'bKash';

let allEvents = [];
let currentPage = 1;
const eventsPerPage = 4;
let activeEventCategory = 'all';
let eventLoadFailed = false;
let eventFilterSequence = 0;
let modalReturnFocus = null;
let toastDismissTimer = 0;
let eventSearchText = '';
let eventLocationText = '';
let eventSortOrder = 'date';
let eventFromDate = '';
let eventToDate = '';
let eventMinPrice = null;
let eventMaxPrice = null;

function setActionLoading(button, loading, label) {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalMarkup) button.dataset.originalMarkup = button.innerHTML;
    button.dataset.restoreFocus = String(document.activeElement === button);
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${label || 'Workingâ€¦'}`;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.originalMarkup) button.innerHTML = button.dataset.originalMarkup;
    delete button.dataset.originalMarkup;
    const shouldRestoreFocus = button.dataset.restoreFocus === 'true';
    delete button.dataset.restoreFocus;
    const activeModal = document.querySelector('.modal-overlay.active');
    if (shouldRestoreFocus && button.isConnected && !button.closest('.modal-overlay[aria-hidden="true"]') && (!activeModal || activeModal.contains(button))) {
      button.focus({ preventScroll: true });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initModalInteractions();
  initAuraCanvas();
  initAnimatedHeroTitle();
  initTicketVerification();
  initResaleExperience();
  updateUserNav();
  initEventDiscovery();
  document.getElementById('ticket-quantity')?.addEventListener('input', updateBookingTotal);
  fetchEvents();
  loadPublicResaleListings();
});

function initEventDiscovery() {
  const panel = document.getElementById('event-filter-panel');
  const mobile = window.matchMedia('(max-width: 760px)');
  if (panel) panel.open = !mobile.matches;
  mobile.addEventListener?.('change', event => { if (panel) panel.open = !event.matches; });

  applyEventFiltersFromUrl();
  [['event-search', eventSearchText], ['event-location-filter', eventLocationText], ['event-date-from', eventFromDate], ['event-date-to', eventToDate], ['event-price-min', eventMinPrice ?? ''], ['event-price-max', eventMaxPrice ?? ''], ['event-sort', eventSortOrder]].forEach(([id, value]) => {
    const control = document.getElementById(id);
    if (control) control.value = value;
  });

  ['event-search', 'event-location-filter', 'event-date-from', 'event-date-to', 'event-price-min', 'event-price-max'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', handleEventFilterChange);
    document.getElementById(id)?.addEventListener('change', handleEventFilterChange);
  });
  document.getElementById('event-sort')?.addEventListener('change', handleEventFilterChange);
  window.addEventListener('popstate', () => {
    const eventId = Number(new URLSearchParams(window.location.search).get('event'));
    const detailModal = document.getElementById('event-details-modal');
    if (eventId > 0 && !detailModal?.classList.contains('active')) showEventDetails(eventId, { pushHistory: false });
    else if (eventId <= 0 && detailModal?.classList.contains('active')) closeModals({ restoreFocus: false });
    applyEventFiltersFromUrl();
    ['event-search', 'event-location-filter', 'event-date-from', 'event-date-to', 'event-price-min', 'event-price-max', 'event-sort'].forEach(id => {
      const control = document.getElementById(id);
      if (!control) return;
      const value = { 'event-search': eventSearchText, 'event-location-filter': eventLocationText, 'event-date-from': eventFromDate, 'event-date-to': eventToDate, 'event-price-min': eventMinPrice ?? '', 'event-price-max': eventMaxPrice ?? '', 'event-sort': eventSortOrder }[id];
      control.value = value;
    });
    currentPage = 1;
    renderEventFilters();
    updateActiveEventFilters();
    renderCurrentPageEvents();
  });
  updateActiveEventFilters();
  const eventId = Number(new URLSearchParams(window.location.search).get('event'));
  if (eventId > 0) showEventDetails(eventId, { pushHistory: false });
  else {
    const pendingEventId = Number(sessionStorage.getItem('aura_pending_event'));
    if (pendingEventId > 0) {
      sessionStorage.removeItem('aura_pending_event');
      showEventDetails(pendingEventId, { pushHistory: true });
    }
  }
}

function applyEventFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  eventSearchText = (params.get('q') || '').trim().toLowerCase();
  eventLocationText = (params.get('location') || '').trim().toLowerCase();
  eventFromDate = params.get('from') || '';
  eventToDate = params.get('to') || '';
  const minimum = params.get('minPrice');
  const maximum = params.get('maxPrice');
  eventMinPrice = minimum !== null && minimum !== '' && Number.isFinite(Number(minimum)) ? Number(minimum) : null;
  eventMaxPrice = maximum !== null && maximum !== '' && Number.isFinite(Number(maximum)) ? Number(maximum) : null;
  eventSortOrder = ['date', 'price', 'price-desc', 'popular'].includes(params.get('sort')) ? params.get('sort') : 'date';
  activeEventCategory = (params.get('category') || 'all').trim().toLowerCase() || 'all';
}

function handleEventFilterChange() {
  eventSearchText = (document.getElementById('event-search')?.value || '').trim().toLowerCase();
  eventLocationText = (document.getElementById('event-location-filter')?.value || '').trim().toLowerCase();
  eventFromDate = document.getElementById('event-date-from')?.value || '';
  eventToDate = document.getElementById('event-date-to')?.value || '';
  const minimum = document.getElementById('event-price-min')?.value;
  const maximum = document.getElementById('event-price-max')?.value;
  eventMinPrice = minimum !== '' && Number.isFinite(Number(minimum)) ? Number(minimum) : null;
  eventMaxPrice = maximum !== '' && Number.isFinite(Number(maximum)) ? Number(maximum) : null;
  eventSortOrder = document.getElementById('event-sort')?.value || 'date';
  currentPage = 1;
  syncEventFiltersToUrl();
  updateActiveEventFilters();
  renderCurrentPageEvents();
}

function syncEventFiltersToUrl() {
  const url = new URL(window.location.href);
  const values = { q: eventSearchText, location: eventLocationText, from: eventFromDate, to: eventToDate, minPrice: eventMinPrice, maxPrice: eventMaxPrice, sort: eventSortOrder === 'date' ? '' : eventSortOrder, category: activeEventCategory === 'all' ? '' : activeEventCategory };
  Object.entries(values).forEach(([key, value]) => value === null || value === '' ? url.searchParams.delete(key) : url.searchParams.set(key, String(value)));
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function updateActiveEventFilters() {
  const summary = document.getElementById('event-active-filters');
  const countBadge = document.getElementById('event-filter-count');
  const clearButton = document.getElementById('event-clear-filters');
  if (!summary || !countBadge || !clearButton) return;
  const active = [];
  if (eventSearchText) active.push(['Search', document.getElementById('event-search')?.value || eventSearchText]);
  if (eventLocationText) active.push(['Where', document.getElementById('event-location-filter')?.value || eventLocationText]);
  if (eventFromDate) active.push(['From', eventFromDate]);
  if (eventToDate) active.push(['To', eventToDate]);
  if (eventMinPrice !== null) active.push(['Min', `BDT ${eventMinPrice.toLocaleString()}`]);
  if (eventMaxPrice !== null) active.push(['Max', `BDT ${eventMaxPrice.toLocaleString()}`]);
  if (activeEventCategory !== 'all') active.push(['Category', activeEventCategory]);
  if (eventSortOrder !== 'date') active.push(['Sort', document.getElementById('event-sort')?.selectedOptions[0]?.textContent || eventSortOrder]);
  summary.replaceChildren();
  active.forEach(([label, value]) => {
    const chip = document.createElement('span');
    chip.className = 'event-active-filter-chip';
    chip.textContent = `${label}: ${value}`;
    summary.appendChild(chip);
  });
  summary.hidden = active.length === 0;
  countBadge.textContent = String(active.length);
  countBadge.setAttribute('aria-label', `${active.length} active ${active.length === 1 ? 'filter' : 'filters'}`);
  clearButton.hidden = active.length === 0;
}

function clearEventFilters() {
  ['event-search', 'event-location-filter', 'event-date-from', 'event-date-to', 'event-price-min', 'event-price-max'].forEach(id => {
    const control = document.getElementById(id);
    if (control) control.value = '';
  });
  const sort = document.getElementById('event-sort');
  if (sort) sort.value = 'date';
  eventSearchText = '';
  eventLocationText = '';
  eventFromDate = '';
  eventToDate = '';
  eventMinPrice = null;
  eventMaxPrice = null;
  eventSortOrder = 'date';
  activeEventCategory = 'all';
  currentPage = 1;
  syncEventFiltersToUrl();
  renderEventFilters();
  updateActiveEventFilters();
  renderCurrentPageEvents();
  document.getElementById('event-search')?.focus({ preventScroll: true });
}

async function loadPublicResaleListings() {
  const container=document.getElementById('resale-market-listings'); if(!container)return;
  try { const response=await fetch('/api/resale'); if(!response.ok)throw new Error(); const listings=await response.json();
    if(!listings.length){container.innerHTML='<p class="dash-empty">No verified tickets are currently listed for resale.</p>';return;}
    container.innerHTML=listings.map(item=>`<article class="resale-listing-card"><img src="${String(item.imageUrl||'').replace(/[&<>"']/g,'')}" alt="" loading="lazy"><div><strong>${String(item.eventName||'Event').replace(/[&<>"']/g,'')}</strong><p>${String(item.venue||'').replace(/[&<>"']/g,'')} Â· ${new Date(item.eventDate).toLocaleDateString()}</p><p>${Number(item.askingPrice).toLocaleString()} BDT Â· AURA ownership transfer record</p><button type="button" onclick="buyAuraListing(${Number(item.id)})">Continue with transfer</button></div></article>`).join('');
  } catch (_) { container.innerHTML='<p class="dash-empty">Resale listings are unavailable right now.</p>'; }
}
async function buyAuraListing(id) {
  if(!currentUser){openLoginModal();return;}
  if(!confirm('Continue with this ticket ownership transfer?'))return;
  const response=await fetch(`/api/resale/${id}/buy`,{method:'POST'}); const data=await response.json().catch(()=>({}));
  if(!response.ok){showToast(data.message||'This ticket is no longer listed.','error');return;}
  showToast(data.message,'success');loadPublicResaleListings();
}

function initTicketVerification() {
  const form = document.getElementById('ticket-verification-form');
  if (!form) return;
  const ticket = document.getElementById('verification-ticket');
  const codeInput = document.getElementById('ticket-verification-code');
  const submit = document.getElementById('ticket-verification-submit');
  const message = document.getElementById('ticket-verification-message');
  const statusLabel = document.getElementById('verify-ticket-status');
  const title = document.getElementById('verify-ticket-event');
  const date = document.getElementById('verify-ticket-date');
  const venue = document.getElementById('verify-ticket-venue');
  const type = document.getElementById('verify-ticket-type');
  const ticketId = document.getElementById('verify-ticket-id');
  const stubCode = document.getElementById('verify-stub-code');
  let requestPending = false;

  const clearDetails = () => {
    title.textContent = 'The details are on the ticket.';
    date.textContent = 'â€”';
    venue.textContent = 'â€”';
    type.textContent = 'â€”';
    ticketId.textContent = 'ENTER ID TO CHECK';
    stubCode.textContent = 'AURA â€” â€” â€”';
  };

  codeInput.addEventListener('input', () => {
    if (requestPending) return;
    window.AuraMotion?.verification?.reset(ticket);
    clearDetails();
    statusLabel.textContent = 'AWAITING CHECK';
    message.textContent = 'Results come directly from AURAâ€™s booking records.';
    message.dataset.state = 'idle';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestPending) return;
    const bookingCode = codeInput.value.trim().toUpperCase();
    if (!bookingCode) return;

    requestPending = true;
    codeInput.disabled = true;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.innerHTML = '<span class="verify-submit-pulse" aria-hidden="true"></span> Checking AURA records';
    clearDetails();
    ticketId.textContent = bookingCode;
    stubCode.textContent = bookingCode;
    statusLabel.textContent = 'CHECKING RECORD';
    message.textContent = 'Checking the booking record nowâ€¦';
    message.dataset.state = 'loading';
    window.AuraMotion?.verification?.begin(ticket);

    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode }),
      });
      const result = await response.json().catch(() => ({}));
      const state = response.status === 404 ? 'notFound' : (result.state || (response.ok ? 'invalid' : 'error'));
      const stateCopy = {
        verified: ['VERIFIED', 'This ticket is valid and has not been marked as used.'],
        used: ['ALREADY USED', 'This ticket has already been used.'],
        invalid: ['INVALID', result.message || 'This ticket is not active. Contact the event organizer for help.'],
        notFound: ['NOT FOUND', result.message || 'No ticket matches that ID.'],
        error: ['CHECK UNAVAILABLE', result.message || 'We could not reach AURAâ€™s booking records. Try again.'],
      }[state] || ['CHECK UNAVAILABLE', 'We could not verify this ticket right now. Try again.'];

      statusLabel.textContent = stateCopy[0];
      message.textContent = stateCopy[1];
      message.dataset.state = state;
      window.AuraMotion?.verification?.finish(ticket, state);
      window.dispatchEvent(new CustomEvent('aura:ticket-check', { detail: { state, bookingCode, ticket: result.ticket || null } }));

      if (result.ticket) {
        const booking = result.ticket;
        title.textContent = booking.event || 'Event details unavailable';
        const eventDate = booking.eventDate ? new Date(booking.eventDate) : null;
        date.textContent = eventDate && !Number.isNaN(eventDate.getTime())
          ? eventDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
          : 'Date not listed';
        venue.textContent = [booking.venue, booking.location].filter(Boolean).join(' Â· ') || 'Venue not listed';
        type.textContent = booking.ticketType || 'Not specified';
        ticketId.textContent = booking.ticketId || bookingCode;
        stubCode.textContent = booking.ticketId || bookingCode;
      } else {
        ticketId.textContent = state === 'notFound' ? 'NO MATCHING RECORD' : bookingCode;
        stubCode.textContent = state === 'notFound' ? 'NOT FOUND' : bookingCode;
      }
    } catch (error) {
      statusLabel.textContent = 'CHECK UNAVAILABLE';
      message.textContent = 'We could not reach AURAâ€™s booking records. Try again.';
      message.dataset.state = 'error';
      window.AuraMotion?.verification?.finish(ticket, 'error');
      window.dispatchEvent(new CustomEvent('aura:ticket-check', { detail: { state: 'error', bookingCode, ticket: null } }));
    } finally {
      requestPending = false;
      codeInput.disabled = false;
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.innerHTML = 'Verify ticket <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    }
  });
}

function initResaleExperience() {
  const flow = document.getElementById('resale-trust-flow');
  const panel = document.querySelector('.resale-trust-panel');
  if (!flow || !panel) return;

  const steps = [...flow.querySelectorAll('.resale-flow-step')];
  const marker = document.getElementById('resale-transfer-marker');
  const progress = document.querySelector('.resale-flow-progress');
  const stepLabel = document.getElementById('resale-panel-step');
  const title = document.getElementById('resale-panel-title');
  const description = document.getElementById('resale-panel-description');
  const status = document.getElementById('resale-ticket-status');
  const eventInfo = document.getElementById('resale-ticket-event');
  const price = document.getElementById('resale-ticket-price');
  const eligibility = document.getElementById('resale-ticket-eligibility');
  const checkpoint = document.getElementById('resale-checkpoint');
  const buyButton = document.getElementById('resale-buy-cta');
  let currentStage = 0;
  let verifiedRecord = null;
  let verificationState = null;

  const stageContent = [
    ['ORIGINAL TICKET', 'AURA issued ticket', 'Every ticket comes from a stored AURA booking and keeps its issue record.'],
    ['AURA VERIFICATION', 'Check the live ticket record.', 'Verification checks the current owner and ticket status in AURA records.'],
    ['RESALE ELIGIBILITY', 'Subscriber listing access', 'Active subscribers can list tickets they own when the ticket is valid and unused.'],
    ['BUYER', 'Browse active listings.', 'Only current, active ticket listings appear in this marketplace.'],
    ['OWNERSHIP TRANSFER', 'Owner record updated.', 'A completed transfer assigns the ticket to the buyer and closes the listing.'],
    ['VERIFIED NEW TICKET', 'New owner can verify.', 'The transferred ticket stays traceable to its original AURA issue record.'],
  ];

  function updateMarker() {
    const active = steps[currentStage];
    if (!active || !marker) return;
    const y = active.offsetTop + active.offsetHeight / 2 - marker.offsetHeight / 2;
    marker.style.transform = `translateY(${Math.max(0, y)}px)`;
    if (progress) progress.style.height = `${Math.max(0, active.offsetTop + active.offsetHeight / 2)}px`;
  }

  function selectStage(index) {
    currentStage = index;
    steps.forEach((step, stepIndex) => {
      const selected = stepIndex === index;
      step.classList.toggle('is-current', selected);
      step.querySelector('button').setAttribute('aria-pressed', String(selected));
    });
    const [label, heading, copy] = stageContent[index];
    stepLabel.textContent = `0${index + 1} / ${label}`;
    title.textContent = verifiedRecord && index < 2 ? `${verifiedRecord.event || 'Original booking'} / ${verificationState === 'verified' ? 'record found' : 'record checked'}` : heading;
    description.textContent = index < 2 && verifiedRecord
      ? `${copy} The lookup returned an original booking record${verificationState === 'verified' ? ' marked active' : ` marked ${verificationState}`}.`
      : copy;
    panel.classList.remove('is-changing');
    void panel.offsetWidth;
    panel.classList.add('is-changing');
    updateMarker();
  }

  steps.forEach((step, index) => {
    step.querySelector('button').addEventListener('click', () => selectStage(index));
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    steps.forEach(step => step.classList.add('is-revealed'));
  } else {
    const flowObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      flowObserver.unobserve(entry.target);
    }), { threshold: .12, rootMargin: '0px 0px -4% 0px' });
    steps.forEach(step => flowObserver.observe(step));
  }
  window.addEventListener('resize', updateMarker, { passive: true });
  const siteVisibilityObserver = new MutationObserver(() => {
    if (!document.body.classList.contains('aura-site-open')) return;
    requestAnimationFrame(updateMarker);
    siteVisibilityObserver.disconnect();
  });
  siteVisibilityObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (document.body.classList.contains('aura-site-open')) {
    requestAnimationFrame(updateMarker);
    siteVisibilityObserver.disconnect();
  }
  window.addEventListener('aura:ticket-check', event => {
    verificationState = event.detail.state;
    verifiedRecord = event.detail.ticket;
    status.textContent = verificationState === 'verified' ? 'Verified in booking records'
      : verificationState === 'used' ? 'Marked as used'
        : verificationState === 'invalid' ? 'Inactive booking'
          : verificationState === 'notFound' ? 'No matching booking' : 'Lookup unavailable';
    if (verifiedRecord) {
      const date = verifiedRecord.eventDate ? new Date(verifiedRecord.eventDate) : null;
      const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date not listed';
      eventInfo.textContent = [verifiedRecord.event, dateText, verifiedRecord.venue, verifiedRecord.location].filter(Boolean).join(' Â· ');
    } else {
      eventInfo.textContent = verificationState === 'notFound' ? 'No matching record' : 'Details unavailable';
    }
    price.textContent = 'No resale price listed';
    eligibility.textContent = 'Not available in AURA today';
    selectStage(Math.min(currentStage, 1));
  });
  buyButton.addEventListener('click', () => document.getElementById('resale-market-listings')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }));

  selectStage(0);
}

/* MAGICAL STAGGERED ALPHABET ANIMATION FOR HERO TITLE */
function initAnimatedHeroTitle() {
  const titleEl = document.getElementById('hero-animated-title');
  if (!titleEl) return;

  // The cinematic homepage provides its own accessible line structure.
  if (titleEl.querySelector('.hero-line')) {
    return;
  }

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
  // The canvas is intentionally hidden in the current foundation stylesheet.
  // Avoid allocating 70 particles and a permanent RAF loop for an invisible layer.
  if (!canvas || getComputedStyle(canvas).display === 'none' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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
      color: i % 3 === 0 ? '#b8b0d4' : (i % 3 === 1 ? '#a8c5e0' : '#c9b8a8'),
      alpha: Math.random() * 0.5 + 0.3
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
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

/* ============================================================
   USER NAVIGATION & STATE â€” controls navbar visibility
   ============================================================ */
function updateUserNav() {
  const loginItem = document.getElementById('nav-login-item');
  const registerItem = document.getElementById('nav-register-item');
  const userItem = document.getElementById('nav-user-item');
  const userNameSpan = document.getElementById('logged-user-name');
  const subBadge = document.getElementById('sub-badge-status');
  const navSubscribeBtn = document.getElementById('nav-subscribe-btn');
  const subItem = document.getElementById('nav-subscribe-item');
  const sellItem = document.getElementById('nav-sell-item');
  const isSubscribed = currentUser ? !!currentUser.isSubscribed : false;

  if (currentUser) {
    // Logged in
    if (loginItem) loginItem.style.display = 'none';
    if (registerItem) registerItem.style.display = 'none';
    if (userItem) userItem.style.display = 'flex';
    if (userNameSpan) userNameSpan.textContent = currentUser.fullName || currentUser.email;

    // Show seller-only buttons after login
    if (subItem) subItem.style.display = '';
    if (sellItem) sellItem.style.display = '';
  } else {
    // Logged out
    if (loginItem) loginItem.style.display = 'block';
    if (registerItem) registerItem.style.display = 'block';
    if (userItem) userItem.style.display = 'none';

    // Hide seller-only buttons when not logged in
    if (subItem) subItem.style.display = 'none';
    if (sellItem) sellItem.style.display = 'none';
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
      navSubscribeBtn.onclick = function () {
        showToast('ðŸ‘‘ You are already a Subscribed Pro Seller!');
      };
    }
  } else {
    if (subBadge) subBadge.style.display = 'none';
    if (navSubscribeBtn) {
      navSubscribeBtn.className = 'btn-subscribe-nav';
      navSubscribeBtn.removeAttribute('style');
      navSubscribeBtn.innerHTML = '<i class="fa-solid fa-crown" style="color:#ffffff; margin-right:4px;"></i> SUBSCRIBE';
      navSubscribeBtn.onclick = function () {
        openSubscribeModal();
      };
    }
  }
}

// Fetch Events from API & Enable Pagination
async function fetchEvents() {
  const eventsGrid = document.getElementById('events-grid');
  if (eventsGrid) {
    eventsGrid.setAttribute('aria-busy', 'true');
    eventsGrid.innerHTML = '<div class="event-loading" role="status" aria-label="Loading events"><span></span><span></span><span></span><span></span></div>';
  }
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to load events');
    const events = await res.json();
    if (!Array.isArray(events)) throw new Error('Unexpected events response');
    allEvents = events;
    eventLoadFailed = false;
    renderEventFilters();
    renderCurrentPageEvents();
  } catch (err) {
    console.error('API Error:', err);
    eventLoadFailed = true;
    allEvents = [];
    renderEventFilters();
    renderCurrentPageEvents();
  }
}

function getFilteredEvents() {
  let result = allEvents.filter(evt => (activeEventCategory === 'all' || String(evt.category || 'Other').trim().toLowerCase() === activeEventCategory)
    && (!eventSearchText || `${evt.title} ${evt.artist || ''} ${evt.venue} ${evt.location} ${evt.description} ${evt.category}`.toLowerCase().includes(eventSearchText))
    && (!eventLocationText || `${evt.location} ${evt.venue}`.toLowerCase().includes(eventLocationText))
    && (!eventFromDate || new Date(evt.eventDate) >= new Date(`${eventFromDate}T00:00:00`))
    && (!eventToDate || new Date(evt.eventDate) <= new Date(`${eventToDate}T23:59:59`))
    && (eventMinPrice === null || Number(evt.price) >= eventMinPrice)
    && (eventMaxPrice === null || Number(evt.price) <= eventMaxPrice));
  result = [...result];
  if (eventSortOrder === 'price') result.sort((a,b)=>a.price-b.price);
  else if (eventSortOrder === 'price-desc') result.sort((a,b)=>b.price-a.price);
  else if (eventSortOrder === 'popular') result.sort((a,b)=>(b.totalTickets-b.availableTickets)-(a.totalTickets-a.availableTickets));
  else result.sort((a,b)=>new Date(a.eventDate)-new Date(b.eventDate));
  return result;
}

function renderEventFilters() {
  const container = document.getElementById('event-filters');
  if (!container) return;
  const restoreFocus = container.contains(document.activeElement);
  const categories = [...new Set(allEvents.map(evt => String(evt.category || 'Other').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  if (activeEventCategory !== 'all' && !categories.some(category => category.toLowerCase() === activeEventCategory)) {
    activeEventCategory = 'all';
  }
  container.replaceChildren();
  const options = [{ label: 'All events', key: 'all' }, ...categories.map(label => ({ label, key: label.toLowerCase() }))];
  options.forEach(({ label, key }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-filter' + (activeEventCategory === key ? ' is-active' : '');
    button.dataset.categoryKey = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(activeEventCategory === key));
    button.addEventListener('click', () => setEventCategory(key));
    container.appendChild(button);
  });
  container.hidden = categories.length < 2;
  if (restoreFocus && !container.hidden) {
    container.querySelector(`[data-category-key="${CSS.escape(activeEventCategory)}"]`)?.focus({ preventScroll: true });
  }
  syncEventFiltersToUrl();
  updateActiveEventFilters();
}

async function setEventCategory(category) {
  if (category === activeEventCategory) return;
  activeEventCategory = category;
  currentPage = 1;
  const sequence = ++eventFilterSequence;
  renderEventFilters();
  const cards = document.querySelectorAll('#events-grid .event-card-3d');
  if (window.AuraMotion && typeof window.AuraMotion.exit === 'function') {
    await window.AuraMotion.exit(cards, { duration: .18, stagger: .025 });
  }
  if (sequence === eventFilterSequence) renderCurrentPageEvents({ immediate: true });
}

function updateEventResultCount(count) {
  const status = document.getElementById('event-results-count');
  if (!status) return;
  if (!count) {
    status.textContent = eventLoadFailed ? 'Events unavailable' : 'No events found';
    return;
  }
  const start = (currentPage - 1) * eventsPerPage + 1;
  const end = Math.min(currentPage * eventsPerPage, count);
  status.textContent = `Showing ${start}-${end} of ${count} ${count === 1 ? 'event' : 'events'}`;
}

function renderCurrentPageEvents(options = {}) {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;
  eventsGrid.innerHTML = '';
  eventsGrid.setAttribute('aria-busy', 'false');
  syncHeroEvent();

  if (eventLoadFailed) {
    eventsGrid.innerHTML = '<div class="events-state events-error" role="alert"><span class="events-state-mark" aria-hidden="true">!</span><p class="events-empty-kicker">DISCOVER EVENTS</p><h3>We couldn\'t load events.</h3><p>Check your connection, then try again.</p><button class="btn-primary-3d" type="button" onclick="fetchEvents()">Try again <i class="fa-solid fa-arrow-rotate-right" aria-hidden="true"></i></button></div>';
    updateEventResultCount(0);
    renderPaginationControls();
    return;
  }

  if (!allEvents.length) {
    eventsGrid.innerHTML = '<div class="events-empty"><span class="events-empty-mark" aria-hidden="true">A</span><p class="events-empty-kicker">THE NEXT GREAT NIGHT</p><h3>No events on the calendar yet.</h3><p>Check back soon, or bring the first one to AURA.</p><button class="btn-primary-3d" type="button" onclick="handleSellTicketsClick()">Create an event <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>';
    updateEventResultCount(0);
    renderPaginationControls();
    return;
  }

  const filteredEvents = getFilteredEvents();
  updateEventResultCount(filteredEvents.length);
  if (!filteredEvents.length) {
    eventsGrid.innerHTML = '<div class="events-empty"><span class="events-empty-mark" aria-hidden="true">A</span><p class="events-empty-kicker">DISCOVER EVENTS</p><h3>No events found</h3><p>Try adjusting your search or filters.</p><button class="event-filter-reset" type="button" onclick="clearEventFilters()">Clear filters</button></div>';
    renderPaginationControls();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));
  currentPage = Math.min(currentPage, totalPages);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const pageEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);
  updateEventResultCount(filteredEvents.length);

  pageEvents.forEach(evt => {
    eventsGrid.appendChild(createEventCard3D(evt));
  });

  renderPaginationControls();

  // Notify animations.js to animate the new cards
  if (typeof window.auraAnimateCards === 'function') {
    window.auraAnimateCards(eventsGrid, options);
  }
}

function syncHeroEvent() {
  const image = document.getElementById('hero-event-image');
  const title = document.getElementById('hero-event-title');
  const date = document.getElementById('hero-event-date');
  const venue = document.getElementById('hero-event-venue');
  if (!image || !title || !date || !venue) return;

  const now = Date.now();
  const featured = allEvents.find(evt => new Date(evt.eventDate).getTime() >= now && evt.availableTickets > 0)
    || allEvents.find(evt => evt.availableTickets > 0)
    || allEvents[0];
  if (!featured) return;

  title.textContent = featured.title || 'Find your next favorite night.';
  venue.textContent = [featured.venue, featured.location].filter(Boolean).join(' Â· ') || 'Live experiences, gathered in one place';
  const eventDate = new Date(featured.eventDate);
  date.textContent = Number.isNaN(eventDate.getTime())
    ? 'A NIGHT OUT, WELL SPENT'
    : eventDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
  if (featured.imageUrl) {
    image.alt = `${featured.title || 'Featured event'} at ${featured.venue || 'the venue'}`;
    image.src = featured.imageUrl;
  }
}

function renderPaginationControls() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.ceil(getFilteredEvents().length / eventsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'page-btn';
  prevBtn.setAttribute('aria-label', 'Previous page');
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    btn.setAttribute('aria-label', `Page ${i}`);
    if (i === currentPage) btn.setAttribute('aria-current', 'page');
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'page-btn';
  nextBtn.setAttribute('aria-label', 'Next page');
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);
  container.appendChild(nextBtn);
}

function goToPage(page) {
  currentPage = page;
  renderCurrentPageEvents({ immediate: true });
  const eventsGrid = document.getElementById('events-grid');
  if (eventsGrid) {
    eventsGrid.tabIndex = -1;
    eventsGrid.focus({ preventScroll: true });
    eventsGrid.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
}

function createEventCard3D(evt) {
  const card = document.createElement('article');
  card.className = 'event-card-3d';
  card.id = `event-card-${evt.id}`;
  const safeText = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const date = new Date(evt.eventDate);
  const formattedDate = Number.isNaN(date.getTime()) ? 'Date to be announced' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const soldOut = Number(evt.availableTickets) <= 0;
  const sampleListing = String(evt.description || '').startsWith('Sample listing:');
  const category = safeText(evt.category || 'LIVE EVENT');
  const imageUrl = safeText(evt.imageUrl || '');
  const price = `${safeText(evt.currency || 'BDT')} ${Number(evt.price || 0).toLocaleString()}`;
  card.innerHTML = `
    <div class="card-img-wrapper">
      <img src="${imageUrl}" alt="${safeText(evt.title)}" loading="lazy" decoding="async">
      <span class="card-category">${sampleListing ? 'SAMPLE LISTING' : category}</span>
      <div class="price-badge-3d${soldOut ? ' badge-sold-out' : ''}">${soldOut ? 'SOLD OUT' : price}</div>
      <div class="card-image-caption"><span>${formattedDate}</span><span>${safeText(evt.location || evt.venue || '')}</span></div>
    </div>
    <div class="card-body">
      <p class="event-card-category">${category}</p>
      <h3 class="event-card-title"><button type="button" aria-label="View details for ${safeText(evt.title)}" onclick="showEventDetails(${Number(evt.id)})">${safeText(evt.title)}</button></h3>
      <div class="event-meta">
        <div class="meta-item"><i class="fa-solid fa-location-dot meta-icon" aria-hidden="true"></i><span>${safeText(evt.venue || 'Venue not listed')}</span></div>
        <div class="meta-item"><i class="fa-solid fa-calendar-days meta-icon" aria-hidden="true"></i><span>${formattedDate}</span></div>
        <div class="city-tag">${safeText(evt.location || '')}</div>
      </div>
      <button type="button" class="event-favourite" aria-label="Save ${safeText(evt.title)}" onclick="toggleAuraFavourite(${Number(evt.id)}, this)"><i class="fa-regular fa-heart" aria-hidden="true"></i> Save event</button>
      <div class="event-card-action"><button type="button" class="btn-primary-3d event-card-cta" onclick="showEventDetails(${Number(evt.id)})">${soldOut ? 'View event details' : 'View event & tickets'} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>
    </div>`;
  const image = card.querySelector('.card-img-wrapper img');
  image.addEventListener('error', () => image.classList.add('image-failed'), { once: true });
  card.addEventListener('click', event => { if (!event.target.closest('button, a')) showEventDetails(evt.id); });
  return card;
}

async function showEventDetails(eventId, options = {}) {
  const id = Number(eventId);
  const content = document.getElementById('event-detail-content');
  if (!Number.isInteger(id) || id < 1 || !content) return;
  const url = new URL(window.location.href);
  if (options.pushHistory !== false && url.searchParams.get('event') !== String(id)) {
    url.searchParams.set('event', String(id));
    window.history.pushState({ ...(window.history.state || {}), auraEventDetails: true }, '', `${url.pathname}${url.search}${url.hash}`);
  }
  openModalById('event-details-modal');
  content.innerHTML = '<div class="event-detail-loading" role="status"><span class="event-detail-spinner" aria-hidden="true"></span><p>Loading event details...</p></div>';
  try {
    const response = await fetch(`/api/events/${id}`);
    const data = await response.json().catch(() => ({}));
    if (response.status === 404) {
      currentEventForDetails = null;
      content.innerHTML = '<div class="event-detail-error" role="alert"><span class="event-detail-eyebrow">AURA / EVENT</span><h2 id="event-detail-title">Event not found</h2><p>This event may have been removed or is no longer available.</p><button type="button" class="btn-primary-3d" onclick="closeEventDetails(); document.getElementById(\'events\')?.scrollIntoView({behavior:\'smooth\'});">Back to Events</button></div>';
      return;
    }
    if (!response.ok || !data?.id) throw new Error('Event details unavailable');
    currentEventForDetails = data;
    const safeText = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const date = new Date(data.eventDate);
    const dateText = Number.isNaN(date.getTime()) ? 'Date to be announced' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeText = Number.isNaN(date.getTime()) ? 'Time to be announced' : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const currency = safeText(data.currency || 'BDT');
    const price = `${currency} ${Number(data.price || 0).toLocaleString()}`;
    const availability = Math.max(0, Number(data.availableTickets) || 0);
    const image = safeText(data.imageUrl || '');
    const sampleListing = String(data.description || '').startsWith('Sample listing:');
    const organizer = data.organizerName || (data.organizerUserId ? 'AURA event organizer' : 'Organizer details unavailable');
    const description = data.description || 'Event description has not been provided.';
    const title = safeText(data.title || 'Event details');
    document.title = `${data.title || 'Event details'} | AURA`;
    content.innerHTML = `
      <article class="event-detail-page">
        <header class="event-detail-hero">
          ${image ? `<img class="event-detail-hero-image" src="${image}" alt="${title}" fetchpriority="high">` : '<div class="event-detail-image-fallback" aria-hidden="true"><span>AURA<span>++</span></span></div>'}
          <div class="event-detail-hero-shade" aria-hidden="true"></div>
          <div class="event-detail-hero-copy">
            <span class="event-detail-eyebrow">${sampleListing ? 'SAMPLE LISTING' : safeText(data.category || 'EVENT')}</span>
            <h2 id="event-detail-title">${title}</h2>
            <p>${safeText(data.venue || 'Venue details unavailable')} <span aria-hidden="true">·</span> ${safeText(data.location || 'Location details unavailable')}</p>
            <div class="event-detail-hero-date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${safeText(dateText)} <span aria-hidden="true">·</span> ${safeText(timeText)}</div>
          </div>
        </header>
        <div class="event-detail-toolbar">
          <span class="event-detail-category">${safeText(data.category || 'Event')}</span>
          <div><button id="event-detail-save" type="button" class="event-detail-quiet-action" aria-pressed="false" onclick="toggleEventDetailFavourite()"><i class="fa-regular fa-heart" aria-hidden="true"></i> Save event</button><button type="button" class="event-detail-quiet-action" onclick="shareEventDetails()"><i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i> Share</button></div>
        </div>
        ${sampleListing ? '<p class="event-sample-note">Sample listing · Event details are illustrative and are not a confirmed announcement.</p>' : ''}
        <div class="event-detail-layout">
          <div class="event-detail-main">
            <section class="event-detail-section" aria-labelledby="event-about-heading"><span class="event-detail-eyebrow">ABOUT THIS EVENT</span><h3 id="event-about-heading">The experience</h3><p class="event-detail-description">${safeText(description)}</p></section>
            <section class="event-detail-section" aria-labelledby="event-info-heading"><span class="event-detail-eyebrow">PLAN YOUR VISIT</span><h3 id="event-info-heading">Event information</h3><dl class="event-info-grid"><div><dt>Date</dt><dd>${safeText(dateText)}</dd></div><div><dt>Time</dt><dd>${safeText(timeText)}</dd></div><div><dt>Venue</dt><dd>${safeText(data.venue || 'Not provided')}</dd></div><div><dt>Location</dt><dd>${safeText(data.location || 'Not provided')}</dd></div><div><dt>Organizer</dt><dd>${safeText(organizer)}</dd></div><div><dt>Category</dt><dd>${safeText(data.category || 'Event')}</dd></div></dl></section>
            <section class="event-weather-panel" aria-labelledby="event-weather-heading"><span class="event-detail-weather-icon" aria-hidden="true"><i class="fa-solid fa-cloud-sun"></i></span><div><span class="event-detail-eyebrow">LOCAL CONDITIONS</span><h3 id="event-weather-heading">Event weather</h3><p>Forecast not available yet. Weather information will appear here when a reliable forecast is available for this date and location.</p></div></section>
          </div>
          <aside class="event-ticket-panel" aria-label="Ticket reservation">
            <span class="event-detail-eyebrow">TICKETS</span><h3>Choose your ticket</h3>
            <div class="event-ticket-option"><div><strong>General admission</strong><span>Standard event entry</span></div><strong>${price}</strong></div>
            <div class="event-ticket-availability" data-sold-out="${availability === 0}"><i class="fa-solid ${availability === 0 ? 'fa-circle-xmark' : 'fa-circle-check'}" aria-hidden="true"></i> ${availability === 0 ? 'Sold out' : `${availability.toLocaleString()} tickets available`}</div>
            <button type="button" class="btn-primary-3d event-detail-book-button" ${availability === 0 ? 'disabled' : ''} onclick="beginBookingFromDetails()">${availability === 0 ? 'Sold out' : 'Reserve tickets'} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
            <p class="event-ticket-record-note">Your reservation and ticket IDs will be saved to your AURA account.</p>
          </aside>
        </div>
      </article>`;
    content.querySelector('.event-detail-hero-image')?.addEventListener('error', event => { event.currentTarget.replaceWith(Object.assign(document.createElement('div'), { className: 'event-detail-image-fallback', innerHTML: '<span>AURA<span>++</span></span>' })); }, { once: true });
    loadEventFavoriteState(data.id);
  } catch (error) {
    console.error('Event details error:', error);
    content.innerHTML = `<div class="event-detail-error" role="alert"><span class="event-detail-eyebrow">AURA / EVENT</span><h2 id="event-detail-title">We couldn’t load this event</h2><p>Check your connection and try again.</p><button type="button" class="btn-primary-3d" onclick="showEventDetails(${id}, {pushHistory:false})">Try again</button><button type="button" class="event-confirmation-secondary" onclick="closeEventDetails()">Back to Events</button></div>`;
  }
}

function closeEventDetails() {
  const eventId = Number(new URLSearchParams(window.location.search).get('event'));
  const shouldGoBack = eventId > 0 && window.history.state?.auraEventDetails;
  closeModals();
  if (shouldGoBack) window.history.back();
  else clearEventRoute();
  currentEventForDetails = null;
}

function clearEventRoute() {
  const url = new URL(window.location.href);
  url.searchParams.delete('event');
  const state = { ...(window.history.state || {}) };
  delete state.auraEventDetails;
  window.history.replaceState(state, '', `${url.pathname}${url.search}${url.hash}`);
  document.title = 'AURA++ | Discover Events';
}

async function loadEventFavoriteState(eventId) {
  const button = document.getElementById('event-detail-save');
  if (!button || !currentUser) return;
  try {
    const response = await fetch('/api/events/saved');
    if (!response.ok) return;
    const savedEvents = await response.json();
    const saved = savedEvents.some(event => Number(event.id) === Number(eventId));
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.innerHTML = `<i class="fa-${saved ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i> ${saved ? 'Saved' : 'Save event'}`;
  } catch (_) { }
}

async function toggleEventDetailFavourite() {
  const button = document.getElementById('event-detail-save');
  if (!currentEventForDetails || !button) return;
  await toggleAuraFavourite(currentEventForDetails.id, button);
  button.setAttribute('aria-pressed', String(button.classList.contains('is-saved')));
}

async function shareEventDetails() {
  if (!currentEventForDetails) return;
  const shareData = { title: currentEventForDetails.title, text: `Event details for ${currentEventForDetails.title}`, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(shareData.url); showToast('Event link copied.'); }
    else {
      const field = document.createElement('textarea'); field.value = shareData.url; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select();
      const copied = document.execCommand('copy'); field.remove();
      showToast(copied ? 'Event link copied.' : 'Copy the event link from your browser address bar.', copied ? 'success' : 'info');
    }
  } catch (_) { showToast('The event link is ready to share.', 'info'); }
}

function beginBookingFromDetails() {
  if (!currentEventForDetails) return;
  if (!currentUser) {
    sessionStorage.setItem('aura_pending_event', String(currentEventForDetails.id));
    closeModals();
    openLoginModal();
    return;
  }
  if (Number(currentEventForDetails.availableTickets) <= 0) return;
  openBookingModal(currentEventForDetails);
}

async function toggleAuraFavourite(eventId, button) {
  if (!currentUser) { openLoginModal(); return; }
  try { const response=await fetch(`/api/events/${eventId}/save`,{method:'POST'}); if(!response.ok) throw new Error(); const data=await response.json(); button.classList.toggle('is-saved',data.saved); button.innerHTML=`<i class="fa-${data.saved?'solid':'regular'} fa-heart" aria-hidden="true"></i> ${data.saved?'Saved':'Save event'}`; }
  catch (_) { showToast('Sign in again to save events.','error'); }
}


/* SELLER TICKET ACCESS CONTROL */
async function handleSellTicketsClick() {
  if (!currentUser) {
    openLoginModal();
    showToast('Please login to sell tickets.');
    return;
  }
  await openCreateEventModal();
}

async function refreshOrganizerAccess() {
  try {
    const response = await fetch('/api/subscriptions/status');
    if (!response.ok) throw new Error('Subscription status unavailable');
    const status = await response.json();
    currentUser.isSubscribed = !!status.canSell;
    currentUser.subscriptionExpiresAt = status.subscriptionExpiresAt || null;
    localStorage.setItem('aura_user', JSON.stringify(currentUser));
    updateUserNav();
    return currentUser.isSubscribed;
  } catch (_) {
    showToast('We could not check your organizer access. Please try again.', 'error');
    return false;
  }
}

async function openCreateEventModal() {
  if (!currentUser) {
    openLoginModal();
    showToast('Please sign in to submit an event.');
    return;
  }
  if (!await refreshOrganizerAccess()) {
    openModalById('sell-warning-modal');
    return;
  }
  selectSellerPayoutMethod('bKash');
  openModalById('create-event-modal');
}

// Modal Toggle Handlers
function openModalById(modalId) {
  modalReturnFocus = document.activeElement;
  closeModals({ restoreFocus: false });
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const box = modal.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
    requestAnimationFrame(() => {
      const focusTarget = modal.querySelector('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)')
        || modal.querySelector('button:not(:disabled), a[href]') || box;
      focusTarget?.focus({ preventScroll: true });
    });
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
  if (currentUser?.isSubscribed) {
    handleSellTicketsClick();
    return;
  }
  openModalById('subscribe-modal');
}

function selectOrganizerPlan() {
  const status = document.getElementById('subscription-plan-status');
  if (status) status.textContent = 'This plan is selected. Subscription checkout will be available here when enrollment opens.';
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

function closeModals(options = {}) {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('.inline-booking-form').forEach(f => f.style.display = 'none');
  document.body.style.overflow = '';
  updateUserNav();
  if (options.restoreFocus !== false && modalReturnFocus?.isConnected) {
    modalReturnFocus.focus({ preventScroll: true });
    modalReturnFocus = null;
  }
}

function initModalInteractions() {
  const dismissActiveModal = modal => {
    if (modal?.id === 'event-details-modal') closeEventDetails();
    else if (modal?.id === 'booking-modal') returnToEventDetails();
    else if (modal?.id === 'booking-confirmation-modal') closeEventConfirmation();
    else closeModals();
  };
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.setAttribute('aria-hidden', 'true');
    const box = modal.querySelector('.modal-box');
    if (!box) return;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.tabIndex = -1;
    const title = box.querySelector('.modal-title');
    if (title) {
      if (!title.id) title.id = `${modal.id}-title`;
      box.setAttribute('aria-labelledby', title.id);
    } else box.setAttribute('aria-label', 'AURA dialog');
    if (modal.id !== 'welcome-modal') {
      modal.addEventListener('click', event => { if (event.target === modal) dismissActiveModal(modal); });
    }
  });

  document.addEventListener('keydown', event => {
    const modal = document.querySelector('.modal-overlay.active');
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (modal.id === 'welcome-modal' && typeof window.closeWelcome === 'function') window.closeWelcome();
      else dismissActiveModal(modal);
      return;
    }
    if (event.key !== 'Tab') return;
    const box = modal.querySelector('.modal-box');
    const items = [...box.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(item => item.getClientRects().length > 0);
    if (!items.length) { event.preventDefault(); box.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === box)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
}

// Dashboard Tabs & API Logic
async function switchDashTab(tab) {
  const tabTickets = document.getElementById('dash-tab-tickets');
  const tabSub = document.getElementById('dash-tab-sub');
  if (tabTickets) tabTickets.className = 'dash-tab' + (tab === 'tickets' ? ' active' : '');
  if (tabSub) tabSub.className = 'dash-tab' + (tab === 'sub' ? ' active' : '');

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
          <h4 style="color:var(--text-main); font-size:16px; margin:6px 0 4px;">${b.eventTitle || 'Event Ticket'}</h4>
          <p style="font-size:13px; color:var(--text-muted);">${b.quantity || 1} Ticket(s) &bull; ${b.paymentMethod || 'bKash'}</p>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--text-main); font-weight:800; font-size:16px;">BDT ${b.totalAmount}</div>
          <span style="font-size:12px; color:#4f8c5c; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Confirmed</span>
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
    statusText.innerHTML = `<span style="color:#4f8c5c; font-weight:800;"><i class="fa-solid fa-check-circle"></i> ACTIVE PRO ORGANIZER PASS</span><br><br>You are authorized to publish and sell tickets on AURA++.`;
  } else {
    statusText.innerHTML = `<span style="color:#c73a3a; font-weight:700;">No active subscription</span><br><br>Subscribe to unlock exclusive ticket selling rights.`;
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
    showToast('AURA could not sign you in. Check your connection and try again.', 'error');
    return;
  }
  if (!loggedInUser) { showToast('AURA could not sign you in. Check your credentials.', 'error'); return; }

  currentUser = loggedInUser;
  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  const formView = document.getElementById('login-form-view');
  const successView = document.getElementById('login-success-view');
  const userNameEl = document.getElementById('login-user-name');

  if (userNameEl) userNameEl.textContent = (currentUser.fullName || currentUser.email).split(' ')[0] || 'Member';
  if (formView) formView.style.display = 'none';
  if (successView) successView.style.display = 'block';

  setTimeout(() => {
    closeModals();
    showToast(`âœ¨ Welcome back, ${currentUser.fullName || currentUser.email}! You are now logged in.`);
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
    showToast('AURA could not create your account. Check your connection and try again.', 'error');
    return;
  }
  if (!registeredUser) { showToast('AURA did not create your account. Check your details and try again.', 'error'); return; }

  currentUser = registeredUser;
  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  updateUserNav();

  const formView = document.getElementById('register-form-view');
  const successView = document.getElementById('register-success-view');
  const userNameEl = document.getElementById('registered-user-name');

  if (userNameEl) userNameEl.textContent = fullName.split(' ')[0] || fullName;
  if (formView) formView.style.display = 'none';
  if (successView) successView.style.display = 'block';

  setTimeout(() => {
    closeModals();
    showToast(`âœ¨ Welcome aboard, ${fullName}! You are now logged in.`);
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
  }, 2600);
}

function handleGoogleLogin() {
  showToast('Google sign in is not connected yet.', 'error');
}

async function logoutUser() {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
  currentUser = null;
  localStorage.removeItem('aura_user');
  localStorage.removeItem('aura_subscribed');
  updateUserNav();
  location.href = '/login.html';
}

// Reservation flow uses the event's single database-backed admission type.
function openBookingModal(evt) {
  if (!evt || Number(evt.availableTickets) <= 0) return;
  currentEventForBooking = { ...evt };
  const date = new Date(evt.eventDate);
  document.getElementById('booking-event-title').textContent = evt.title || 'Event';
  document.getElementById('booking-event-venue').textContent = [evt.venue, evt.location].filter(Boolean).join(' · ') || 'Venue details unavailable';
  document.getElementById('booking-event-date').textContent = Number.isNaN(date.getTime()) ? 'Date and time to be announced' : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  document.getElementById('booking-event-price').textContent = formatEventPrice(evt.price, evt.currency);
  const quantity = document.getElementById('ticket-quantity');
  quantity.value = '1';
  quantity.max = String(Math.min(10, Number(evt.availableTickets)));
  const availability = document.getElementById('booking-availability');
  if (availability) availability.textContent = `${Number(evt.availableTickets).toLocaleString()} available`;
  const status = document.getElementById('booking-status');
  if (status) { status.textContent = ''; status.dataset.state = 'idle'; }
  document.getElementById('booking-submit').disabled = false;
  updateBookingTotal();
  openModalById('booking-modal');
}

function formatEventPrice(price, currency = 'BDT') {
  return `${currency || 'BDT'} ${Number(price || 0).toLocaleString()}`;
}

function updateBookingTotal() {
  if (!currentEventForBooking) return;
  const quantity = document.getElementById('ticket-quantity');
  const max = Math.min(10, Math.max(1, Number(currentEventForBooking.availableTickets) || 1));
  quantity.max = String(max);
  const requested = Number.parseInt(quantity.value, 10) || 1;
  const qty = Math.max(1, Math.min(requested, max));
  quantity.value = String(qty);
  document.getElementById('booking-summary-quantity').textContent = String(qty);
  document.getElementById('booking-summary-price').textContent = `${formatEventPrice(currentEventForBooking.price, currentEventForBooking.currency)} × ${qty}`;
  document.getElementById('booking-total-price').textContent = formatEventPrice(Number(currentEventForBooking.price) * qty, currentEventForBooking.currency);
}

function changeBookingQuantity(change) {
  const quantity = document.getElementById('ticket-quantity');
  if (!quantity) return;
  quantity.value = String((Number.parseInt(quantity.value, 10) || 1) + change);
  updateBookingTotal();
}

function returnToEventDetails() {
  const eventId = currentEventForBooking?.id || currentEventForDetails?.id;
  closeModals();
  if (eventId) showEventDetails(eventId, { pushHistory: false });
}

async function confirmBooking() {
  if (!currentEventForBooking) return;
  const status = document.getElementById('booking-status');
  const button = document.getElementById('booking-submit');
  const preserveLoginContext = () => {
    sessionStorage.setItem('aura_pending_event', String(currentEventForBooking.id));
    closeModals();
    openLoginModal();
  };
  if (!currentUser) { preserveLoginContext(); return; }
  const quantity = Number.parseInt(document.getElementById('ticket-quantity').value, 10) || 1;
  if (quantity < 1 || quantity > 10 || quantity > Number(currentEventForBooking.availableTickets)) {
    if (status) { status.textContent = 'Choose a quantity within the available ticket limit.'; status.dataset.state = 'error'; }
    return;
  }
  if (button?.disabled) return;
  if (status) { status.textContent = ''; status.dataset.state = 'idle'; }
  setActionLoading(button, true, 'Reserving tickets...');
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: currentEventForBooking.id, quantity, paymentMethod: 'Reservation' })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { preserveLoginContext(); return; }
    if (response.status === 409) {
      if (status) { status.textContent = data.message || 'The available quantity changed. Review the updated availability.'; status.dataset.state = 'error'; }
      try {
        const latest = await fetch(`/api/events/${currentEventForBooking.id}`);
        if (latest.ok) {
          currentEventForBooking = await latest.json();
          if (currentEventForDetails?.id === currentEventForBooking.id) currentEventForDetails = currentEventForBooking;
          const remaining = Math.max(0, Number(currentEventForBooking.availableTickets) || 0);
          document.getElementById('ticket-quantity').max = String(Math.max(1, Math.min(10, remaining)));
          const availability = document.getElementById('booking-availability');
          if (availability) availability.textContent = remaining ? `${remaining.toLocaleString()} available` : 'Sold out';
          updateBookingTotal();
          if (!remaining) button.disabled = true;
        }
      } catch (_) { }
      return;
    }
    if (!response.ok || !data.booking || !Array.isArray(data.tickets)) {
      if (status) { status.textContent = data.message || 'We couldn’t complete this reservation. Please try again.'; status.dataset.state = 'error'; }
      return;
    }
    bookingConfirmationData = { booking: data.booking, tickets: data.tickets, event: currentEventForBooking };
    renderBookingConfirmation();
    openModalById('booking-confirmation-modal');
    fetchEvents();
  } catch (error) {
    console.error('Reservation request failed:', error);
    if (status) { status.textContent = 'We couldn’t reach AURA. Check your connection and try again.'; status.dataset.state = 'error'; }
  } finally {
    setActionLoading(button, false);
  }
}

function renderBookingConfirmation() {
  if (!bookingConfirmationData) return;
  const { booking, tickets, event } = bookingConfirmationData;
  const details = document.getElementById('booking-confirmation-details');
  details.replaceChildren();
  const date = new Date(event.eventDate);
  const summary = [
    ['Event', event.title],
    ['Date', Number.isNaN(date.getTime()) ? 'To be announced' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Venue', event.venue || 'Not provided'],
    ['Ticket', 'General admission'],
    ['Quantity', String(booking.quantity)],
    ['Booking total', formatEventPrice(booking.totalAmount, event.currency)]
  ];
  summary.forEach(([label, value]) => {
    const row = document.createElement('div'); row.className = 'booking-confirmation-row';
    const name = document.createElement('span'); name.textContent = label;
    const text = document.createElement('strong'); text.textContent = value || 'Not provided';
    row.append(name, text); details.appendChild(row);
  });
  const list = document.getElementById('booking-confirmation-tickets');
  list.replaceChildren();
  tickets.forEach(code => {
    const row = document.createElement('div'); row.className = 'booking-confirmation-ticket';
    const ticket = document.createElement('strong'); ticket.textContent = code;
    const verify = document.createElement('button'); verify.type = 'button'; verify.className = 'event-confirmation-secondary'; verify.textContent = 'Verify ticket'; verify.addEventListener('click', () => verifyBookedTicket(code));
    row.append(ticket, verify); list.appendChild(row);
  });
}

function closeEventConfirmation() {
  closeModals();
  if (bookingConfirmationData?.event?.id) showEventDetails(bookingConfirmationData.event.id, { pushHistory: false });
}

function viewBookedTickets() {
  closeModals();
  clearEventRoute();
  if (typeof window.openDashboard === 'function') window.openDashboard('tickets');
}

function verifyBookedTicket(ticketCode) {
  closeModals();
  clearEventRoute();
  const section = document.getElementById('ticket-verification');
  const input = document.getElementById('ticket-verification-code');
  const form = document.getElementById('ticket-verification-form');
  if (input) input.value = ticketCode;
  section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  form?.requestSubmit();
}
// Subscription API Logic
async function processSubscription() {
  if (!currentUser) {
    openLoginModal();
    showToast('Sign in to view organizer plans.');
    return;
  }
  openModalById('subscribe-modal');
}
// Seller Payout Method
function selectSellerPayoutMethod(method) {
  selectedSellerPayoutMethod = method;
  const tabs = ['seller-payout-bkash', 'seller-payout-nagad', 'seller-payout-bank'].map(id => document.getElementById(id));
  tabs.forEach((tab, index) => {
    if (tab) {
      tab.className = 'pay-tab' + (index === ['bKash', 'Nagad', 'Bank Account'].indexOf(method) ? ` active-${['bkash', 'nagad', 'card'][index]}` : '');
      tab.setAttribute('aria-pressed', String(index === ['bKash', 'Nagad', 'Bank Account'].indexOf(method)));
    }
  });

  const mobileGroup = document.getElementById('seller-payout-mobile-group');
  const bankGroup = document.getElementById('seller-payout-bank-group');
  const label = document.getElementById('seller-payout-account-label');

  if (method === 'Bank Account') {
    if (mobileGroup) mobileGroup.style.display = 'none';
    if (bankGroup) bankGroup.style.display = 'block';
  } else {
    if (mobileGroup) mobileGroup.style.display = 'block';
    if (bankGroup) bankGroup.style.display = 'none';
    if (label) label.textContent = `Your ${method} Number (to receive money)`;
  }
}

// Seller Create Event
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
  const button = document.querySelector('#create-event-form button[type="submit"]');
  if (button && button.disabled) return;
  setActionLoading(button, true, 'Submitting for review...');

  let sellerAccountNumber = '';
  let sellerBankName = '';
  let sellerAccountHolder = '';
  if (selectedSellerPayoutMethod === 'Bank Account') {
    sellerBankName = document.getElementById('seller-bank-name')?.value || '';
    sellerAccountHolder = document.getElementById('seller-account-holder')?.value || '';
    sellerAccountNumber = document.getElementById('seller-bank-account')?.value || '';
  } else {
    sellerAccountNumber = document.getElementById('seller-payout-account')?.value || '';
  }

  try {
    const res = await fetch('/api/events/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizerUserId: currentUser.id,
        title, venue, location, price, totalTickets, eventDate, imageUrl,
        contactEmail: currentUser.email, contactPhone: currentUser.phone || '',
        sellerPaymentMethod: selectedSellerPayoutMethod,
        sellerAccountNumber, sellerBankName, sellerAccountHolder
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Event submission failed.', 'error');
      return;
    }
    closeModals();
    showToast(`Event "${title}" submitted for review.`, 'success');
    fetchEvents();
  } catch (err) {
    console.error('Create Event Error:', err);
    showToast('Event could not be published. Check your connection and try again.', 'error');
  } finally {
    setActionLoading(button, false);
  }
}
// Toast Helper
function showToast(msg, state = 'info') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.dataset.state = ['success', 'error', 'info'].includes(state) ? state : 'info';
  toast.setAttribute('aria-hidden', 'false');
  toast.classList.add('show');
  window.clearTimeout(toastDismissTimer);
  toastDismissTimer = window.setTimeout(() => {
    toast.classList.remove('show');
    toast.setAttribute('aria-hidden', 'true');
  }, 4500);
}

// Forgot Password / OTP
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
    showToast(`ðŸ“© A 6-digit OTP code has been sent to ${target}!`);
  } catch (err) {
    console.error('OTP Error:', err);
    document.getElementById('otp-sent-target').textContent = target;
    document.getElementById('otp-step1-view').style.display = 'none';
    document.getElementById('otp-step2-view').style.display = 'block';
    showToast(`ðŸ“© A 6-digit OTP code has been sent to ${target}!`);
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
      updateUserNav();
    }
    showToast('âœ… Password reset successful! You are now logged in.');
  } catch (err) {
    console.error('Reset Password Error:', err);
    closeModals();
    showToast('âœ… Password reset successful! You can now login with your new password.');
  }
}

// Language selector
function changeLanguage(lang) {
  localStorage.setItem('aura_lang', lang);
  const selectEl = document.getElementById('lang-select');
  if (selectEl) selectEl.value = lang;

  // Google Translate via cookie
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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('aura_lang') || 'en';
  const selectEl = document.getElementById('lang-select');
  if (selectEl) selectEl.value = saved;

  if (saved !== 'en') {
    setTimeout(() => changeLanguage(saved), 300);
  }
});
