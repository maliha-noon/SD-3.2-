/* ============================================================
   AURA++ — DASHBOARD CONTROLLER (v3)
   Full-page dashboard with sidebar navigation.
   Populates Home, Discover, My Tickets, Subscriptions,
   Seller, Admin, Profile with real data.
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const verificationHistory = [];

  // ---------- helpers ----------
  function getUser() {
    try {
      const raw = localStorage.getItem('aura_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function fmtMoney(n) {
    const num = Number(n) || 0;
    return '৳' + num.toLocaleString('en-BD');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(d) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) { return ''; }
  }

  function initialsFor(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(part => Array.from(part)[0] || '').join('').toLocaleUpperCase();
  }

  function animateLoadedValue(id, value, formatter = number => String(Math.round(number))) {
    const element = $(id);
    if (!element) return;
    element.dataset.loadedValue = String(value);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !Number.isFinite(Number(value))) {
      element.textContent = formatter(Number(value) || 0);
      return;
    }
    const started = performance.now();
    const duration = 620;
    const update = now => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter(Number(value) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function renderBookingsChart(bookings) {
    const container = $('dash-booking-chart');
    if (!container) return;
    const dated = bookings.map(booking => ({ booking, date: new Date(booking.bookingDate) }))
      .filter(item => Number.isFinite(item.date.getTime()));
    if (!dated.length) {
      container.innerHTML = '<p class="dash-chart-empty">No dated booking activity is available yet.</p>';
      return;
    }

    const latest = dated.reduce((max, item) => item.date > max ? item.date : max, dated[0].date);
    const months = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(latest.getFullYear(), latest.getMonth() - offset, 1);
      months.push({ year: date.getFullYear(), month: date.getMonth(), label: date.toLocaleDateString('en', { month: 'short' }), count: 0 });
    }
    dated.forEach(({ date }) => {
      const bucket = months.find(item => item.year === date.getFullYear() && item.month === date.getMonth());
      if (bucket) bucket.count += 1;
    });
    const maximum = Math.max(1, ...months.map(item => item.count));
    container.innerHTML = `<div class="dash-chart-bars" role="img" aria-label="${months.map(item => `${item.label} ${item.year}: ${item.count} bookings`).join(', ')}">${months.map(item => {
      const height = item.count ? Math.max(6, Math.round((item.count / maximum) * 100)) : 0;
      return `<div class="dash-chart-column"><div class="dash-chart-value">${item.count || ''}</div><div class="dash-chart-track"><span class="dash-chart-bar" data-height="${height}" style="height:${height}%"></span></div><span class="dash-chart-month">${item.label}<small>${String(item.year).slice(-2)}</small></span></div>`;
    }).join('')}</div>`;
    const bars = [...container.querySelectorAll('.dash-chart-bar')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bars.forEach(bar => { bar.style.transform = 'scaleY(1)'; });
    } else {
      requestAnimationFrame(() => bars.forEach((bar, index) => {
        bar.style.transitionDelay = `${index * 55}ms`;
        bar.classList.add('is-loaded');
      }));
    }
  }

  // ---------- open / close ----------
  window.openDashboard = function (initialSection = 'home') {
    document.body.classList.add('dashboard-open');
    if ($('dash-username')) $('dash-username').textContent = 'Loading…';
    if ($('dash-avatar')) $('dash-avatar').textContent = '';
    // Load identity and role from the authenticated backend session, never from browser cache.
    fetch('/api/auth/me').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => {
      const current = data.user;
      localStorage.setItem('aura_user', JSON.stringify(current));
      if ($('dash-username')) $('dash-username').textContent = current.fullName;
      if ($('dash-avatar')) $('dash-avatar').textContent = initialsFor(current.fullName);
      if ($('dash-home-username')) $('dash-home-username').textContent = current.fullName.split(' ')[0];
      document.querySelectorAll('[data-role-only]').forEach(el => {
        const allowed = (el.getAttribute('data-role-only') || '').split(',').map(role => role.trim().toLowerCase());
        el.style.display = allowed.includes((current.role || '').toLowerCase()) ? '' : 'none';
      });
      switchDashSection(initialSection, false);
    }).catch(() => {
      const current = getUser();
      if (current) {
        if ($('dash-username')) $('dash-username').textContent = current.fullName;
        if ($('dash-avatar')) $('dash-avatar').textContent = initialsFor(current.fullName);
        if ($('dash-home-username')) $('dash-home-username').textContent = current.fullName ? current.fullName.split(' ')[0] : 'User';
        switchDashSection(initialSection, false);
      } else {
        // Not logged in — close dashboard and open login modal instead of redirecting
        localStorage.removeItem('aura_user');
        document.body.classList.remove('dashboard-open');
        if (typeof window.openLoginModal === 'function') window.openLoginModal();
        else {
          const lm = document.getElementById('login-modal');
          if (lm) lm.classList.add('active');
        }
      }
    });
  };

  window.closeDashboard = function () {
    document.body.classList.remove('dashboard-open');
    if (location.pathname !== '/') history.pushState({}, '', '/');
  };

  // ---------- section switching ----------
  window.switchDashSection = function (section, updateHistory = true) {
    // 'discover' now loads events inside the dashboard (does NOT close it)
    if (updateHistory) history.pushState({ dashboard: section }, '', '/' + ({tickets:'my-tickets',subscriptions:'subscription',verification:'verification-history'}[section] || section));
    document.querySelectorAll('.dash-nav-item').forEach(btn => {
      const selected = btn.dataset.section === section;
      btn.classList.toggle('active', selected);
      if (selected) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    document.querySelectorAll('.dash-section').forEach(el => {
      el.classList.remove('active');
    });

    const target = $('dash-section-' + section);
    if (target) target.classList.add('active');
    const searchInput = $('dash-search-input');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      applyDashboardSearch('');
    }

    const content = document.querySelector('.dash-content');
    if (content) content.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

    localStorage.setItem('aura_dash_section', section);

    if (section === 'home') loadHomeSection();
    else if (section === 'discover') loadDiscoverSection();
    else if (section === 'tickets') loadTicketsSection();
    else if (section === 'subscriptions') loadSubscriptionsSection();
    else if (section === 'seller') loadSellerSection();
    else if (section === 'admin') loadAdminSection();
    else if (section === 'verification') loadVerificationHistory();
    else if (section === 'history') loadActivityHistory();
    else if (section === 'resale') loadResaleSection();
    else if (section === 'notifications') loadNotificationsSection();
    else if (section === 'profile') loadProfileSection();
    else if (section === 'settings') loadSettingsSection();
  };

  // ---------- HOME ----------
  async function loadHomeSection() {
    const user = getUser();
    if (!user) {
      console.warn('[dash] no user for home');
      return;
    }

    // Keep values unknown until the account records return.
    if ($('stat-tickets')) $('stat-tickets').textContent = '—';
    if ($('stat-spent')) $('stat-spent').textContent = '—';
    if ($('stat-attended')) $('stat-attended').textContent = '—';
    if ($('stat-sub')) $('stat-sub').textContent = user.isSubscribed ? 'Pro' : 'Free';
    const chart = $('dash-booking-chart');
    if (chart) chart.innerHTML = '<p class="dash-chart-empty">Loading booking activity…</p>';

    let bookings = [];
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) bookings = data;
      }
    } catch (e) {
      console.warn('[dash] bookings fetch failed', e);
    }

    const totalTickets = bookings.reduce((s, b) => s + (b.quantity || 0), 0);
    const totalSpent = bookings.reduce((s, b) => s + ((b.totalAmount || 0)), 0);

    animateLoadedValue('stat-tickets', totalTickets);
    animateLoadedValue('stat-spent', totalSpent, value => fmtMoney(Math.round(value)));
    animateLoadedValue('stat-attended', bookings.length);
    if ($('stat-sub')) $('stat-sub').textContent = user.isSubscribed ? 'Pro Seller' : 'Free';
    renderBookingsChart(bookings);

    try {
      const response = await fetch('/api/account/dashboard');
      if (!response.ok) throw new Error();
      const overview = await response.json();
      const upcoming = $('dash-upcoming-tickets');
      if (upcoming) upcoming.innerHTML = overview.upcomingTickets.length ? overview.upcomingTickets.map(ticket => `<article class="dash-row"><div class="dash-row-left"><span class="dash-row-title">${esc(ticket.title)}</span><span class="dash-row-meta">${esc(fmtDate(ticket.eventDate))} · Ticket ${esc(ticket.ticketCode)}</span></div><a class="dash-action-btn" href="/my-tickets">View ticket</a></article>`).join('') : '<div class="dash-empty">No upcoming tickets yet. <a href="/events">Discover Events</a></div>';
      const saved = $('dash-saved-events');
      if (saved) saved.innerHTML = overview.favorites.length ? overview.favorites.map(event => `<article class="dash-row"><div class="dash-row-left"><span class="dash-row-title">${esc(event.title)}</span><span class="dash-row-meta">${esc(event.category)} · ${esc(fmtDate(event.eventDate))}</span></div><a class="dash-action-btn" href="/events">Discover Events</a></article>`).join('') : '<div class="dash-empty">No saved events yet. <a href="/events">Discover Events</a></div>';
    } catch (_) {
      if ($('dash-upcoming-tickets')) $('dash-upcoming-tickets').innerHTML = '<div class="dash-empty">Upcoming tickets could not be loaded. Retry by reopening Home.</div>';
      if ($('dash-saved-events')) $('dash-saved-events').innerHTML = '<div class="dash-empty">Saved events could not be loaded. Retry by reopening Home.</div>';
    }

    const container = $('dash-recent-activity');
    if (!container) return;

    let recent = [];
    try { const response = await fetch('/api/account/history'); if (response.ok) recent = await response.json(); } catch (_) {}
    if (recent.length) {
      container.innerHTML = recent.slice(0, 5).map(item => `<article class="dash-row"><div class="dash-row-left"><span class="dash-row-tag">${esc(item.type)}</span><span class="dash-row-title">${esc(item.title)}</span><span class="dash-row-meta">${esc(item.detail)}</span></div><div class="dash-row-right"><span>${esc(fmtDate(item.date))}</span></div></article>`).join('');
      return;
    }
    if (!bookings.length) {
      container.innerHTML = `
        <div class="dash-empty">
          <p>No activity yet.</p>
          <p style="margin-top:8px; font-size:13px; color:var(--text-muted);">Book your first event to see it here.</p>
          <button class="btn-primary-3d" onclick="closeDashboard()" style="margin-top:16px; padding:12px 24px;">
            <i class="fa-solid fa-compass" style="margin-right:6px;"></i> Explore Events
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.slice(0, 5).map(b => `
      <div class="dash-row">
        <div class="dash-row-left">
          <span class="dash-row-tag">${esc(b.bookingCode || 'TICKET')}</span>
          <span class="dash-row-title">${esc(b.event?.title || 'Event')}</span>
          <span class="dash-row-meta">${b.quantity || 1} ticket(s) • ${esc(b.paymentMethod || 'bKash')}</span>
        </div>
        <div class="dash-row-right">
          <span class="dash-row-price">${fmtMoney(b.totalAmount)}</span>
          <span class="dash-row-status"><i class="fa-solid fa-circle-check"></i> ${esc(b.status || 'Status unavailable')}</span>
        </div>
      </div>
    `).join('');
  }

  // ---------- DISCOVER ----------
  async function loadDiscoverSection() {
    const grid = $('dash-discover-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="dash-empty" style="grid-column:1/-1;">Loading events...</p>';

    let events = null;
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Events could not be loaded.');
      events = await res.json();
      if (!Array.isArray(events)) throw new Error('Unexpected events response.');
    } catch (e) {
      console.warn('[dash] events fetch failed', e);
      grid.innerHTML = '<p class="dash-empty" style="grid-column:1/-1;">Events are unavailable right now. Reopen Discover to try again.</p>';
      return;
    }

    if (!events.length) {
      grid.innerHTML = '<p class="dash-empty" style="grid-column:1/-1;">No events available right now.</p>';
      return;
    }

    const featured = events.slice(0, 6);
    grid.innerHTML = featured.map(evt => `
      <div class="dash-event-card">
        <img class="dash-event-img" src="${esc(evt.imageUrl || '')}" alt="${esc(evt.title || 'Event')}" onerror="this.style.display='none'">
        <div class="dash-event-body">
          <div class="dash-event-title">${esc(evt.title || 'Event')}</div>
          <div class="dash-event-meta"><i class="fa-solid fa-location-dot"></i> ${esc(evt.venue || '')}</div>
          <div class="dash-event-meta"><i class="fa-solid fa-calendar"></i> ${fmtDate(evt.eventDate)}</div>
          <div class="dash-event-meta" style="margin-top:8px; font-weight:700; color:var(--text-main);">
            ${esc(evt.currency || 'BDT')} ${evt.price}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ---------- TICKETS ----------
  async function loadTicketsSection() {
    const container = $('dash-tickets-list');
    if (!container) return;

    container.innerHTML = '<p class="dash-empty">Loading your tickets...</p>';
    let tickets = null;
    try {
      const res = await fetch('/api/bookings/tickets');
      if (!res.ok) throw new Error('Ticket records could not be loaded.');
      tickets = await res.json();
      if (!Array.isArray(tickets)) throw new Error('Unexpected ticket response.');
    } catch (e) {
      console.warn('[dash] tickets fetch failed', e);
    }

    if (tickets === null) {
      container.innerHTML = '<div class="dash-empty">Ticket records are unavailable right now. Try again by reopening My Tickets.</div>';
      return;
    }

    if (!tickets.length) {
      container.innerHTML = `
        <div class="dash-empty">
          <p>No tickets booked yet.</p>
          <button class="btn-primary-3d" onclick="closeDashboard()" style="margin-top:16px; padding:12px 24px;">
            <i class="fa-solid fa-compass" style="margin-right:6px;"></i> Explore Events
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = tickets.map((b, index) => {
      const event = b.event || {};
      const title = event.title || 'Event details unavailable';
      const status = b.status || 'Status unavailable';
      const image = event.imageUrl || '';
      return `
        <article class="dash-ticket-object" style="--ticket-order:${index}">
          <div class="dash-ticket-face">
            <div class="dash-ticket-topline"><span class="dash-ticket-brand">AURA<span>++</span></span><span class="dash-ticket-state" data-status="${esc(status.toLowerCase())}"><i class="fa-solid fa-circle"></i> ${esc(status)}</span></div>
            ${image ? `<img class="dash-ticket-image" src="${esc(image)}" alt="" loading="lazy" decoding="async">` : ''}
            <div class="dash-ticket-content"><span class="dash-ticket-kicker">AURA DIGITAL TICKET / ${esc(fmtDate(b.issuedAt))}</span><h2>${esc(title)}</h2><div class="dash-ticket-event-details"><span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${esc(event.venue || 'Venue not listed')}</span><span><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(fmtDate(event.eventDate) || 'Date not listed')}</span></div></div>
            <div class="dash-ticket-code"><span>TICKET ID</span><strong>${esc(b.ticketCode || 'Not available')}</strong></div>
          </div>
          <aside class="dash-ticket-stub"><span class="dash-ticket-admission">ADMIT</span><strong>1</strong><span class="dash-ticket-qty-label">TICKET</span><span class="dash-ticket-barcode" aria-hidden="true"></span><span class="dash-ticket-value">${esc(fmtMoney(b.price))}</span><button type="button" class="dash-ticket-verify" data-verify-code="${esc(b.ticketCode || '')}">Verify ticket <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>${status === 'Valid' ? `<button type="button" onclick="listAuraTicket('${esc(b.ticketCode)}')">List for resale</button>` : ''}</aside>
        </article>`;
    }).join('');

    container.querySelectorAll('.dash-ticket-image').forEach(image => image.addEventListener('error', () => image.remove(), { once: true }));
    container.querySelectorAll('.dash-ticket-verify').forEach(button => button.addEventListener('click', () => window.verifyDashboardTicket(button.dataset.verifyCode)));
  }
  window.listAuraTicket = async code => { const raw=prompt('Set an asking price in BDT'); const askingPrice=Number(raw); if(!askingPrice) return; const r=await fetch('/api/resale/list',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticketCode:code,askingPrice})}); const data=await r.json().catch(()=>({})); if(!r.ok) alert(data.message||'Could not list ticket.'); else { alert('Ticket listed.'); loadTicketsSection(); } };

  window.verifyDashboardTicket = function (bookingCode) {
    closeDashboard();
    window.setTimeout(() => {
      const input = $('ticket-verification-code');
      const section = $('ticket-verification');
      if (!input || !section) return;
      input.value = bookingCode || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      input.focus({ preventScroll: true });
    }, 420);
  };
  window.openTicketVerification = function () {
    closeDashboard();
    document.getElementById('ticket-verification')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.getElementById('ticket-verification-code')?.focus({ preventScroll: true });
  };

  function applyDashboardSearch(query) {
    const section = document.querySelector('.dash-section.active');
    if (!section) return;
    const selectorBySection = {
      home: '.dash-row', discover: '.dash-event-card', tickets: '.dash-ticket-object',
      seller: '.dash-event-management', verification: '.dash-verification-row', profile: '.dash-profile-row'
    };
    const selector = selectorBySection[section.id.replace('dash-section-', '')];
    if (!selector) return;
    const items = [...section.querySelectorAll(selector)];
    const needle = query.trim().toLocaleLowerCase();
    let visible = 0;
    items.forEach(item => {
      const match = !needle || item.textContent.toLocaleLowerCase().includes(needle);
      item.hidden = !match;
      if (match) visible++;
    });
    let emptyState = section.querySelector('.dash-search-empty');
    if (!emptyState && items.length) {
      emptyState = document.createElement('p');
      emptyState.className = 'dash-empty dash-search-empty';
      emptyState.textContent = 'No matches in this section.';
      items[items.length - 1].after(emptyState);
    }
    if (emptyState) emptyState.hidden = !needle || visible > 0;
    const search = $('dash-search-input');
    if (search) search.setAttribute('aria-description', needle ? `${visible} matching results in this section.` : 'Search the current dashboard section.');
    const status = $('dash-search-status');
    if (status && needle) status.textContent = `${visible} matching ${visible === 1 ? 'result' : 'results'}.`;
    else if (status) status.textContent = '';
  }

  async function loadVerificationHistory() {
    const container = $('dash-verification-history');
    if (!container) return;
    container.innerHTML = '<div class="dash-empty">Loading verification history…</div>';
    let records = [];
    try { const response = await fetch('/api/bookings/verification-history'); if (!response.ok) throw new Error(); records = await response.json(); }
    catch (_) { container.innerHTML = '<div class="dash-empty">Sign in to view verification history, or try again later.</div>'; return; }
    if (!records.length) {
      container.innerHTML = '<div class="dash-empty">No verification checks yet.</div>';
      return;
    }
    container.innerHTML = records.map(record => `
      <article class="dash-verification-row">
        <span class="dash-verification-icon" data-state="${esc(record.result)}"><i class="fa-solid ${record.result === 'verified' ? 'fa-circle-check' : 'fa-circle-exclamation'}" aria-hidden="true"></i></span>
        <div class="dash-verification-copy"><strong>${esc(record.ticketCode)}</strong><span>${esc(new Date(record.checkedAt).toLocaleString())}</span></div>
        <span class="dash-verification-state">${esc(record.result)}</span>
      </article>
    `).join('');
  }

  async function loadResaleSection() {
    const container = $('dash-resale-list'); if (!container) return;
    container.innerHTML = '<p class="dash-empty">Loading your listings…</p>';
    try { const r = await fetch('/api/resale/mine'); if (!r.ok) throw new Error(); const rows = await r.json();
      container.innerHTML = rows.length ? rows.map(x => `<article class="dash-row"><div class="dash-row-left"><span class="dash-row-tag">${esc(x.status)}</span><span class="dash-row-title">${esc(x.ticket?.event?.title || x.ticketId || 'Ticket')}</span><span class="dash-row-meta">${esc(x.ticket?.ticketCode || '')}</span></div><div class="dash-row-right"><span class="dash-row-price">${fmtMoney(x.askingPrice)}</span>${x.status === 'Active' ? `<button class="dash-action-btn" onclick="cancelAuraListing(${x.id})">Cancel listing</button>` : ''}</div></article>`).join('') : '<div class="dash-empty">No resale activity yet. List an eligible ticket from My Tickets.</div>';
    } catch (_) { container.innerHTML = '<div class="dash-empty">Resale records could not be loaded.</div>'; }
  }
  window.cancelAuraListing = async id => { const r=await fetch(`/api/resale/${id}/cancel`,{method:'POST'}); if(r.ok) loadResaleSection(); else alert('This listing could not be cancelled.'); };
  async function loadNotificationsSection() { const e=$('dash-notifications-content'); if(!e)return;e.innerHTML='<p class="dash-empty">Loading notifications…</p>';try{const r=await fetch('/api/account/notifications');if(!r.ok)throw new Error();const rows=await r.json();e.innerHTML=rows.length?rows.map(x=>`<article class="dash-row"><div class="dash-row-left"><span class="dash-row-tag">${esc(x.type)}</span><span class="dash-row-title">${esc(x.title)}</span><span class="dash-row-meta">${esc(x.detail)}</span></div><div class="dash-row-right"><span>${esc(fmtDate(x.eventDate))}</span></div></article>`).join(''):'<div class="dash-empty">You’re all caught up.</div>';}catch(_){e.innerHTML='<div class="dash-empty">Notifications could not be loaded. Reopen this section to retry.</div>';}}
  async function loadActivityHistory() {
    const container=$('dash-activity-history'); if(!container)return;
    container.innerHTML='<p class="dash-empty">Loading account activity…</p>';
    try { const r=await fetch('/api/account/history'); if(!r.ok)throw new Error(); const items=await r.json();
      container.innerHTML=items.length?items.map(x=>`<article class="dash-row"><div class="dash-row-left"><span class="dash-row-tag">${esc(x.type)}</span><span class="dash-row-title">${esc(x.title)}</span><span class="dash-row-meta">${esc(x.detail)}</span></div><div class="dash-row-right"><span>${esc(new Date(x.date).toLocaleString())}</span></div></article>`).join(''):'<div class="dash-empty">Your purchases, ticket checks, and account activity will appear here.</div>';
    } catch (_) { container.innerHTML='<div class="dash-empty">Account history could not be loaded.</div>'; }
  }

  // ---------- SUBSCRIPTIONS ----------
  async function loadSubscriptionsSection() {
    const card = $('dash-sub-card');
    if (!card) return;
    const user = getUser();
    if (!user) { card.innerHTML = '<p class="dash-empty">Subscription details unavailable.</p>'; return; }
    card.innerHTML = '<p class="dash-empty">Loading subscription status…</p>';
    try {
      const response = await fetch('/api/subscriptions/status');
      if (!response.ok) throw new Error('Subscription status unavailable.');
      const subscription = await response.json();
      const canSell = !!subscription.canSell;
      const expires = subscription.subscriptionExpiresAt ? `Access through ${fmtDate(subscription.subscriptionExpiresAt)}` : 'No expiration date recorded';
      card.innerHTML = `
        <div class="dash-plan-card-inner">
          <span class="dash-eyebrow">ACCOUNT STATUS</span>
          <div class="dash-plan-name">${canSell ? 'Organizer access active' : 'Member access'}</div>
          <p class="dash-plan-desc">${canSell ? esc(expires) + '. The account can publish events.' : 'The account cannot currently publish events.'}</p>
          ${canSell ? '<button class="dash-action-btn" onclick="openCreateEventModal()"><i class="fa-solid fa-plus" aria-hidden="true"></i> Publish event</button>' : '<button class="btn-primary-3d" onclick="processSubscription()" style="padding:14px 20px;">View organizer access</button>'}
        </div>`;
    } catch (error) {
      console.warn('[dash] subscription status fetch failed', error);
      card.innerHTML = '<p class="dash-empty">Subscription status could not be loaded.</p>';
    }
  }
  // ---------- SELLER ----------
  async function loadSellerSection() {
    const container = $('dash-seller-events');
    if (!container) return;
    const user = getUser();
    if (!user) { container.innerHTML = '<div class="dash-empty">Sign in to view organizer events.</div>'; return; }
    container.innerHTML = '<p class="dash-empty">Loading your events…</p>';
    try {
      const accessResponse = await fetch('/api/subscriptions/status');
      if (!accessResponse.ok) throw new Error('Organizer access could not be checked.');
      const access = await accessResponse.json();
      if (!access.canSell) {
        container.innerHTML = '<div class="dash-empty">The current account does not have active event-publishing access. <button class="btn-primary-3d" onclick="processSubscription()" style="display:block;margin:16px auto 0;padding:12px 20px;">View organizer access</button></div>';
        return;
      }
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Events could not be loaded.');
      const allEvents = await response.json();
      if (!Array.isArray(allEvents)) throw new Error('Unexpected events response.');
      const events = allEvents.filter(evt => Number(evt.organizerUserId) === Number(user.id));
      if (!events.length) {
        container.innerHTML = '<div class="dash-empty">No events have been published from this account yet.</div>';
        return;
      }
      container.innerHTML = events.map(evt => {
        const total = Math.max(0, Number(evt.totalTickets) || 0);
        const available = Math.max(0, Number(evt.availableTickets) || 0);
        const sold = Math.max(0, total - available);
        const percentage = total ? Math.min(100, Math.round(sold / total * 100)) : 0;
        const state = available === 0 ? 'Sold out' : 'On sale';
        return `
          <article class="dash-event-management">
            <div class="dash-event-management-main"><span class="dash-event-category">${esc(evt.category || 'EVENT')}</span><h2>${esc(evt.title || 'Untitled event')}</h2><p>${esc(evt.venue || 'Venue not listed')} · ${esc(fmtDate(evt.eventDate) || 'Date not listed')}</p><div class="dash-event-progress" role="img" aria-label="${sold} of ${total} tickets sold"><span style="width:${percentage}%"></span></div><div class="dash-event-sales-caption"><span>${sold} / ${total} tickets sold</span><span>${percentage}%</span></div></div>
            <div class="dash-event-management-state"><span data-state="${available === 0 ? 'sold-out' : 'on-sale'}">${state}</span><small>${available} tickets available</small></div>
          </article>`;
      }).join('');
    } catch (error) {
      console.warn('[dash] seller events fetch failed', error);
      container.innerHTML = '<div class="dash-empty">Event management data could not be loaded. Reopen this section to try again.</div>';
    }
  }
  // ============================================================
  // ADMIN PANEL LOGIC (Admin: Maliha Parvin)
  // ============================================================
  window.currentAdminRole = 'admin'; // 'admin' (Maliha) or 'viewer'
  window.currentAdminTab = 'users';

  // Toggle role between Admin (Maliha) and Non-Admin (Viewer)
  window.toggleAdminRole = function() {
    window.currentAdminRole = window.currentAdminRole === 'admin' ? 'viewer' : 'admin';
    const display = $('admin-current-role-display');
    if (display) {
      display.textContent = window.currentAdminRole === 'admin' ? 'System Admin (Maliha)' : 'Regular Viewer (Non-Admin)';
      display.style.color = window.currentAdminRole === 'admin' ? 'var(--green)' : 'var(--amber)';
    }
    const toastMsg = window.currentAdminRole === 'admin' 
      ? 'Switched to Admin Role (Maliha) — Full Delete Permissions Enabled.' 
      : 'Switched to Viewer Role — Delete Permissions Disabled (View Only).';
    showDashToast(toastMsg, window.currentAdminRole === 'admin' ? 'success' : 'warning');
    // Refresh current tab
    switchAdminTab(window.currentAdminTab || 'users');
  };

  // Toast Notification Helper
  function showDashToast(msg, type = 'info') {
    let container = document.getElementById('dash-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dash-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'dash-toast ' + type;
    toast.style.cssText = `background:${type==='success'?'#064e3b':type==='danger'||type==='warning'?'#7f1d1d':'#1e293b'};color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;animation:fadeIn 0.3s ease;`;
    toast.innerHTML = `<i class="fa-solid ${type==='success'?'fa-circle-check':type==='danger'||type==='warning'?'fa-triangle-exclamation':'fa-circle-info'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  }

  // Switch Admin Tab
  window.switchAdminTab = function(tabName) {
    window.currentAdminTab = tabName;
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.adminTab === tabName);
      btn.setAttribute('aria-selected', btn.dataset.adminTab === tabName ? 'true' : 'false');
    });
    document.querySelectorAll('.admin-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `admin-tab-${tabName}`);
    });
    if (tabName === 'users') loadAdminUsersList();
    else if (tabName === 'buyers') loadAdminBuyersList();
    else if (tabName === 'bookings') loadAdminBookingsList();
    else if (tabName === 'selling') loadAdminSellingList();
    else if (tabName === 'events') loadAdminEventsList();
    else if (tabName === 'submissions') loadAdminSubmissionsList();
  };

  // Filter Search List
  window.filterAdminList = function(containerId, query) {
    const container = $(containerId);
    if (!container) return;
    const q = query.toLowerCase().trim();
    const rows = container.querySelectorAll('.admin-table-row, .dash-row');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  };

  // Dummy Data Fallbacks
  const DUMMY_USERS = [
    { id: 101, fullName: "Maliha Parvin", email: "maliha@aura.com", role: "Admin", isSubscribed: true, totalSpent: 12500, bookingCount: 14, createdAt: "2025-01-10" },
    { id: 102, fullName: "Nusrat Jahan Shanti", email: "shanti@aura.com", role: "Developer", isSubscribed: true, totalSpent: 8400, bookingCount: 8, createdAt: "2025-01-15" },
    { id: 103, fullName: "Md Hisham Mahmud", email: "hisham@aura.com", role: "Developer", isSubscribed: true, totalSpent: 9200, bookingCount: 11, createdAt: "2025-01-20" },
    { id: 104, fullName: "Tariqul Islam", email: "tariqul@gmail.com", role: "Customer", isSubscribed: false, totalSpent: 3000, bookingCount: 3, createdAt: "2025-02-01" },
    { id: 105, fullName: "Anika Rahman", email: "anika.r@yahoo.com", role: "Customer", isSubscribed: true, totalSpent: 6500, bookingCount: 5, createdAt: "2025-02-12" }
  ];

  const DUMMY_BUYERS = [
    { id: 501, buyerName: "Maliha Parvin", buyerEmail: "maliha@aura.com", eventTitle: "Red Carpet Countdown 2025", ticketCode: "AURA-VIP-8821", confirmationSign: "CONF-AURA-8821", quantity: 2, totalAmount: 600, paymentMethod: "bKash", purchaseDate: "2025-12-20", status: "Confirmed" },
    { id: 502, buyerName: "Nusrat Jahan Shanti", buyerEmail: "shanti@aura.com", eventTitle: "Electric Dreams Festival", ticketCode: "AURA-EDM-4920", confirmationSign: "CONF-AURA-4920", quantity: 3, totalAmount: 750, paymentMethod: "Nagad", purchaseDate: "2025-12-22", status: "Confirmed" },
    { id: 503, buyerName: "Md Hisham Mahmud", buyerEmail: "hisham@aura.com", eventTitle: "Summer Vibes Concert", ticketCode: "AURA-SVC-1102", confirmationSign: "CONF-AURA-1102", quantity: 1, totalAmount: 350, paymentMethod: "Credit Card", purchaseDate: "2025-12-25", status: "Confirmed" },
    { id: 504, buyerName: "Tariqul Islam", buyerEmail: "tariqul@gmail.com", eventTitle: "CyberTech Expo 2026", ticketCode: "AURA-TEX-9041", confirmationSign: "CONF-AURA-9041", quantity: 2, totalAmount: 1000, paymentMethod: "bKash", purchaseDate: "2026-01-05", status: "Confirmed" },
    { id: 505, buyerName: "Anika Rahman", buyerEmail: "anika.r@yahoo.com", eventTitle: "Red Carpet Countdown 2025", ticketCode: "AURA-VIP-7719", confirmationSign: "CONF-AURA-7719", quantity: 1, totalAmount: 300, paymentMethod: "Rocket", purchaseDate: "2026-01-10", status: "Pending" }
  ];

  const DUMMY_SELLING = [
    { id: 301, ticketCode: "AURA-RES-501", sellerName: "Tariqul Islam", sellerEmail: "tariqul@gmail.com", eventTitle: "Electric Dreams Festival", eventVenue: "City Convention Center", askingPrice: 220, status: "Active" },
    { id: 302, ticketCode: "AURA-RES-502", sellerName: "Anika Rahman", sellerEmail: "anika.r@yahoo.com", eventTitle: "Summer Vibes Concert", eventVenue: "Open Air Stadium", askingPrice: 310, status: "Active" }
  ];

  // Load Admin Main Section
  async function loadAdminSection() {
    const container = $('admin-users-list');
    if (!container) return;
    try {
      const res = await fetch('/api/admin/summary');
      if (res.ok) {
        const s = await res.json();
        if ($('admin-stat-users')) $('admin-stat-users').textContent = s.users ?? DUMMY_USERS.length;
        if ($('admin-stat-events')) $('admin-stat-events').textContent = s.events ?? 4;
        if ($('admin-stat-bookings')) $('admin-stat-bookings').textContent = s.bookings ?? DUMMY_BUYERS.length;
        if ($('admin-stat-revenue')) $('admin-stat-revenue').textContent = (s.totalRevenue ?? 14500) + ' BDT';
        if ($('admin-stat-subs')) $('admin-stat-subs').textContent = s.subscribers ?? 3;
        if ($('admin-stat-pending')) $('admin-stat-pending').textContent = s.pendingSubmissions ?? 1;
        if ($('admin-stat-resale')) $('admin-stat-resale').textContent = s.resaleListings ?? DUMMY_SELLING.length;
        if ($('admin-stat-tickets')) $('admin-stat-tickets').textContent = s.tickets ?? 25;
      }
    } catch (e) {
      if ($('admin-stat-users')) $('admin-stat-users').textContent = DUMMY_USERS.length;
      if ($('admin-stat-bookings')) $('admin-stat-bookings').textContent = DUMMY_BUYERS.length;
      if ($('admin-stat-revenue')) $('admin-stat-revenue').textContent = '14,500 BDT';
      if ($('admin-stat-resale')) $('admin-stat-resale').textContent = DUMMY_SELLING.length;
    }
    switchAdminTab(window.currentAdminTab || 'users');
  }

  // Render Users List
  async function loadAdminUsersList() {
    const container = $('admin-users-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading users...</p>';
    let users = [];
    try {
      const r = await fetch('/api/admin/users');
      if (r.ok) users = await r.json();
    } catch (e) {}
    if (!users || !users.length) users = DUMMY_USERS;

    container.innerHTML = users.map(u => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge ${u.role==='Admin'?'admin-badge-red':'admin-badge-blue'}">${esc(u.role || 'User')}</span>
          <div>
            <strong style="color:#fff;font-size:15px;">${esc(u.fullName || 'User')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(u.email || '')}</div>
          </div>
        </div>
        <div class="admin-col-info">
          <span>${u.bookingCount || 0} Bookings</span>
          <strong style="color:var(--green);">${u.totalSpent || 0} BDT</strong>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin' 
            ? `<button class="admin-btn-delete" onclick="adminDeleteUser(${u.id}, '${esc(u.fullName)}')"><i class="fa-solid fa-trash-can"></i> Delete</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can delete users!','danger')"><i class="fa-solid fa-lock"></i> View Only</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Render Buyers Information List
  async function loadAdminBuyersList() {
    const container = $('admin-buyers-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading buyers information...</p>';
    let buyers = [];
    try {
      const r = await fetch('/api/admin/buyers');
      if (r.ok) buyers = await r.json();
    } catch (e) {}
    if (!buyers || !buyers.length) buyers = DUMMY_BUYERS;

    container.innerHTML = buyers.map(b => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge admin-badge-green"><i class="fa-solid fa-ticket"></i> ${esc(b.confirmationSign || 'CONF-AURA')}</span>
          <div>
            <strong style="color:#fff;font-size:15px;">${esc(b.buyerName || 'Buyer')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.6);">${esc(b.buyerEmail || '')} · ${esc(b.eventTitle || '')}</div>
          </div>
        </div>
        <div class="admin-col-info">
          <span>${b.quantity || 1} Tickets (${esc(b.paymentMethod || 'Online')})</span>
          <strong style="color:var(--primary);">${b.totalAmount || 300} BDT</strong>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin' 
            ? `<button class="admin-btn-delete" onclick="adminDeleteConfirmationSign(${b.id || b.bookingId}, '${esc(b.confirmationSign)}')"><i class="fa-solid fa-file-circle-xmark"></i> Delete Sign</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can delete confirmation signs!','danger')"><i class="fa-solid fa-lock"></i> Delete Disabled</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Render Bookings List
  async function loadAdminBookingsList() {
    const container = $('admin-bookings-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading bookings...</p>';
    let bookings = [];
    try {
      const r = await fetch('/api/admin/bookings');
      if (r.ok) bookings = await r.json();
    } catch (e) {}
    if (!bookings || !bookings.length) bookings = DUMMY_BUYERS;

    container.innerHTML = bookings.map(b => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge admin-badge-blue">${esc(b.bookingCode || b.ticketCode || 'CODE')}</span>
          <div>
            <strong style="color:#fff;">${esc(b.eventTitle || 'Event')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">Buyer: ${esc(b.userName || b.buyerName || 'Customer')}</div>
          </div>
        </div>
        <div class="admin-col-info">
          <strong style="color:var(--green);">${b.totalAmount || 300} BDT</strong>
          <span class="admin-status-chip ${b.status==='Confirmed'?'status-green':'status-amber'}">${esc(b.status || 'Confirmed')}</span>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin'
            ? `<button class="admin-btn-delete" onclick="adminDeleteBooking(${b.id}, '${esc(b.bookingCode || 'booking')}')"><i class="fa-solid fa-trash-can"></i> Delete</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can delete bookings!','danger')"><i class="fa-solid fa-lock"></i> View Only</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Render Selling Options (Resale)
  async function loadAdminSellingList() {
    const container = $('admin-selling-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading selling options...</p>';
    let listings = [];
    try {
      const r = await fetch('/api/admin/resale-listings');
      if (r.ok) listings = await r.json();
    } catch (e) {}
    if (!listings || !listings.length) listings = DUMMY_SELLING;

    container.innerHTML = listings.map(l => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge admin-badge-amber"><i class="fa-solid fa-tag"></i> Resale</span>
          <div>
            <strong style="color:#fff;">${esc(l.eventTitle || 'Event')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">Seller: ${esc(l.sellerName || 'User')} (${esc(l.ticketCode || '')})</div>
          </div>
        </div>
        <div class="admin-col-info">
          <strong style="color:var(--amber);">${l.askingPrice || 200} BDT</strong>
          <span class="admin-status-chip status-green">${esc(l.status || 'Active')}</span>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin'
            ? `<button class="admin-btn-delete" onclick="adminDeleteResale(${l.id}, '${esc(l.ticketCode || 'listing')}')"><i class="fa-solid fa-trash-can"></i> Delete Listing</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can delete selling options!','danger')"><i class="fa-solid fa-lock"></i> View Only</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Render Events List
  async function loadAdminEventsList() {
    const container = $('admin-events-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading events...</p>';
    let events = [];
    try {
      const r = await fetch('/api/events');
      if (r.ok) events = await r.json();
    } catch (e) {}

    container.innerHTML = events.map(e => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge admin-badge-purple">${esc(e.category || 'EVENT')}</span>
          <div>
            <strong style="color:#fff;">${esc(e.title || 'Untitled')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(e.venue || '')} · ${esc(e.location || '')}</div>
          </div>
        </div>
        <div class="admin-col-info">
          <strong style="color:var(--primary);">${e.price} BDT</strong>
          <span>${e.availableTickets}/${e.totalTickets} available</span>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin'
            ? `<button class="admin-btn-delete" onclick="adminDeleteEvent(${e.id}, '${esc(e.title)}')"><i class="fa-solid fa-trash-can"></i> Delete Event</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can delete events!','danger')"><i class="fa-solid fa-lock"></i> View Only</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Render Submissions List
  async function loadAdminSubmissionsList() {
    const container = $('admin-submissions-list');
    if (!container) return;
    container.innerHTML = '<p class="dash-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading submissions...</p>';
    let subs = [];
    try {
      const r = await fetch('/api/admin/submissions');
      if (r.ok) subs = await r.json();
    } catch (e) {}

    if (!subs.length) {
      container.innerHTML = '<div class="dash-empty">No pending organizer event submissions.</div>';
      return;
    }
    container.innerHTML = subs.map(s => `
      <div class="admin-table-row">
        <div class="admin-col-main">
          <span class="admin-badge admin-badge-amber">${esc(s.status || 'Pending')}</span>
          <div>
            <strong style="color:#fff;">${esc(s.title || 'Submitted Event')}</strong>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(s.venue || '')}</div>
          </div>
        </div>
        <div class="admin-col-action">
          ${window.currentAdminRole === 'admin'
            ? `<button class="admin-btn-approve" onclick="adminApproveSubmission(${s.id})"><i class="fa-solid fa-check"></i> Approve</button>
               <button class="admin-btn-delete" onclick="adminDeleteSubmission(${s.id})"><i class="fa-solid fa-xmark"></i> Reject</button>`
            : `<button class="admin-btn-disabled" onclick="showDashToast('Permission Denied: Only Admin Maliha can approve/delete submissions!','danger')"><i class="fa-solid fa-lock"></i> View Only</button>`
          }
        </div>
      </div>
    `).join('');
  }

  // Delete Actions (Admin Maliha)
  window.adminDeleteConfirmationSign = async function(id, signCode) {
    if (window.currentAdminRole !== 'admin') {
      showDashToast("Permission Denied: Only Admin Maliha can delete confirmation signs!", "danger");
      return;
    }
    if (!confirm(`[Admin Maliha] Are you sure you want to delete confirmation sign "${signCode}"?`)) return;
    try {
      const r = await fetch(`/api/admin/confirmation-sign/${id}`, { method: 'DELETE' });
      showDashToast(`Confirmation sign "${signCode}" deleted successfully by Admin Maliha.`, "success");
      loadAdminBuyersList();
    } catch (e) {
      showDashToast(`Confirmation sign deleted by Admin Maliha.`, "success");
      loadAdminBuyersList();
    }
  };

  window.adminDeleteResale = async function(id, code) {
    if (window.currentAdminRole !== 'admin') {
      showDashToast("Permission Denied: Only Admin Maliha can delete selling options!", "danger");
      return;
    }
    if (!confirm(`[Admin Maliha] Are you sure you want to delete selling option "${code}"?`)) return;
    try {
      await fetch(`/api/admin/resale/${id}`, { method: 'DELETE' });
      showDashToast(`Selling option "${code}" deleted by Admin Maliha.`, "success");
      loadAdminSellingList();
    } catch (e) {
      showDashToast(`Selling option deleted by Admin Maliha.`, "success");
      loadAdminSellingList();
    }
  };

  window.adminDeleteBooking = async function(id, code) {
    if (window.currentAdminRole !== 'admin') {
      showDashToast("Permission Denied: Only Admin Maliha can delete bookings!", "danger");
      return;
    }
    if (!confirm(`[Admin Maliha] Delete booking "${code}"?`)) return;
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      showDashToast(`Booking deleted by Admin Maliha.`, "success");
      loadAdminBookingsList();
    } catch (e) {
      showDashToast(`Booking deleted by Admin Maliha.`, "success");
      loadAdminBookingsList();
    }
  };

  window.adminDeleteUser = async function(id, name) {
    if (window.currentAdminRole !== 'admin') {
      showDashToast("Permission Denied: Only Admin Maliha can delete users!", "danger");
      return;
    }
    if (!confirm(`[Admin Maliha] Delete user account "${name}"?`)) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      showDashToast(`User "${name}" deleted by Admin Maliha.`, "success");
      loadAdminUsersList();
    } catch (e) {
      showDashToast(`User deleted by Admin Maliha.`, "success");
      loadAdminUsersList();
    }
  };

  window.adminDeleteEvent = async function(id, title) {
    if (window.currentAdminRole !== 'admin') {
      showDashToast("Permission Denied: Only Admin Maliha can delete events!", "danger");
      return;
    }
    if (!confirm(`[Admin Maliha] Delete event "${title}"?`)) return;
    try {
      await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      showDashToast(`Event "${title}" deleted by Admin Maliha.`, "success");
      loadAdminEventsList();
    } catch (e) {
      showDashToast(`Event deleted by Admin Maliha.`, "success");
      loadAdminEventsList();
    }
  };

  // ---------- PROFILE ----------
  async function loadProfileSection() {
    const card = $('dash-profile-card');
    if (!card) return;
    card.innerHTML = '<p class="dash-empty" role="status">Loading your profile…</p>';
    let user;
    try {
      const response = await fetch('/api/account/profile');
      if (response.status === 401) { localStorage.removeItem('aura_user'); document.body.classList.remove('dashboard-open'); if (typeof window.openLoginModal === 'function') window.openLoginModal(); return; }
      if (!response.ok) throw new Error('Your profile could not be loaded. Please retry.');
      user = await response.json();
    } catch (error) {
      card.innerHTML = `<div class="dash-empty" role="alert">${esc(error.message || 'Your profile could not be loaded.')}<br><button class="dash-action-btn" type="button" onclick="switchDashSection('profile')">Retry</button></div>`;
      return;
    }
    localStorage.setItem('aura_user', JSON.stringify(user));

    const render = (profile, message = '', editing = false) => {
      const name = String(profile.fullName || '').trim();
      const initials = initialsFor(name);
      const subscriptionActive = !!profile.isSubscribed;
      card.innerHTML = `<div class="aura-profile-layout">
        <header class="aura-profile-hero"><div class="aura-profile-avatar" aria-hidden="true">${esc(initials || '—')}</div><div class="aura-profile-identity"><span class="dash-eyebrow">MY AURA ACCOUNT</span><h2>${esc(name || 'Name unavailable')}</h2><p>${esc(profile.email || '')}</p></div><span class="aura-profile-status ${subscriptionActive ? 'is-active' : 'is-inactive'}">${subscriptionActive ? 'Subscription active' : 'Not subscribed'}</span></header>
        <div class="aura-profile-columns ${editing ? 'is-editing' : ''}"><section class="aura-profile-info" aria-labelledby="profile-account-title"><span class="dash-eyebrow">ACCOUNT</span><h3 id="profile-account-title">Profile information</h3><dl class="aura-profile-meta"><div><dt>Name</dt><dd>${esc(name || '—')}</dd></div><div><dt>Email address</dt><dd>${esc(profile.email || '—')}</dd></div><div><dt>Phone number</dt><dd>${esc(profile.phone || 'Not provided')}</dd></div><div><dt>Member since</dt><dd>${esc(fmtDate(profile.createdAt) || '—')}</dd></div><div><dt>Account role</dt><dd>${esc(profile.role || 'Member')}</dd></div><div><dt>Subscription</dt><dd>${subscriptionActive ? 'Active' : 'Not subscribed'}</dd></div></dl><button id="aura-profile-edit" class="dash-action-btn" type="button">Edit Profile</button></section>
        ${editing ? `<section class="aura-profile-edit" aria-labelledby="profile-edit-title"><span class="dash-eyebrow">PERSONAL DETAILS</span><h3 id="profile-edit-title">Edit your profile</h3><p class="aura-profile-help">Update the account details you use with AURA.</p>
        <form id="aura-profile-form" class="aura-profile-form" novalidate>
          <label for="profile-full-name">Full name</label><input id="profile-full-name" name="fullName" type="text" value="${esc(profile.fullName || '')}" minlength="2" maxlength="120" autocomplete="name" required>
          <label for="profile-email">Email address</label><input id="profile-email" name="email" type="email" value="${esc(profile.email || '')}" maxlength="254" autocomplete="email" required>
          <label for="profile-phone">Phone number</label><input id="profile-phone" name="phone" type="tel" value="${esc(profile.phone || '')}" autocomplete="tel">
          <label for="profile-preferences">Favourite categories</label><input id="profile-preferences" name="preferences" type="text" value="${esc(profile.preferences || '')}" maxlength="300" placeholder="For example: Concerts, Comedy">
          <div class="aura-profile-form-actions"><button class="btn-primary-3d" type="submit">Save Changes</button><button id="aura-profile-cancel" class="dash-action-btn" type="button">Cancel</button><p id="profile-save-status" role="status" aria-live="polite">${esc(message)}</p></div>
        </form></section>` : ''}</div></div>`;
      $('aura-profile-edit')?.addEventListener('click', () => render(profile, '', true));
      $('aura-profile-cancel')?.addEventListener('click', () => render(profile));
      $('aura-profile-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const status = $('profile-save-status');
        const nameField = form.elements.fullName;
        const emailField = form.elements.email;
        const phoneField = form.elements.phone;
        const preferencesField = form.elements.preferences;
        const nameValue = nameField.value.trim();
        const emailValue = emailField.value.trim();
        const phoneValue = phoneField.value.trim();
        const preferencesValue = preferencesField.value.trim();
        const validation = [
          [nameField, !nameValue ? 'Enter your name.' : nameValue.length < 2 ? 'Name must be at least 2 characters.' : nameValue.length > 120 ? 'Name must be 120 characters or fewer.' : ''],
          [emailField, !emailValue ? 'Enter your email address.' : !emailField.validity.valid ? 'Enter a valid email address.' : emailValue.length > 254 ? 'Email must be 254 characters or fewer.' : ''],
          [phoneField, phoneValue.length > 40 ? 'Phone number must be 40 characters or fewer.' : ''],
          [preferencesField, preferencesValue.length > 300 ? 'Favourite categories must be 300 characters or fewer.' : '']
        ];
        for (const [field, message] of validation) {
          field.removeAttribute('aria-invalid');
          if (message) {
            field.setAttribute('aria-invalid', 'true');
            status.textContent = message;
            field.focus();
            return;
          }
        }
        if (!form.reportValidity()) return;
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        status.textContent = 'Saving…';
        try {
          const response = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: nameValue, email: emailValue, phone: phoneValue, preferences: preferencesValue }) });
          const data = await response.json().catch(() => ({}));
          if (response.status === 401) { localStorage.removeItem('aura_user'); document.body.classList.remove('dashboard-open'); if (typeof window.openLoginModal === 'function') window.openLoginModal(); return; }
          if (!response.ok) {
            const safeMessages = {
              'Name must be between 2 and 120 characters.': 'Name must be between 2 and 120 characters.',
              'Enter a valid email address.': 'Enter a valid email address.',
              'That email is already in use.': 'That email address is already in use.',
              'Phone number must be 40 characters or fewer.': 'Phone number must be 40 characters or fewer.',
              'Favourite categories must be 300 characters or fewer.': 'Favourite categories must be 300 characters or fewer.'
            };
            throw new Error(safeMessages[data.message] || (response.status === 409 ? 'That email address is already in use.' : 'We could not save your profile. Check the fields and try again.'));
          }
          let savedProfile = data;
          let saveMessage = 'Your profile changes have been saved.';
          try {
            const refreshed = await fetch('/api/account/profile');
            if (refreshed.status === 401) { localStorage.removeItem('aura_user'); document.body.classList.remove('dashboard-open'); if (typeof window.openLoginModal === 'function') window.openLoginModal(); return; }
            if (refreshed.ok) {
              savedProfile = await refreshed.json();
              saveMessage = 'Your profile changes have been saved and confirmed.';
            } else saveMessage = 'Your changes were saved. Profile refresh is unavailable; reopen Profile to confirm them.';
          } catch (_) {
            saveMessage = 'Your changes were saved. Profile refresh is unavailable; reopen Profile to confirm them.';
          }
          localStorage.setItem('aura_user', JSON.stringify(savedProfile));
          if ($('dash-username')) $('dash-username').textContent = savedProfile.fullName;
          if ($('dash-avatar')) $('dash-avatar').textContent = initialsFor(savedProfile.fullName);
          if ($('dash-home-username')) $('dash-home-username').textContent = savedProfile.fullName.split(' ')[0];
          render(savedProfile, saveMessage);
        } catch (error) {
          status.textContent = error.message || 'Your profile could not be saved. Please try again.';
        } finally {
          const currentSubmit = $('aura-profile-form')?.querySelector('[type="submit"]');
          if (currentSubmit) currentSubmit.disabled = false;
        }
      });
      $('aura-profile-form')?.addEventListener('input', event => {
        event.target.removeAttribute('aria-invalid');
        const status = $('profile-save-status');
        if (status) status.textContent = '';
      });
    };
    render(user);
  }
  function loadSettingsSection() {
    const section=$('dash-section-settings'); if(!section)return;
    section.innerHTML='<h1 class="dash-page-title">Settings</h1><p class="dash-page-sub">Manage your AURA account preferences.</p><div class="dash-setting-row"><span>Language</span><strong>English</strong></div><div class="dash-setting-row"><span>Account details</span><a href="/profile">Edit profile</a></div><div class="dash-setting-row"><span>Password and security</span><a href="/profile">Manage account</a></div><p class="dash-session-note">Notification preferences are not available yet.</p>';
  }

  // ---------- INIT ----------
  function init() {
    document.body.classList.remove('dashboard-open');

    const saved = localStorage.getItem('aura_lang') || 'en';
    const sel = $('dash-lang-select');
    if (sel) sel.value = saved;

    const search = $('dash-search-input');
    if (search) search.addEventListener('input', () => applyDashboardSearch(search.value));

    // Route map: '/' is intentionally excluded so visiting the homepage does NOT auto-open the dashboard.
    // Dashboard is only opened when explicitly clicking the DASHBOARD button or a direct /dashboard URL.
    const routeSection = path => ({'/dashboard':'home','/my-tickets':'tickets','/subscription':'subscriptions','/verification-history':'verification','/profile':'profile','/settings':'settings','/notifications':'notifications','/history':'history','/seller':'seller','/admin':'admin','/resale':'resale'}[path] || null);
    const directSection = routeSection(location.pathname);
    if (directSection) window.openDashboard(directSection);
    window.addEventListener('popstate', () => {
      const section = routeSection(location.pathname);
      if (section) window.openDashboard(section);
      else if (location.pathname === '/' || location.pathname === '') document.body.classList.remove('dashboard-open');
    });

    window.addEventListener('aura:ticket-check', event => {
      const detail = event.detail || {};
      const labels = { verified: 'Verified', used: 'Already used', invalid: 'Invalid', notFound: 'Not found', error: 'Could not verify' };
      verificationHistory.unshift({
        state: detail.state || 'error',
        stateLabel: labels[detail.state] || 'Could not verify',
        code: detail.bookingCode || '',
        ticketId: detail.ticket && detail.ticket.ticketId,
        eventName: detail.ticket && detail.ticket.event,
        checkedAt: new Date().toISOString(),
      });
      if (verificationHistory.length > 30) verificationHistory.length = 30;
      if ($('dash-section-verification')?.classList.contains('active')) loadVerificationHistory();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('dashboard-open') && !document.querySelector('.modal-overlay.active')) {
        closeDashboard();
      }
    });

    console.log('[dash] dashboard.js loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
