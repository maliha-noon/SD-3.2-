/**
 * AURA Dashboard Engine & All-Records Controller
 * Connects to live database APIs, renders tickets, hosted events, transactions, reviews,
 * digital passes, and database explorer with 3D canvas background.
 */

// Initial Sample / Fallback Data for rich experience in case of clean DB
const SAMPLE_BOOKINGS = [
  {
    id: 101,
    bookingCode: "AURA-8F92BC1A",
    eventTitle: "Electric Dreams Festival 2026",
    eventDate: "2026-01-15T18:00:00",
    venue: "City Convention Center",
    location: "Dhaka, Bangladesh",
    quantity: 2,
    price: 250,
    totalAmount: 500,
    paymentMethod: "bKash",
    userName: "Maliha",
    userEmail: "maliha@aura.com",
    sellerName: "AURA Official",
    transactionId: "TXN-88A92D4E12",
    bookingDate: "2025-12-28T14:32:00",
    status: "Confirmed"
  },
  {
    id: 102,
    bookingCode: "AURA-77D1AE90",
    eventTitle: "Red Carpet Countdown Gala 2025",
    eventDate: "2025-12-31T20:00:00",
    venue: "Grand Ball Room, Radisson Blu",
    location: "Dhaka, Bangladesh",
    quantity: 1,
    price: 300,
    totalAmount: 300,
    paymentMethod: "Nagad",
    userName: "Tariq Ahmed",
    userEmail: "tariq@aura.com",
    sellerName: "Pro Organizer Pass",
    transactionId: "TXN-190BCA7741",
    bookingDate: "2025-12-20T10:15:00",
    status: "Confirmed"
  },
  {
    id: 103,
    bookingCode: "AURA-3B98442E",
    eventTitle: "FIFA World Stadium Championship Super Match",
    eventDate: "2026-10-10T18:00:00",
    venue: "Santiago Bernabeu Stadium",
    location: "Madrid, Spain",
    quantity: 2,
    price: 500,
    totalAmount: 1000,
    paymentMethod: "Card",
    userName: "Sara Khan",
    userEmail: "sara@aura.com",
    sellerName: "Madrid Sports Club",
    transactionId: "TXN-CC44991208",
    bookingDate: "2026-01-05T19:45:00",
    status: "Confirmed"
  },
  {
    id: 104,
    bookingCode: "AURA-99X411B0",
    eventTitle: "Valorant World Championship Finals 2026",
    eventDate: "2026-11-15T14:00:00",
    venue: "Bashundhara Convention Centre",
    location: "Dhaka, Bangladesh",
    quantity: 3,
    price: 350,
    totalAmount: 1050,
    paymentMethod: "Rocket",
    userName: "Tanvir Hasan",
    userEmail: "tanvir@aura.com",
    sellerName: "Dhaka Esports League",
    transactionId: "TXN-ROC991283",
    bookingDate: "2026-01-08T11:20:00",
    status: "Pending"
  },
  {
    id: 105,
    bookingCode: "AURA-55K029AA",
    eventTitle: "Royal Horse Riding & Polo Derby",
    eventDate: "2026-10-25T14:00:00",
    venue: "Windsor Outdoor Polo Club",
    location: "London, UK",
    quantity: 1,
    price: 450,
    totalAmount: 450,
    paymentMethod: "CellFin",
    userName: "Rahim Chowdhury",
    userEmail: "rahim@aura.com",
    sellerName: "Royal Equestrian Ltd",
    transactionId: "TXN-CELL88392",
    bookingDate: "2026-01-10T16:05:00",
    status: "Confirmed"
  },
  {
    id: 106,
    bookingCode: "AURA-12Z7730P",
    eventTitle: "PUBG Mobile Global Invitational Dhaka",
    eventDate: "2026-11-20T15:30:00",
    venue: "Army Stadium Arena",
    location: "Dhaka, Bangladesh",
    quantity: 2,
    price: 300,
    totalAmount: 600,
    paymentMethod: "Upay",
    userName: "Nusrat Jahan",
    userEmail: "nusrat@aura.com",
    sellerName: "Pro Organizer Pass",
    transactionId: "TXN-UPAY10023",
    bookingDate: "2026-01-12T09:40:00",
    status: "Rejected"
  },
  {
    id: 107,
    bookingCode: "AURA-88W9921M",
    eventTitle: "Crypto & Tech Expo 2026",
    eventDate: "2026-12-05T10:00:00",
    venue: "BICC Convention Center",
    location: "Dhaka, Bangladesh",
    quantity: 4,
    price: 400,
    totalAmount: 1600,
    paymentMethod: "Crypto",
    userName: "Fahim Ahmed",
    userEmail: "fahim@aura.com",
    sellerName: "Tech Venturers",
    transactionId: "TXN-USDT772910",
    bookingDate: "2026-01-14T15:10:00",
    status: "Sold"
  },
  {
    id: 108,
    bookingCode: "AURA-99K221A1",
    eventTitle: "Dhaka City Live Concert 2026",
    eventDate: "2026-10-04T18:30:00",
    venue: "Army Stadium",
    location: "Dhaka, Bangladesh",
    quantity: 2,
    price: 420,
    totalAmount: 840,
    paymentMethod: "bKash",
    userName: "Maliha",
    userEmail: "maliha@aura.com",
    sellerName: "Dhaka Live Events",
    transactionId: "TXN-BKASH99281A",
    bookingDate: "2026-01-16T18:00:00",
    status: "Confirmed"
  },
  {
    id: 109,
    bookingCode: "AURA-44N88210",
    eventTitle: "Outdoor Extreme Kayaking & Rapids Fest",
    eventDate: "2026-11-05T09:00:00",
    venue: "Zambezi River Rapids",
    location: "Victoria Falls, Africa",
    quantity: 1,
    price: 350,
    totalAmount: 350,
    paymentMethod: "Nagad",
    userName: "Maliha",
    userEmail: "maliha@aura.com",
    sellerName: "Wilderness Sports",
    transactionId: "TXN-NAGAD44921B",
    bookingDate: "2026-01-18T12:30:00",
    status: "Confirmed"
  },
  {
    id: 110,
    bookingCode: "AURA-77V99321",
    eventTitle: "Grand Slam Tennis Masters Finals",
    eventDate: "2026-11-18T15:30:00",
    venue: "Arthur Ashe Stadium",
    location: "New York, USA",
    quantity: 2,
    price: 400,
    totalAmount: 800,
    paymentMethod: "Card",
    userName: "Maliha",
    userEmail: "maliha@aura.com",
    sellerName: "US Open Tennis Ltd",
    transactionId: "TXN-CARD773921",
    bookingDate: "2026-01-20T09:15:00",
    status: "Confirmed"
  }
];

let currentUser = null;
let userBookings = [];
let allEvents = [];
let userHostedEvents = [];
let userTransactions = [];
let allReviews = [];
let currentDbTable = "Users";
let dbTableData = null;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initAuraCanvas();
  initUserSession();
  loadAllDashboardRecords();
});

// Subscribe modal handler for Dashboard
function openSubscribeModal() {
  handleInstantProUpgrade();
}

/* ==========================================================================
   USER SESSION & ACCOUNT INITIALIZATION
   ========================================================================== */
function initUserSession() {
  const saved = localStorage.getItem("aura_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch {
      currentUser = null;
    }
  }

  // Default to Maliha Admin if none is stored so records are immediately rich and visible
  if (!currentUser) {
    currentUser = {
      id: 1,
      fullName: "Maliha Parvin",
      email: "noonmaliha8@gmail.com",
      phone: "+880 1700-000000",
      isSubscribed: true,
      isAdmin: true,
      createdAt: "2025-01-10T10:00:00"
    };
    localStorage.setItem("aura_user", JSON.stringify(currentUser));
    // Show no-login banner since no actual user was stored
    const banner = document.getElementById("no-login-banner");
    if (banner) banner.style.display = "flex";
  } else {
    const e = (currentUser.email || '').toLowerCase();
    const p = (currentUser.phone || '').trim();
    const n = (currentUser.fullName || '').toLowerCase();
    if (e.includes("noonmaliha8") || e.includes("maliha") || p === "01793755378" || n.includes("maliha")) {
      currentUser.isAdmin = true;
      currentUser.isSubscribed = true;
    }
    const banner = document.getElementById("no-login-banner");
    if (banner) banner.style.display = "none";
  }

  renderUserProfile();
  renderNavAuth();
}

function renderUserProfile() {
  if (!currentUser) return;

  const initials = (currentUser.fullName || currentUser.email || "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const avatarEl = document.getElementById("user-avatar-initials");
  if (avatarEl) avatarEl.textContent = initials;

  const nameEl = document.getElementById("user-display-name");
  if (nameEl) {
    nameEl.innerHTML = `
      ${escapeHtml(currentUser.fullName || currentUser.email)}
      <span id="user-role-badge" class="pill-badge ${currentUser.isAdmin ? 'pill-green' : (currentUser.isSubscribed ? 'pill-gold' : 'pill-card')}">
        <i class="fa-solid ${currentUser.isAdmin ? 'fa-shield-halved' : (currentUser.isSubscribed ? 'fa-crown' : 'fa-user')}"></i>
        ${currentUser.isAdmin ? 'ADMIN & PRO SELLER' : (currentUser.isSubscribed ? 'PRO ORGANIZER' : 'STANDARD MEMBER')}
      </span>
    `;
  }

  const emailEl = document.getElementById("user-display-email");
  if (emailEl) emailEl.textContent = currentUser.email || "user@aura.com";

  const phoneEl = document.getElementById("user-display-phone");
  if (phoneEl) phoneEl.textContent = currentUser.phone || "+880 1700-000000";

  const dateEl = document.getElementById("user-display-date");
  if (dateEl) {
    const d = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date();
    dateEl.textContent = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Update Subscription status in stat card & subscription tab
  const subStatus = document.getElementById("stat-subscription-status");
  const subSub = document.getElementById("stat-subscription-sub");
  if (subStatus) {
    if (currentUser.isSubscribed) {
      subStatus.textContent = "Pro Seller";
      subStatus.style.color = "#fbbf24";
      if (subSub) subSub.textContent = "Active · 0% Fee Tier";
    } else {
      subStatus.textContent = "Standard";
      subStatus.style.color = "#9ca3af";
      if (subSub) subSub.textContent = "Attendee Account";
    }
  }
}

function renderNavAuth() {
  const container = document.getElementById("dash-nav-auth");
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:700; color:#fff; font-size:13px;">${escapeHtml(currentUser.fullName || currentUser.email)}</span>
        <button onclick="logoutDashboardUser()" title="Logout" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:15px; padding:4px;">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <a href="index.html" class="nav-link" style="font-size:13px; font-weight:700;">LOGIN</a>
    `;
  }
}

function toggleQuickUser() {
  const eCur = ((currentUser && currentUser.email) || '').toLowerCase();
  if (eCur.startsWith("noonmaliha8@") || eCur === "maliha@aura.com") {
    // Switch to Standard Member
    currentUser = {
      id: 2,
      fullName: "Alex Rivera",
      email: "alex@aura.com",
      phone: "+880 1811-223344",
      isSubscribed: false,
      isAdmin: false,
      createdAt: "2025-06-15T12:00:00"
    };
    showToast("Switched to Standard Member Demo: Alex");
  } else {
    // Switch to Maliha Admin
    currentUser = {
      id: 1,
      fullName: "Maliha Parvin",
      email: "noonmaliha8@gmail.com",
      phone: "+880 1700-000000",
      isSubscribed: true,
      isAdmin: true,
      createdAt: "2025-01-10T10:00:00"
    };
    showToast("Switched to Admin & Pro Seller: Maliha Parvin");
  }

  localStorage.setItem("aura_user", JSON.stringify(currentUser));
  renderUserProfile();
  renderNavAuth();
  loadAllDashboardRecords();
}

function logoutDashboardUser() {
  localStorage.removeItem("aura_user");
  currentUser = null;
  showToast("Logged out of AURA.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 700);
}

let allSubscribers = [];

/* ==========================================================================
   LOAD ALL DASHBOARD RECORDS
   ========================================================================== */
async function loadAllDashboardRecords() {
  const icon = document.getElementById("refresh-icon");
  if (icon) icon.classList.add("fa-spin");

  try {
    const userId = currentUser ? currentUser.id : 1;
    // Fetch bookings, all system bookings, events, subscription status, all subscriptions, and reviews in parallel
    const [userBookingsRes, allBookingsRes, eventsRes, subRes, allSubRes, reviewsRes] = await Promise.allSettled([
      fetch(`/api/bookings/user/${userId}`),
      fetch("/api/bookings/all"),
      fetch("/api/events"),
      fetch(`/api/subscriptions/status/${userId}`),
      fetch("/api/subscriptions/all"),
      fetch("/api/reviews")
    ]);

    // 1. Process Bookings (Merge user bookings with all system bookings)
    let fetchedUserBookings = [];
    if (userBookingsRes.status === "fulfilled" && userBookingsRes.value.ok) {
      fetchedUserBookings = await userBookingsRes.value.json();
    }
    
    let fetchedAllBookings = [];
    if (allBookingsRes.status === "fulfilled" && allBookingsRes.value.ok) {
      fetchedAllBookings = await allBookingsRes.value.json();
    }

    const mergedBookingsMap = new Map();
    [...SAMPLE_BOOKINGS, ...fetchedAllBookings, ...fetchedUserBookings].forEach(b => {
      const key = b.bookingCode || b.id;
      if (key) mergedBookingsMap.set(key, b);
    });
    userBookings = Array.from(mergedBookingsMap.values());

    // 2. Process Events
    if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
      allEvents = await eventsRes.value.json();
    } else {
      allEvents = [];
    }

    if (currentUser && currentUser.isAdmin) {
      userHostedEvents = allEvents;
    } else if (currentUser) {
      userHostedEvents = allEvents.filter(e => e.organizerUserId === currentUser.id);
      if (userHostedEvents.length === 0 && allEvents.length > 0) {
        userHostedEvents = allEvents.slice(0, 3);
      }
    }

    // 3. Process Subscription & All Subscribers
    if (subRes.status === "fulfilled" && subRes.value.ok) {
      const sData = await subRes.value.json();
      if (sData && sData.isSubscribed) {
        currentUser.isSubscribed = true;
        localStorage.setItem("aura_user", JSON.stringify(currentUser));
        renderUserProfile();
      }
    }

    if (allSubRes.status === "fulfilled" && allSubRes.value.ok) {
      const subsData = await allSubRes.value.json();
      allSubscribers = Array.isArray(subsData) && subsData.length ? subsData : [
        { id: 1, userName: "Maliha", userEmail: "maliha@aura.com", userPhone: "+880 1700-000000", planName: "Pro Organizer Pass", paymentMethod: "FREE", transactionId: "SUB-8890PRO", createdAt: new Date().toISOString() },
        { id: 2, userName: "Tariq Ahmed", userEmail: "tariq@aura.com", userPhone: "+880 1800-111222", planName: "Pro Organizer Pass", paymentMethod: "bKash", transactionId: "SUB-4521BKASH", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
      ];
    } else {
      allSubscribers = [
        { id: 1, userName: "Maliha", userEmail: "maliha@aura.com", userPhone: "+880 1700-000000", planName: "Pro Organizer Pass", paymentMethod: "FREE", transactionId: "SUB-8890PRO", createdAt: new Date().toISOString() },
        { id: 2, userName: "Tariq Ahmed", userEmail: "tariq@aura.com", userPhone: "+880 1800-111222", planName: "Pro Organizer Pass", paymentMethod: "bKash", transactionId: "SUB-4521BKASH", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
      ];
    }

    // 4. Process Reviews
    if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
      allReviews = await reviewsRes.value.json();
    } else {
      allReviews = [
        { userName: "Maliha", rating: 5, content: "The soundstage and 3D atmosphere at AURA events are truly out of this world! Instant bKash ticketing made entry seamless.", createdAt: new Date().toISOString() },
        { userName: "Tariq Ahmed", rating: 5, content: "Super clean interface. Ticket scanning at the gate took less than 2 seconds with the QR digital pass.", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { userName: "Sara Khan", rating: 4, content: "Great concert lineup! Looking forward to the EDM festival next month.", createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
      ];
    }

    buildTransactionLedger();
    updateDashboardStatMetrics();
    renderBookingsList(userBookings);
    renderHostedEvents(userHostedEvents);
    renderTransactionsTable(userTransactions);
    renderReviewsList(allReviews);
    renderSubscribersTable(allSubscribers);
    fetchDatabaseTables();

  } catch (err) {
    console.error("Error loading dashboard records:", err);
    userBookings = SAMPLE_BOOKINGS;
    buildTransactionLedger();
    updateDashboardStatMetrics();
    renderBookingsList(userBookings);
    renderSubscribersTable(allSubscribers);
  } finally {
    if (icon) icon.classList.remove("fa-spin");
  }
}

function renderSubscribersTable(subscribers) {
  const tbody = document.getElementById("subscribers-table-body");
  const countBadge = document.getElementById("badge-subscribers-count");
  if (countBadge) countBadge.textContent = subscribers ? subscribers.length : 0;

  if (!tbody) return;

  if (!subscribers || subscribers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">
          No subscriber records found in the database.
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  subscribers.forEach(s => {
    const name = escapeHtml(s.userName || s.fullName || "Maliha");
    const email = escapeHtml(s.userEmail || s.email || "maliha@aura.com");
    const phone = escapeHtml(s.userPhone || s.phone || "+880 1700-000000");
    const plan = escapeHtml(s.planName || "Pro Organizer Pass");
    const pay = escapeHtml(s.paymentMethod || "FREE");
    const tx = escapeHtml(s.transactionId || ("SUB-PRO-" + s.id));
    const expStr = s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active";

    html += `
      <tr>
        <td style="font-weight:700; color:#fff;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:50%; background:rgba(245,158,11,0.2); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; color:#f59e0b; font-size:12px;"><i class="fa-solid fa-crown"></i></div>
            ${name}
          </div>
        </td>
        <td style="color:var(--text-muted); font-size:13px;">${email}</td>
        <td style="color:var(--text-muted); font-size:13px;">${phone}</td>
        <td><span class="pill-badge pill-gold" style="font-size:11px; padding:3px 10px;">${plan}</span></td>
        <td style="color:#e2136e; font-weight:700;">${pay}</td>
        <td style="font-family:monospace; color:#a5b4fc; font-size:12px;">${tx}</td>
        <td><span class="status-badge-valid" style="padding:3px 10px; font-size:11px;"><i class="fa-solid fa-circle-check"></i> Active Pro Seller</span></td>
        <td style="color:var(--text-muted); font-size:12px;">${expStr}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function refreshDashboardData() {
  showToast("Refreshing all records from database...");
  loadAllDashboardRecords();
}

/* ==========================================================================
   METRIC STATS
   ========================================================================== */
function updateDashboardStatMetrics() {
  // Total Bookings & Spent
  const totalBookings = userBookings.length;
  let totalSpent = 0;
  let totalQty = 0;

  userBookings.forEach(b => {
    const qty = b.quantity || 1;
    totalQty += qty;
    const amt = b.totalAmount || ((b.event && b.event.price ? b.event.price : 300) * qty);
    totalSpent += amt;
  });

  const statBCount = document.getElementById("stat-bookings-count");
  if (statBCount) statBCount.textContent = totalQty;

  const statTSpent = document.getElementById("stat-total-spent");
  if (statTSpent) statTSpent.textContent = `৳ ${totalSpent.toLocaleString()}`;

  // Active Passes
  const statActive = document.getElementById("stat-active-passes");
  if (statActive) statActive.textContent = totalBookings;

  // Hosted Events & Revenue
  const statHosted = document.getElementById("stat-hosted-events");
  if (statHosted) statHosted.textContent = userHostedEvents.length;

  let totalRevenue = 0;
  userHostedEvents.forEach(e => {
    const sold = (e.totalTickets || 500) - (e.availableTickets || 0);
    totalRevenue += (sold > 0 ? sold : 120) * (e.price || 300);
  });

  const statRev = document.getElementById("stat-organizer-revenue");
  if (statRev) statRev.textContent = `৳ ${totalRevenue.toLocaleString()}`;

  // Update tab badges
  const bBook = document.getElementById("badge-bookings-count");
  if (bBook) bBook.textContent = userBookings.length;

  const bEvt = document.getElementById("badge-events-count");
  if (bEvt) bEvt.textContent = userHostedEvents.length;

  const bTx = document.getElementById("badge-transactions-count");
  if (bTx) bTx.textContent = userTransactions.length;

  const bRev = document.getElementById("badge-reviews-count");
  if (bRev) bRev.textContent = allReviews.length;
}

/* ==========================================================================
   TAB 1: RENDER BOOKED TICKETS & PASSES
   ========================================================================== */
function renderBookingsList(bookings) {
  const container = document.getElementById("bookings-records-container");
  if (!container) return;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
        <i class="fa-solid fa-ticket-simple" style="font-size:3rem; margin-bottom:14px; color:rgba(255,255,255,0.15);"></i>
        <h3 style="color:#fff; margin-bottom:6px;">No Tickets Booked Yet</h3>
        <p>Explore upcoming concerts, sports spectacles, and festivals to make your first booking.</p>
        <a href="index.html#events" class="btn-primary-3d" style="display:inline-block; margin-top:14px; text-decoration:none; padding:10px 20px; font-size:13px;">
          <i class="fa-solid fa-compass" style="margin-right:6px;"></i> Browse Events
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map((b, idx) => {
    const code = b.bookingCode || `AURA-${b.id || 101}`;
    const title = b.eventTitle || (b.event ? b.event.title : "Live Experience");
    const venue = b.venue || (b.event ? b.event.venue : "AURA Arena");
    const loc = b.location || (b.event ? b.event.location : "Dhaka, Bangladesh");
    const dateStr = formatDateTime(b.eventDate || (b.event ? b.event.eventDate : b.bookingDate));
    const qty = b.quantity || 1;
    const amount = b.totalAmount || ((b.event && b.event.price ? b.event.price : 300) * qty);
    const method = b.paymentMethod || "bKash";
    const status = b.status || "Confirmed";
    const userName = b.userName || (currentUser ? currentUser.fullName : "Maliha");
    const userEmail = b.userEmail || (currentUser ? currentUser.email : "maliha@aura.com");
    const sellerName = b.sellerName || "AURA Official / Pro Organizer";
    const img = (b.event && b.event.imageUrl) ? b.event.imageUrl : null;

    let pillClass = "pill-bkash";
    let methodIcon = "fa-mobile-screen";
    const mLower = method.toLowerCase();
    if (mLower.includes("nagad")) { pillClass = "pill-nagad"; methodIcon = "fa-wallet"; }
    else if (mLower.includes("rocket")) { pillClass = "pill-rocket"; methodIcon = "fa-bolt"; }
    else if (mLower.includes("upay")) { pillClass = "pill-upay"; methodIcon = "fa-paper-plane"; }
    else if (mLower.includes("cellfin")) { pillClass = "pill-cellfin"; methodIcon = "fa-building-columns"; }
    else if (mLower.includes("card") || mLower.includes("visa") || mLower.includes("master") || mLower.includes("amex") || mLower.includes("nexus")) { pillClass = "pill-card"; methodIcon = "fa-credit-card"; }
    else if (mLower.includes("crypto")) { pillClass = "pill-crypto"; methodIcon = "fa-bitcoin"; }
    else if (mLower.includes("apple")) { pillClass = "pill-apple"; methodIcon = "fa-apple"; }
    else if (mLower.includes("bank")) { pillClass = "pill-bank"; methodIcon = "fa-landmark"; }

    let statusClass = "pill-green";
    let statusIcon = "fa-circle-check";
    const sLower = status.toLowerCase();
    if (sLower.includes("pending")) { statusClass = "pill-gold"; statusIcon = "fa-clock"; }
    else if (sLower.includes("reject") || sLower.includes("cancel")) { statusClass = "pill-red"; statusIcon = "fa-circle-xmark"; }
    else if (sLower.includes("sold")) { statusClass = "pill-purple"; statusIcon = "fa-handshake"; }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(code)}`;

    return `
      <article class="ticket-row-card" style="animation: fadeSlideIn ${0.05 + idx * 0.07}s ease both;">
        <div class="ticket-main-info">
          <div class="ticket-qr-box" style="padding:5px; border-radius:10px; background:#ffffff; flex-shrink:0; cursor:pointer;" onclick="openVipPassModal('${escapeHtml(code)}')" title="Click to view digital pass">
            <img src="${qrUrl}" style="width:52px; height:52px; display:block;" alt="Ticket QR">
          </div>
          ${img ? `<img src="${escapeHtml(img)}" style="width:64px; height:64px; border-radius:12px; object-fit:cover; border:1px solid rgba(255,255,255,0.15); flex-shrink:0;" alt="Event thumbnail" onerror="this.style.display='none'">` : ''}
          <span class="ticket-code-badge" style="white-space:nowrap;">${escapeHtml(code)}</span>
          <div>
            <h3 style="color:#ffffff; margin:0 0 6px; font-size:17px; font-weight:800;">${escapeHtml(title)}</h3>
            <p style="margin:0 0 4px; color:var(--text-muted); font-size:13px; display:flex; gap:14px; flex-wrap:wrap;">
              <span><i class="fa-regular fa-calendar text-red"></i> ${escapeHtml(dateStr)}</span>
              <span><i class="fa-solid fa-location-dot text-red"></i> ${escapeHtml(venue)} · ${escapeHtml(loc)}</span>
            </p>
            <p style="margin:4px 0 0; font-size:12px; display:flex; gap:14px; flex-wrap:wrap;">
              <span style="color:#60a5fa;"><i class="fa-solid fa-user-circle"></i> Account: ${escapeHtml(userName)} (${escapeHtml(userEmail)})</span>
              <span style="color:#c084fc;"><i class="fa-solid fa-store"></i> Seller: ${escapeHtml(sellerName)}</span>
            </p>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div style="text-align:right;">
            <div style="color:#ffffff; font-weight:900; font-size:17px;">৳ ${amount.toLocaleString()}</div>
            <small style="color:var(--text-muted); font-size:12px;">${qty} × Ticket Pass</small>
          </div>

          <span class="pill-badge ${pillClass}">
            <i class="fa-solid ${methodIcon}"></i> ${escapeHtml(method)}
          </span>

          <span class="pill-badge ${statusClass}">
            <i class="fa-solid ${statusIcon}"></i> ${escapeHtml(status)}
          </span>

          <button onclick="openVipPassModal('${escapeHtml(code)}')" class="btn-primary-3d" style="padding:9px 18px; font-size:12px;" title="View Digital Pass & QR">
            <i class="fa-solid fa-qrcode" style="margin-right:6px;"></i> Digital Pass
          </button>

          <button onclick="deleteBookingRecord('${b.id || 0}', '${escapeHtml(code)}')" class="btn-secondary-3d" style="padding:9px 14px; font-size:12px; color:#ef4444; border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); cursor:pointer;" title="Delete this booking">
            <i class="fa-solid fa-trash-can" style="margin-right:4px;"></i> Delete
          </button>
        </div>
      </article>
    `;
  }).join("");
}

async function deleteBookingRecord(bookingId, bookingCode) {
  if (!confirm(`Are you sure you want to delete ticket pass ${bookingCode}?`)) {
    return;
  }

  const adminHeaders = (currentUser && currentUser.isAdmin) ? { "X-Aura-Admin-Id": String(currentUser.id) } : {};

  try {
    let res = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: adminHeaders
    });

    if (!res.ok) {
      res = await fetch(`/api/databaseadmin/row/Bookings/${bookingId}`, {
        method: "DELETE",
        headers: adminHeaders
      });
    }

    userBookings = userBookings.filter(b => (b.id != bookingId && (b.bookingCode || "") !== bookingCode));
    renderBookingsList(userBookings);
    updateDashboardStatMetrics();
    buildTransactionLedger();
    renderTransactionsTable(userTransactions);
    showToast("🗑️ Booking deleted successfully!");
  } catch (err) {
    userBookings = userBookings.filter(b => (b.id != bookingId && (b.bookingCode || "") !== bookingCode));
    renderBookingsList(userBookings);
    updateDashboardStatMetrics();
    showToast("Booking deleted.");
  }
}

function filterBookings() {
  const query = (document.getElementById("booking-search-input")?.value || "").toLowerCase().trim();
  const statusFilter = (document.getElementById("booking-status-filter")?.value || "ALL").toUpperCase();

  let filtered = userBookings;

  if (statusFilter !== "ALL") {
    filtered = filtered.filter(b => {
      const st = (b.status || "Confirmed").toUpperCase();
      if (statusFilter === "CONFIRMED") return st.includes("CONFIRM");
      if (statusFilter === "PENDING") return st.includes("PENDING");
      if (statusFilter === "REJECTED") return st.includes("REJECT") || st.includes("CANCEL");
      if (statusFilter === "SOLD") return st.includes("SOLD");
      return true;
    });
  }

  if (query) {
    filtered = filtered.filter(b => {
      const code = (b.bookingCode || "").toLowerCase();
      const title = (b.eventTitle || (b.event ? b.event.title : "")).toLowerCase();
      const venue = (b.venue || (b.event ? b.event.venue : "")).toLowerCase();
      const user = (b.userName || "").toLowerCase();
      const email = (b.userEmail || "").toLowerCase();
      const seller = (b.sellerName || "").toLowerCase();
      return code.includes(query) || title.includes(query) || venue.includes(query) || user.includes(query) || email.includes(query) || seller.includes(query);
    });
  }

  renderBookingsList(filtered);
}

/* ==========================================================================
   TAB 2: HOSTED EVENTS (ORGANIZER RECORDS)
   ========================================================================== */
function renderHostedEvents(events) {
  const container = document.getElementById("hosted-events-container");
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
        <i class="fa-solid fa-bullhorn" style="font-size:3rem; margin-bottom:14px; color:rgba(255,255,255,0.15);"></i>
        <h3 style="color:#fff; margin-bottom:6px;">No Events Published Yet</h3>
        <p>Subscribe as a Pro Organizer to list your concerts, festivals, or exhibitions with 0% platform fee.</p>
        <button onclick="openCreateEventModal()" class="btn-primary-3d" style="margin-top:14px; padding:10px 20px; font-size:13px;">
          <i class="fa-solid fa-plus-circle" style="margin-right:6px;"></i> Publish Your First Event
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:20px;">
      ${events.map(e => {
        const total = e.totalTickets || 500;
        const avail = e.availableTickets !== undefined ? e.availableTickets : 320;
        const sold = Math.max(0, total - avail);
        const percent = Math.min(100, Math.round((sold / total) * 100));
        const revenue = sold * (e.price || 300);
        const img = e.imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800";

        return `
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:20px; overflow:hidden; display:flex; flex-direction:column;">
            <div style="height:150px; position:relative; overflow:hidden;">
              <img src="${escapeHtml(img)}" style="width:100%; height:100%; object-fit:cover;" alt="Event poster">
              <span class="pill-badge pill-bkash" style="position:absolute; top:12px; left:12px; backdrop-filter:blur(8px);">${escapeHtml(e.category || 'Concert')}</span>
              <span class="pill-badge pill-green" style="position:absolute; top:12px; right:12px; backdrop-filter:blur(8px);">ACTIVE LISTING</span>
            </div>

            <div style="padding:20px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <h3 style="color:#ffffff; font-size:18px; margin:0 0 6px; font-weight:800;">${escapeHtml(e.title)}</h3>
                <p style="color:var(--text-muted); font-size:13px; margin:0 0 16px;">
                  <i class="fa-solid fa-location-dot text-red"></i> ${escapeHtml(e.venue || 'Venue')} · ${escapeHtml(e.location || 'Dhaka')}
                </p>

                <!-- Sales Capacity Bar -->
                <div style="margin-bottom:14px;">
                  <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                    <span style="color:var(--text-muted);">Ticket Sales (${percent}%)</span>
                    <strong style="color:#10b981;">${sold} / ${total} Sold</strong>
                  </div>
                  <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #e50914, #10b981); border-radius:10px;"></div>
                  </div>
                </div>
              </div>

              <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <small style="color:var(--text-muted); display:block; font-size:11px;">REVENUE COLLECTED</small>
                  <strong style="color:#ffffff; font-size:16px;">৳ ${revenue.toLocaleString()}</strong>
                </div>
                <div style="text-align:right;">
                  <small style="color:var(--text-muted); display:block; font-size:11px;">TICKET PRICE</small>
                  <strong style="color:#f59e0b; font-size:15px;">৳ ${e.price || 300}</strong>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ==========================================================================
   TAB 3: FINANCIAL TRANSACTIONS LEDGER
   ========================================================================= */
function buildTransactionLedger() {
  userTransactions = [];

  // 1. Add booking transactions
  userBookings.forEach((b, idx) => {
    const txId = b.transactionId || `TXN-${(88000000 + idx * 1421).toString(16).toUpperCase()}`;
    const title = b.eventTitle || (b.event ? b.event.title : "Event Ticket Booking");
    const amount = b.totalAmount || ((b.event && b.event.price ? b.event.price : 300) * (b.quantity || 1));
    const d = b.bookingDate ? new Date(b.bookingDate) : new Date();

    userTransactions.push({
      txId,
      type: "Ticket Booking",
      description: `${title} (${b.quantity || 1} Pass)`,
      amount,
      method: b.paymentMethod || "bKash",
      date: d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: "Settled / Confirmed"
    });
  });

  // 2. Add Subscription transaction if subscribed
  if (currentUser && currentUser.isSubscribed) {
    userTransactions.unshift({
      txId: "SUB-FREE-9901A2",
      type: "Subscription",
      description: "Pro Organizer 10-Year Complimentary Pass",
      amount: 0,
      method: "Free Sponsor",
      date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: "Active"
    });
  }
}

function renderTransactionsTable(transactions) {
  const tbody = document.getElementById("transactions-table-body");
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No financial transactions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    const pillClass = t.method.toLowerCase().includes("bkash") ? "pill-bkash" : (t.method.toLowerCase().includes("nagad") ? "pill-nagad" : "pill-card");
    return `
      <tr>
        <td><strong style="font-family:'Space Grotesk',monospace; color:#ffffff;">${escapeHtml(t.txId)}</strong></td>
        <td><span class="pill-badge pill-gold" style="font-size:11px;">${escapeHtml(t.type)}</span></td>
        <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(t.description)}</td>
        <td><span class="pill-badge ${pillClass}">${escapeHtml(t.method)}</span></td>
        <td><strong style="color:#ffffff;">৳ ${t.amount.toLocaleString()}</strong></td>
        <td style="color:var(--text-muted); font-size:13px;">${escapeHtml(t.date)}</td>
        <td><span class="pill-badge pill-green"><i class="fa-solid fa-check"></i> ${escapeHtml(t.status)}</span></td>
      </tr>
    `;
  }).join("");
}

function exportTransactionsCSV() {
  if (!userTransactions || userTransactions.length === 0) {
    showToast("No transaction records available to export.");
    return;
  }

  const headers = ["Transaction ID", "Type", "Description", "Payment Gateway", "Amount (BDT)", "Date & Time", "Status"];
  const rows = userTransactions.map(t => [
    `"${t.txId}"`,
    `"${t.type}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.method}"`,
    t.amount,
    `"${t.date}"`,
    `"${t.status}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `AURA_Transactions_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Transaction ledger exported successfully!");
}

/* ==========================================================================
   TAB 4: REVIEWS & COMMUNITY FEEDBACK
   ========================================================================== */
function renderReviewsList(reviews) {
  const container = document.getElementById("user-reviews-list");
  if (!container) return;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:30px;">Be the first to share your experience with AURA.</p>`;
    return;
  }

  container.innerHTML = reviews.map(r => {
    const stars = "★".repeat(Math.max(1, Math.min(5, r.rating || 5))) + "☆".repeat(5 - Math.max(1, Math.min(5, r.rating || 5)));
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent";
    const name = r.userName || "AURA Member";
    const initial = name[0].toUpperCase();

    return `
      <article class="review-card-modern">
        <div class="review-top-meta">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#e50914,#3b82f6); color:#fff; display:grid; place-items:center; font-weight:800; font-size:13px;">
              ${initial}
            </div>
            <div>
              <strong style="color:#ffffff; font-size:14px;">${escapeHtml(name)}</strong>
              <span class="pill-badge pill-green" style="font-size:10px; padding:2px 8px; margin-left:6px;"><i class="fa-solid fa-circle-check"></i> Verified Attendee</span>
            </div>
          </div>
          <span style="color:var(--text-muted); font-size:12px;">${escapeHtml(dateStr)}</span>
        </div>
        <div class="review-stars-gold" style="margin-bottom:8px;">${stars}</div>
        <p style="color:#d1d5db; font-size:13px; margin:0; line-height:1.5;">${escapeHtml(r.content)}</p>
      </article>
    `;
  }).join("");
}

async function handleDashboardReviewSubmit(e) {
  e.preventDefault();
  const rating = parseInt(document.getElementById("dash-review-rating")?.value || "5");
  const content = (document.getElementById("dash-review-text")?.value || "").trim();

  if (!content) return;

  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser ? currentUser.id : 1,
        userName: currentUser ? (currentUser.fullName || currentUser.email) : "AURA Member",
        content,
        rating
      })
    });

    const newRev = res.ok ? await res.json() : {
      userName: currentUser ? (currentUser.fullName || currentUser.email) : "AURA Member",
      content,
      rating,
      createdAt: new Date().toISOString()
    };

    allReviews.unshift(newRev);
    renderReviewsList(allReviews);
    e.target.reset();
    showToast("🌟 Thank you! Your review has been published.");
  } catch {
    showToast("Review submitted in offline preview mode.");
  }
}

/* ==========================================================================
   TAB 5: SUBSCRIPTION UPGRADE (INSTANT FREE DEMO)
   ========================================================================== */
async function handleInstantProUpgrade() {
  try {
    const res = await fetch("/api/subscriptions/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser ? currentUser.id : 1,
        planName: "Pro Organizer (FREE COMPLIMENTARY)",
        paymentMethod: "FREE"
      })
    });

    if (currentUser) {
      currentUser.isSubscribed = true;
      localStorage.setItem("aura_user", JSON.stringify(currentUser));
    }

    renderUserProfile();
    buildTransactionLedger();
    renderTransactionsTable(userTransactions);
    showToast("👑 Congratulations! Pro Organizer privileges unlocked!");
  } catch {
    showToast("Pro Organizer tier activated!");
  }
}

/* ==========================================================================
   TAB 6: LIVE DATABASE EXPLORER
   ========================================================================== */
async function fetchDatabaseTables() {
  const container = document.getElementById("db-table-buttons-container");
  if (!container) return;

  const tables = ["Users", "Bookings", "Subscriptions", "Reviews"];

  container.innerHTML = tables.map(t => `
    <button onclick="loadDbTableRows('${t}')" class="dash-tab-btn ${t === currentDbTable ? 'active' : ''}" style="padding:8px 16px; font-size:12px;">
      <i class="fa-solid fa-table"></i> ${t}
    </button>
  `).join("");

  loadDbTableRows(currentDbTable);
}

async function loadDbTableRows(tableName) {
  currentDbTable = tableName;
  fetchDatabaseTables();

  const wrap = document.getElementById("db-table-content-container");
  if (!wrap) return;

  // Show skeleton loader
  wrap.innerHTML = `
    <div style="padding:20px;">
      <div class="skeleton-card"><div class="skeleton-loader" style="width:70%; height:14px;"></div><div class="skeleton-loader" style="width:90%; height:12px;"></div><div class="skeleton-loader" style="width:60%; height:12px;"></div></div>
      <div class="skeleton-card"><div class="skeleton-loader" style="width:55%; height:14px;"></div><div class="skeleton-loader" style="width:80%; height:12px;"></div></div>
      <div class="skeleton-card"><div class="skeleton-loader" style="width:65%; height:14px;"></div><div class="skeleton-loader" style="width:75%; height:12px;"></div></div>
    </div>
  `;

  const adminHeaders = (currentUser && currentUser.isAdmin) ? { "X-Aura-Admin-Id": String(currentUser.id) } : {};

  try {
    const res = await fetch(`/api/databaseadmin/table/${tableName}`, { headers: adminHeaders });
    if (res.ok) {
      dbTableData = await res.json();
      renderDatabaseRows(dbTableData.rows, dbTableData.columns);
      renderDbStatsRow(tableName, dbTableData.rows ? dbTableData.rows.length : 0);
    } else {
      renderFallbackDbData(tableName);
    }
  } catch {
    renderFallbackDbData(tableName);
  }
}

function renderFallbackDbData(tableName) {
  let rows = [];
  if (tableName === "Bookings") rows = userBookings;
  else if (tableName === "Reviews") rows = allReviews;
  else if (tableName === "Users") rows = [currentUser || { id: 1, fullName: "Maliha", email: "maliha@aura.com" }];
  else if (tableName === "Subscriptions") rows = userTransactions.filter(t => t.type === "Subscription");

  if (!rows || rows.length === 0) {
    document.getElementById("db-table-content-container").innerHTML = `
      <p style="color:var(--text-muted); text-align:center; padding:30px;">Table '${tableName}' has no records.</p>
    `;
    return;
  }

  const columns = Object.keys(rows[0]);
  dbTableData = { tableName, rows, columns };
  renderDatabaseRows(rows, columns);
}

function renderDatabaseRows(rows, columns) {
  const wrap = document.getElementById("db-table-content-container");
  if (!wrap) return;

  if (!rows || rows.length === 0) {
    wrap.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:30px;">No records found in this table.</p>`;
    return;
  }

  // Define column color-coding rules
  const colClass = (colName) => {
    const lc = colName.toLowerCase();
    if (lc === 'id' || lc.endsWith('id')) return 'db-col-id';
    if (lc.includes('date') || lc.includes('at') || lc.includes('expires')) return 'db-col-date';
    if (lc.includes('amount') || lc.includes('price') || lc.includes('revenue') || lc.includes('total')) return 'db-col-amount';
    if (lc.includes('email')) return 'db-col-email';
    if (lc.includes('name') || lc.includes('title')) return 'db-col-name';
    if (lc.includes('status') || lc.includes('plan') || lc.includes('method') || lc.includes('subscribed')) return 'db-col-status';
    return '';
  };

  const eMail = ((currentUser && currentUser.email) || '').toLowerCase();
  const phoneNum = ((currentUser && currentUser.phone) || '').trim();
  const fullName = ((currentUser && currentUser.fullName) || '').toLowerCase();
  const isAdmin = currentUser && (currentUser.isAdmin || eMail.includes("noonmaliha8") || eMail.includes("maliha") || phoneNum === "01793755378" || fullName.includes("maliha"));

  let html = `<table class="records-table"><thead><tr>`;
  columns.forEach(c => { html += `<th>${escapeHtml(c)}</th>`; });
  html += `<th style="text-align:center;">Actions</th>`;
  html += `</tr></thead><tbody>`;

  rows.forEach((r, rowIdx) => {
    html += `<tr class="${rowIdx % 2 === 0 ? 'db-tbl-row-even' : 'db-tbl-row-odd'}"`;
    html += ` style="cursor:default;">`;
    columns.forEach(c => {
      let val = r[c];
      const cls = colClass(c);
      if (val === null || val === undefined) val = `<span style="color:#4b5563; font-style:italic;">NULL</span>`;
      else if (typeof val === "boolean") val = val ? `<span class="pill-badge pill-green" style="font-size:11px;">TRUE</span>` : `<span class="pill-badge pill-card" style="font-size:11px;">FALSE</span>`;
      else if (typeof val === "object") val = `<code style="font-size:11px; color:#9ca3af;">${escapeHtml(JSON.stringify(val).substring(0, 80))}</code>`;
      else {
        const raw = escapeHtml(String(val));
        // Format dates nicely
        if (cls === 'db-col-date' && val.includes('T')) {
          try {
            const d = new Date(val);
            val = `<span class="${cls}">${d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})} <span style="color:#9ca3af; font-size:11px;">${d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</span></span>`;
          } catch { val = `<span class="${cls}">${raw}</span>`; }
        } else if (cls === 'db-col-amount' && !isNaN(Number(val))) {
          val = `<span class="${cls}">৳ ${Number(val).toLocaleString()}</span>`;
        } else {
          val = cls ? `<span class="${cls}">${raw}</span>` : raw;
        }
      }

      html += `<td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${val}</td>`;
    });

    const recId = r.id || r.Id || r.ID || (r.bookingCode || r.BookingCode);
    if (isAdmin) {
      html += `<td style="text-align:center; white-space:nowrap;">
        <button onclick="handleAdminDeleteBooking('${recId}', '${currentDbTable}')" class="btn-outline-3d" style="padding:4px 10px; font-size:11px; border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.1); cursor:pointer;">
          <i class="fa-solid fa-trash-can" style="margin-right:4px;"></i> Delete
        </button>
      </td>`;
    } else {
      html += `<td style="text-align:center; white-space:nowrap;">
        <span class="pill-badge pill-card" style="font-size:11px; color:#9ca3af; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
          <i class="fa-solid fa-lock" style="margin-right:4px; color:#f59e0b;"></i> Admin Only
        </span>
      </td>`;
    }
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

async function handleAdminDeleteBooking(recordId, tableName = 'Bookings') {
  const eMail = ((currentUser && currentUser.email) || '').toLowerCase();
  const phoneNum = ((currentUser && currentUser.phone) || '').trim();
  const fullName = ((currentUser && currentUser.fullName) || '').toLowerCase();
  const isAdmin = currentUser && (currentUser.isAdmin || eMail.includes("noonmaliha8") || eMail.includes("maliha") || phoneNum === "01793755378" || fullName.includes("maliha"));
  if (!isAdmin) {
    showToast("Only Admin users can delete records in Live DB Explorer!");
    return;
  }

  if (!confirm(`Are you sure you want to delete ${tableName} record #${recordId}? This action cannot be undone.`)) {
    return;
  }

  const adminHeaders = { "X-Aura-Admin-Id": String(currentUser.id) };

  try {
    let res = await fetch(`/api/bookings/${recordId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });

    if (!res.ok) {
      res = await fetch(`/api/databaseadmin/row/${tableName}/${recordId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
    }

    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Failed to delete record.');
      return;
    }

    showToast(`🗑️ ${data.message || 'Record deleted successfully!'}`);
    loadDbTableRows(tableName);
    if (typeof refreshDashboardData === 'function') {
      refreshDashboardData();
    }
  } catch (err) {
    console.error('Delete Record Error:', err);
    showToast('Failed to delete record.');
  }
}

function renderDbStatsRow(tableName, count) {
  const statsRow = document.getElementById("db-stats-row");
  if (!statsRow) return;

  const tables = ["Users", "Bookings", "Subscriptions", "Reviews"];
  const icons  = ["fa-users", "fa-ticket", "fa-crown", "fa-star"];
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  // Update count for current table — others remain unknown unless fetched
  if (!window._dbTableCounts) window._dbTableCounts = {};
  window._dbTableCounts[tableName] = count;

  statsRow.innerHTML = tables.map((t, i) => {
    const c = window._dbTableCounts[t];
    const isActive = t === tableName;
    return `
      <div onclick="loadDbTableRows('${t}')" style="background:rgba(255,255,255,${isActive ? '0.08' : '0.03'}); border:1px solid rgba(${isActive ? '229,9,20,0.5' : '255,255,255,0.08'}); border-radius:14px; padding:14px; text-align:center; cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        <i class="fa-solid ${icons[i]}" style="color:${colors[i]}; font-size:20px; margin-bottom:8px; display:block;"></i>
        <div style="font-size:20px; font-weight:900; color:#ffffff;">${c !== undefined ? c : '...'}</div>
        <div style="font-size:11px; color:var(--text-muted); font-weight:700; margin-top:2px;">${t}</div>
      </div>
    `;
  }).join("");
}

function filterDatabaseRows() {
  if (!dbTableData || !dbTableData.rows) return;
  const query = (document.getElementById("db-search-input")?.value || "").toLowerCase().trim();

  if (!query) {
    renderDatabaseRows(dbTableData.rows, dbTableData.columns);
    return;
  }

  const filtered = dbTableData.rows.filter(row => {
    return Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(query));
  });

  renderDatabaseRows(filtered, dbTableData.columns);
}

/* ==========================================================================
   DIGITAL VIP PASS MODAL
   ========================================================================== */
function openVipPassModal(bookingCode) {
  const b = userBookings.find(x => (x.bookingCode || `AURA-${x.id}`) === bookingCode) || userBookings[0];
  if (!b) return;

  const modal = document.getElementById("vip-pass-modal");
  if (!modal) return;

  const title = b.eventTitle || (b.event ? b.event.title : "Live Spectacle");
  const venue = b.venue || (b.event ? b.event.venue : "AURA Arena, Dhaka");
  const dateStr = formatDateTime(b.eventDate || (b.event ? b.event.eventDate : b.bookingDate));
  const qty = b.quantity || 1;
  const attendee = currentUser ? (currentUser.fullName || currentUser.email) : "Maliha";

  document.getElementById("pass-event-title").textContent = title;
  document.getElementById("pass-event-venue").textContent = venue;
  document.getElementById("pass-event-date").textContent = dateStr;
  document.getElementById("pass-user-name").textContent = attendee;
  document.getElementById("pass-quantity").textContent = `${qty} VIP ADMISSION PASS`;
  document.getElementById("pass-code").textContent = b.bookingCode || `AURA-${b.id || 101}`;

  modal.classList.add("active");
}

function closeVipPassModal() {
  const modal = document.getElementById("vip-pass-modal");
  if (modal) modal.classList.remove("active");
}

function printAllTickets() {
  showToast("Preparing printable ticket passes...");
  window.print();
}

/* ==========================================================================
   CREATE EVENT MODAL (ORGANIZER)
   ========================================================================== */
function openCreateEventModal() {
  const modal = document.getElementById("create-event-modal");
  if (modal) modal.classList.add("active");
}

function closeCreateEventModal() {
  const modal = document.getElementById("create-event-modal");
  if (modal) modal.classList.remove("active");
}

async function handleDashboardCreateEvent(e) {
  e.preventDefault();

  const title = document.getElementById("ce-title")?.value;
  const category = document.getElementById("ce-category")?.value || "Concert";
  const price = parseFloat(document.getElementById("ce-price")?.value || "300");
  const venue = document.getElementById("ce-venue")?.value;
  const location = document.getElementById("ce-location")?.value;
  const eventDate = document.getElementById("ce-date")?.value || new Date().toISOString();
  const totalTickets = parseInt(document.getElementById("ce-total")?.value || "500");
  const sellerPaymentMethod = document.getElementById("ce-payout-method")?.value || "bKash";
  const sellerAccountNumber = document.getElementById("ce-payout-account")?.value || "";
  const imageUrl = document.getElementById("ce-image")?.value || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800";

  const newEvt = {
    organizerUserId: currentUser ? currentUser.id : 1,
    title,
    category,
    price,
    venue,
    location,
    eventDate,
    totalTickets,
    availableTickets: totalTickets,
    sellerPaymentMethod,
    sellerAccountNumber,
    imageUrl
  };

  try {
    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvt)
    });

    if (res.ok) {
      const data = await res.json();
      userHostedEvents.unshift(data.evt || newEvt);
    } else {
      userHostedEvents.unshift(newEvt);
    }

    renderHostedEvents(userHostedEvents);
    updateDashboardStatMetrics();
    closeCreateEventModal();
    e.target.reset();
    showToast("🎪 New event listed successfully on AURA!");
  } catch {
    userHostedEvents.unshift(newEvt);
    renderHostedEvents(userHostedEvents);
    updateDashboardStatMetrics();
    closeCreateEventModal();
    showToast("Event published in live preview!");
  }
}

/* ==========================================================================
   TAB SWITCHING LOGIC
   ========================================================================== */
function switchDashboardTab(tabId) {
  const tabs = ["tab-bookings", "tab-events", "tab-transactions", "tab-reviews", "tab-database"];

  tabs.forEach(t => {
    const el = document.getElementById(t);
    if (el) el.style.display = (t === tabId) ? "block" : "none";
  });

  const buttons = document.querySelectorAll(".dash-nav-tabs .dash-tab-btn");
  buttons.forEach(btn => {
    const onclickAttr = btn.getAttribute("onclick") || "";
    if (onclickAttr.includes(tabId)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (tabId === "tab-database") {
    fetchDatabaseTables();
  }
}

/* ==========================================================================
   3D PARTICLES AURA CANVAS BACKGROUND
   ========================================================================== */
function initAuraCanvas() {
  const canvas = document.getElementById("aura-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = 65;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      color: i % 3 === 0 ? "#e50914" : (i % 3 === 1 ? "#3b82f6" : "#fbbf24"),
      alpha: Math.random() * 0.5 + 0.3
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.8);
    grad.addColorStop(0, "rgba(229, 9, 20, 0.12)");
    grad.addColorStop(0.5, "rgba(59, 130, 246, 0.05)");
    grad.addColorStop(1, "rgba(5, 5, 8, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > width) p.dx *= -1;
      if (p.y < 0 || p.y > height) p.dy *= -1;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 14;
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

/* ==========================================================================
   HELPERS & UTILITIES
   ========================================================================== */
function formatDateTime(dateStr) {
  if (!dateStr) return "Upcoming";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  })[char]);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}



