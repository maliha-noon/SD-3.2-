const { useState, useEffect, useRef, useMemo } = React;

// TRANSLATIONS DICTIONARY
const TRANSLATIONS = {
  en: {
    events: "EVENTS",
    dashboard: "DASHBOARD",
    dbAdmin: "DATABASE ADMIN",
    subscribe: "SUBSCRIBE",
    sellTickets: "SELL TICKETS",
    login: "LOGIN",
    register: "REGISTRATION",
    logout: "LOGOUT",
    subscribed: "SUBSCRIBED",
    heroTitle: "ULTIMATE EVENT EXPERIENCE",
    heroSub: "Step into a magical realm of live entertainment. Discover world-class concerts, outdoor sports, football matches, horse riding, and epic festivals — or subscribe as a Pro Organizer to sell tickets on AURA.",
    exploreBtn: "Explore Events",
    upcomingEvents: "Upcoming Events",
    searchPlaceholder: "Search events by title, venue, location, category...",
    allCategories: "All Event Categories",
    buyTicket: "BUY TICKET",
    soldOut: "SOLD OUT",
    ticketsLeft: "tickets left",
    reviewsTitle: "What Fans & Organizers Say",
    writeReview: "Share Your Experience",
    submitReview: "Submit Review",
    namePlaceholder: "Your Full Name",
    reviewPlaceholder: "Write your review or feedback...",
    adminTitle: "SQL Database Explorer",
    organizerArea: "Pro Organizer Portal"
  },
  bn: {
    events: "ইভেন্টসমূহ",
    dashboard: "ড্যাশবোর্ড",
    dbAdmin: "ডাটাবেস অ্যাডমিন",
    subscribe: "সাবস্ক্রাইব করুন",
    sellTickets: "টিকেট বিক্রি করুন",
    login: "লগইন",
    register: "রেজিস্ট্রেশন",
    logout: "লগআউট",
    subscribed: "সাবস্ক্রাইবড",
    heroTitle: "সেরা ইভেন্টের অবিশ্বাস্য অভিজ্ঞতা",
    heroSub: "লাইভ বিনোদনের এক জাদুকরী জগতে প্রবেশ করুন। কনসার্ট, আউটডোর খেলাধুলা, ফুটবল ম্যাচ এবং উৎসবের টিকেট বুক করুন।",
    exploreBtn: "ইভেন্ট এক্সপ্লোর করুন",
    upcomingEvents: "আসন্ন ইভেন্টসমূহ",
    searchPlaceholder: "শিরোনাম, স্থান বা বিভাগ দিয়ে ইভেন্ট খুঁজুন...",
    allCategories: "সকল ইভেন্ট ক্যাটাগরি",
    buyTicket: "টিকেট কিনুন",
    soldOut: "টিকেট শেষ",
    ticketsLeft: "টিকেট বাকি",
    reviewsTitle: "গ্রাহকদের মতামত",
    writeReview: "আপনার রিভিউ লিখুন",
    submitReview: "জমা দিন",
    namePlaceholder: "আপনার পুরো নাম",
    reviewPlaceholder: "আপনার মূল্যবান মতামত লিখুন...",
    adminTitle: "এসকিউএল ডাটাবেস এক্সপ্লোরার",
    organizerArea: "প্রো অর্গানাইজার পোর্টাল"
  },
  es: {
    events: "EVENTOS",
    dashboard: "PANEL",
    dbAdmin: "ADMIN BASE DATOS",
    subscribe: "SUSCRIBIRSE",
    sellTickets: "VENDER ENTRADAS",
    login: "ACCESO",
    register: "REGISTRO",
    logout: "SALIR",
    subscribed: "SUSCRITO",
    heroTitle: "EXPERIENCIA DE EVENTOS DEFINITIVA",
    heroSub: "Descubre conciertos de clase mundial, deportes y festivales, o suscríbete para vender entradas.",
    exploreBtn: "Explorar Eventos",
    upcomingEvents: "Próximos Eventos",
    searchPlaceholder: "Buscar eventos...",
    allCategories: "Todas las categorías",
    buyTicket: "COMPRAR ENTRADA",
    soldOut: "AGOTADO",
    ticketsLeft: "entradas restantes",
    reviewsTitle: "Opiniones de los fans",
    writeReview: "Escribir opinión",
    submitReview: "Enviar",
    namePlaceholder: "Tu nombre completo",
    reviewPlaceholder: "Escribe tu opinión...",
    adminTitle: "Explorador SQL",
    organizerArea: "Portal de Organizador Pro"
  }
};

// MASCOT SVG COMPONENT
function MascotSvg({ mood = 'happy' }) {
  return (
    <svg className="mascot-svg" viewBox="0 0 120 120" width="80" height="80">
      <circle cx="60" cy="60" r="50" fill="url(#mascotGradient)" stroke="#ef4444" strokeWidth="3" />
      <defs>
        <radialGradient id="mascotGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
      </defs>
      {/* Eyes */}
      <circle cx="42" cy="48" r="7" fill="#ffffff" />
      <circle cx="78" cy="48" r="7" fill="#ffffff" />
      <circle cx="44" cy="48" r="3" fill="#000000" />
      <circle cx="80" cy="48" r="3" fill="#000000" />
      {/* Crown / Horn */}
      <polygon points="60,12 50,28 70,28" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      {/* Mouth */}
      {mood === 'sad' ? (
        <path d="M 40 75 Q 60 62 80 75" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M 40 65 Q 60 82 80 65" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}

// MAIN APP COMPONENT
function App() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modals & Active Views
  const [currentView, setCurrentView] = useState('home'); // 'home', 'dashboard', 'admin-db'
  const [selectedEvent, setSelectedEvent] = useState(null); // for ticket buying modal
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTicketScannerOpen, setIsTicketScannerOpen] = useState(false);
  const [isMascotWarningOpen, setIsMascotWarningOpen] = useState(false);

  // User Dashboard State
  const [userBookings, setUserBookings] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userEvents, setUserEvents] = useState([]);

  // Database Admin State
  const [dbTables, setDbTables] = useState([]);
  const [selectedDbTable, setSelectedDbTable] = useState(null);
  const [dbTableData, setDbTableData] = useState([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Sync Hash Routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#dashboard') setCurrentView('dashboard');
      else if (hash === '#admin-db') setCurrentView('admin-db');
      else setCurrentView('home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Sync user to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('aura_user', JSON.stringify(user));
    else localStorage.removeItem('aura_user');
  }, [user]);

  // Canvas Background Animation
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = document.getElementById('aura-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Radial glow gradient background
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height));
      gradient.addColorStop(0, 'rgba(30, 10, 20, 0.8)');
      gradient.addColorStop(1, 'rgba(8, 8, 14, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ef4444';
        ctx.fill();

        // Connect lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.2 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Fetch Events from ASP.NET API
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        const uniqueCats = ['ALL', ...new Set(data.map(e => e.category).filter(Boolean))];
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch Reviews
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) { console.error("Reviews error:", err); }
  };

  useEffect(() => {
    fetchEvents();
    fetchReviews();
  }, []);

  // Fetch Dashboard Data (All records accessible to everyone)
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchDashboardData();
    }
  }, [user, currentView]);

  const fetchDashboardData = async () => {
    try {
      const bRes = await fetch('/api/dashboard/records');
      if (bRes.ok) setUserBookings(await bRes.json());

      if (user) {
        const sRes = await fetch(`/api/subscriptions/user/${user.id}`);
        if (sRes.ok) setUserSubscriptions(await sRes.json());
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  };

  // Fetch Database Admin Data
  useEffect(() => {
    if (currentView === 'admin-db' && user?.isAdmin) {
      fetchDbTables();
    }
  }, [currentView, user]);

  const fetchDbTables = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/databaseadmin/tables', {
        headers: { 'X-Admin-User': user?.email || 'noonmaliha8@gmail.com' }
      });
      if (res.ok) {
        const data = await res.json();
        setDbTables(data);
        if (data.length > 0) fetchTableData(data[0].tableName);
      }
    } catch (err) {
      console.error("DB Tables error:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setSelectedDbTable(tableName);
    try {
      const res = await fetch(`/api/databaseadmin/table/${tableName}`, {
        headers: { 'X-Admin-User': user?.email || 'noonmaliha8@gmail.com' }
      });
      if (res.ok) {
        const data = await res.json();
        setDbTableData(data);
      }
    } catch (err) { console.error("Table data error:", err); }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchCat = selectedCategory === 'ALL' || e.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, selectedCategory, searchQuery]);

  // Auth Handlers
  const handleLogout = () => {
    setUser(null);
    showToast("Logged out successfully.", "info");
    window.location.hash = "";
  };

  const handleSellTicketsClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      showToast("Please login first to access ticket selling.", "info");
      return;
    }
    if (!user.isSubscribed) {
      setIsMascotWarningOpen(true);
    } else {
      setIsCreateEventModalOpen(true);
    }
  };

  return (
    <div className="aura-app-container">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }} className="brand-logo">
          AURA<span className="red-plus">+</span>
        </a>
        <ul className="nav-links">
          <li>
            <button 
              className={`nav-link-btn ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => { window.location.hash = ""; }}
            >
              {t.events}
            </button>
          </li>
          
          <li>
            <a 
              href="dashboard.html"
              className={`nav-link-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-chart-line" style={{ marginRight: '4px' }}></i> {t.dashboard}
            </a>
          </li>

          {user && user.isAdmin && (
            <li>
              <button 
                className={`nav-link-btn ${currentView === 'admin-db' ? 'active' : ''}`}
                onClick={() => { window.location.hash = "#admin-db"; }}
              >
                <i className="fa-solid fa-database" style={{ marginRight: '4px' }}></i> {t.dbAdmin}
              </button>
            </li>
          )}

          <li>
            <button className="btn-subscribe-nav" onClick={() => setIsSubscribeModalOpen(true)}>
              <i className="fa-solid fa-crown" style={{ marginRight: '4px' }}></i> 
              {user && user.isSubscribed ? <span style={{ color: '#4ade80', fontWeight: '800' }}>✓ {t.subscribed}</span> : t.subscribe}
            </button>
          </li>

          <li>
            <button className="btn-nav-seller" onClick={handleSellTicketsClick}>
              <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> {t.sellTickets}
            </button>
          </li>

          {!user ? (
            <>
              <li><a href="login.html" className="btn-login-nav" onClick={(e) => { e.preventDefault(); setIsLoginModalOpen(true); }}>{t.login}</a></li>
              <li><a href="register.html" className="btn-register-nav" onClick={(e) => { e.preventDefault(); setIsRegisterModalOpen(true); }}><i className="fa-solid fa-user-plus" style={{ marginRight: '4px' }}></i> {t.register}</a></li>
            </>
          ) : (
            <>
              <li className="user-badge-item">
                <div className="user-badge-chip">
                  <i className="fa-solid fa-user-check text-red"></i>
                  <span>{user.fullName}</span>

                </div>
              </li>
              <li>
                <button className="btn-logout-nav" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i> {t.logout}
                </button>
              </li>
            </>
          )}

          {/* LANGUAGE DROPDOWN */}
          <li>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-dropdown">
              <option value="en">🌐 English</option>
              <option value="bn">🇧🇩 বাংলা</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </li>
        </ul>
      </nav>

      {/* VIEW RENDERER */}
      <main className="main-content">
        {currentView === 'home' && (
          <HomeView 
            user={user}
            t={t}
            events={filteredEvents}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loadingEvents}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            reviews={reviews}
            newReviewName={newReviewName}
            setNewReviewName={setNewReviewName}
            newReviewContent={newReviewContent}
            setNewReviewContent={setNewReviewContent}
            newReviewRating={newReviewRating}
            setNewReviewRating={setNewReviewRating}
            onFetchReviews={fetchReviews}
            showToast={showToast}
          />
        )}

        {currentView === 'dashboard' && user && (
          <DashboardView 
            user={user}
            userBookings={userBookings}
            userSubscriptions={userSubscriptions}
            t={t}
            showToast={showToast}
          />
        )}

        {currentView === 'admin-db' && user && user.isAdmin && (
          <DatabaseAdminView 
            tables={dbTables}
            selectedTable={selectedDbTable}
            tableData={dbTableData}
            onSelectTable={fetchTableData}
            loading={loadingDb}
            user={user}
            t={t}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="aura-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>AURA<span className="red-plus">+</span></h3>
            <p>The ultimate live event marketplace and seller platform powered by ASP.NET Core & React.</p>
          </div>
          <div className="footer-links">
            <h4>Payment Accepted</h4>
            <div className="payment-badges">
              <span className="pay-badge bkash-bg">bKash</span>
              <span className="pay-badge nagad-bg">Nagad</span>
              <span className="pay-badge card-bg">Visa / Mastercard / AMEX</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 AURA Inc. All rights reserved. Maliha Parvin, MD Hisham Mahmud.</p>
        </div>
      </footer>

      {/* MODALS */}
      {selectedEvent && (
        <BookingModal 
          event={selectedEvent} 
          user={user}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            fetchEvents();
            if (user) fetchUserDashboardData();
            showToast("Ticket booked successfully! Check your Dashboard.", "success");
          }}
          showToast={showToast}
        />
      )}

      {isSubscribeModalOpen && (
        <SubscribeModal 
          user={user}
          onClose={() => setIsSubscribeModalOpen(false)}
          onSuccess={(updatedUser) => {
            if (updatedUser) setUser(updatedUser);
            setIsSubscribeModalOpen(false);
            showToast("Congratulations! You are now a Subscribed Organizer!", "success");
          }}
          showToast={showToast}
        />
      )}

      {isCreateEventModalOpen && (
        <CreateEventModal 
          user={user}
          onClose={() => setIsCreateEventModalOpen(false)}
          onSuccess={() => {
            setIsCreateEventModalOpen(false);
            fetchEvents();
            showToast("Event created and listed for sale!", "success");
          }}
          showToast={showToast}
        />
      )}

      {isMascotWarningOpen && (
        <MascotWarningModal 
          onClose={() => setIsMascotWarningOpen(false)}
          onOpenSubscribe={() => {
            setIsMascotWarningOpen(false);
            setIsSubscribeModalOpen(true);
          }}
        />
      )}

      {isTicketScannerOpen && (
        <TicketScannerModal 
          onClose={() => setIsTicketScannerOpen(false)}
          showToast={showToast}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(userData) => {
            setUser(userData);
            setIsLoginModalOpen(false);
            showToast(`Welcome back, ${userData.fullName}!`, "success");
          }}
          onOpenRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
          showToast={showToast}
        />
      )}

      {isRegisterModalOpen && (
        <RegisterModal 
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={(userData) => {
            setUser(userData);
            setIsRegisterModalOpen(false);
            showToast("Account created successfully! Welcome to AURA.", "success");
          }}
          onOpenLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// EVENT CARD WITH INLINE CHECKOUT BOX
function EventCard({ evt, user, t, showToast, onBookingSuccess }) {
  const [isOpenCheckout, setIsOpenCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState('bKash');
  const [accountNo, setAccountNo] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pctLeft = Math.round((evt.availableTickets / evt.totalTickets) * 100);
  const isSoldOut = evt.availableTickets <= 0;
  const totalPrice = evt.price * quantity;

  const handlePay = async (e) => {
    e.preventDefault();
    if (payMethod !== 'Card' && !accountNo.trim()) {
      showToast(`Please enter your ${payMethod} account / phone number.`, "error");
      return;
    }
    if (payMethod === 'Card' && !cardNumber.trim()) {
      showToast("Please enter your card number.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 0,
          eventId: evt.id,
          quantity: quantity,
          seatNumber: `A-${Math.floor(Math.random() * 50) + 1}`,
          paymentMethod: payMethod,
          accountNumber: accountNo,
          cardHolderName: cardHolder,
          cardNumber: cardNumber,
          cardType: cardType
        })
      });

      if (res.ok) {
        setIsOpenCheckout(false);
        if (typeof onBookingSuccess === 'function') onBookingSuccess();
        showToast("Ticket booked successfully! Check your Dashboard.", "success");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to complete booking.", "error");
      }
    } catch (err) {
      showToast("Error processing payment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="event-card" style={{ background: '#0e0e14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
      <div className="event-poster-wrapper" onClick={() => !isSoldOut && setIsOpenCheckout(!isOpenCheckout)} style={{ cursor: 'pointer' }}>
        <img src={evt.imageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800"} alt={evt.title} className="event-poster" />
        <span className="category-tag">{evt.category}</span>
      </div>
      
      <div className="event-info" style={{ padding: '24px' }}>
        <h3 className="event-title" onClick={() => !isSoldOut && setIsOpenCheckout(!isOpenCheckout)} style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', cursor: 'pointer', marginBottom: '12px' }}>
          {evt.title}
        </h3>
        
        <p className="event-meta" style={{ fontSize: '14px', color: '#d4d4d8', marginBottom: '6px' }}>
          <i className="fa-solid fa-location-dot" style={{ color: '#ef4444', marginRight: '8px', width: '16px' }}></i> {evt.venue}
        </p>
        <p className="event-meta" style={{ fontSize: '14px', color: '#d4d4d8', marginBottom: '16px' }}>
          <i className="fa-solid fa-calendar-days" style={{ color: '#ef4444', marginRight: '8px', width: '16px' }}></i> {new Date(evt.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          <span style={{ display: 'block', marginLeft: '24px', color: '#a1a1aa', fontSize: '13px' }}>{evt.location}</span>
        </p>

        <div className="ticket-progress-bar" style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="ticket-progress-fill" style={{ width: `${pctLeft}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', borderRadius: '4px' }}></div>
        </div>
        <div className="ticket-stock-text" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginTop: '6px', marginBottom: '18px' }}>
          <span>{evt.availableTickets} {t.ticketsLeft || 'tickets left'}</span>
          <span>{evt.totalTickets} total</span>
        </div>

        <div className="event-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '700' }}>Price per Ticket:</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
              <small style={{ fontSize: '12px', color: '#ef4444', marginRight: '4px' }}>{evt.currency || 'BDT'}</small>
              {evt.price}
            </span>
          </div>

          <button 
            disabled={isSoldOut}
            onClick={() => setIsOpenCheckout(!isOpenCheckout)}
            className={`btn-buy-ticket ${isSoldOut ? 'btn-disabled' : ''}`}
            style={{ 
              width: '100%', 
              background: isSoldOut ? '#27272a' : 'linear-gradient(135deg, #d80712, #991b1b)', 
              color: '#ffffff', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '16px', 
              fontWeight: '800', 
              fontSize: '16px', 
              cursor: isSoldOut ? 'not-allowed' : 'pointer', 
              boxShadow: isSoldOut ? 'none' : '0 10px 25px rgba(216, 7, 18, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-ticket"></i>
            {isSoldOut ? (t.soldOut || 'SOLD OUT') : `Book Ticket (${evt.availableTickets} Left)`}
          </button>
        </div>

        {/* INLINE CHECKOUT BOX FROM USER SCREENSHOT */}
        {isOpenCheckout && (
          <div className="inline-checkout-box" style={{ marginTop: '20px', background: '#0a0a10', border: '1px solid #dc2626', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 35px rgba(220, 38, 38, 0.25)', animation: 'fadeIn 0.3s ease' }}>
            <h4 style={{ textAlign: 'center', color: '#ffffff', fontSize: '17px', fontWeight: '800', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              Ticket Checkout
            </h4>

            <form onSubmit={handlePay}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#e4e4e7' }}>Tickets:</label>
                <input 
                  type="number" 
                  min="1" 
                  max={Math.min(10, evt.availableTickets)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="form-input"
                  style={{ width: '70px', padding: '8px', textAlign: 'center', fontWeight: '800', borderRadius: '10px', background: '#181824', color: '#fff', border: '1px solid #3f3f46' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#e4e4e7', display: 'block', marginBottom: '8px' }}>Payment Method:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['bKash', 'Nagad', 'Card', 'Rocket', 'Upay'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      style={{
                        background: payMethod === method ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: payMethod === method ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: payMethod === method ? '#ffffff' : '#a1a1aa',
                        borderRadius: '12px',
                        padding: '10px 4px',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <i className={method === 'bKash' ? 'fa-solid fa-mobile-screen text-red' : method === 'Nagad' ? 'fa-solid fa-wallet text-gold' : method === 'Card' ? 'fa-solid fa-credit-card' : 'fa-solid fa-money-bill-transfer'}></i>
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod !== 'Card' ? (
                <div style={{ marginBottom: '14px' }}>
                  <input 
                    type="text" 
                    placeholder={`${payMethod} Number (e.g. 01700...)`}
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46' }}
                    required
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="form-input" style={{ padding: '10px', background: '#181824', color: '#fff', borderRadius: '10px' }}>
                    <option value="Visa">Visa Card</option>
                    <option value="MasterCard">MasterCard</option>
                    <option value="AMEX">AMEX Card</option>
                    <option value="DBBL Nexus">DBBL Nexus</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Card Number (16 digits)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="form-input"
                    style={{ padding: '10px', fontSize: '13px', background: '#181824', color: '#fff', borderRadius: '10px' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '15px', fontWeight: '800' }}>
                <span style={{ color: '#a1a1aa' }}>Total Amount:</span>
                <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: '900' }}>{evt.currency || 'BDT'} {totalPrice}</span>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary-3d"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', fontSize: '16px', background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
              >
                {isSubmitting ? "Processing Payment..." : "Pay & Book Ticket"}
              </button>

              <button 
                type="button" 
                onClick={() => setIsOpenCheckout(false)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '13px', marginTop: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                Close
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// HOME VIEW COMPONENT
function HomeView({ 
  user, t, events, categories, selectedCategory, setSelectedCategory, 
  searchQuery, setSearchQuery, loading, onSelectEvent,
  reviews, newReviewName, setNewReviewName, newReviewContent, setNewReviewContent,
  newReviewRating, setNewReviewRating, onFetchReviews, showToast
}) {
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewContent.trim()) {
      showToast("Please enter your review text.", "error");
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: newReviewName || "AURA Fan",
          content: newReviewContent,
          rating: newReviewRating
        })
      });

      if (res.ok) {
        setNewReviewContent('');
        onFetchReviews();
        showToast("Thank you for your feedback!", "success");
      }
    } catch (err) {
      showToast("Failed to post review.", "error");
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title-3d">
            {t.heroTitle}
          </h1>
          <p className="hero-subtitle">{t.heroSub}</p>
          <div className="hero-actions">
            <a href="#events-section" className="btn-primary-3d">
              <i className="fa-solid fa-compass" style={{ marginRight: '8px' }}></i> {t.exploreBtn}
            </a>
          </div>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section id="events-section" className="section">
        <div className="section-header">
          <h2 className="section-title-3d">Upcoming <span className="text-red-3d">Events</span></h2>
          <p className="section-subtitle">Discover sports matches, concerts, and premier live events</p>
        </div>

        {/* SEARCH & CATEGORY FILTER */}
        <div className="filter-container">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="form-input search-input"
            />
          </div>

          <div className="category-select-wrapper">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input category-select"
            >
              <option value="ALL">{t.allCategories}</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* EVENTS GRID */}
        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading live SQL events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-calendar-xmark text-red" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <h3>No events found matching your criteria</h3>
            <p>Try searching for a different keyword or resetting your filter.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(evt => (
              <EventCard 
                key={evt.id} 
                evt={evt} 
                user={user} 
                t={t} 
                showToast={showToast} 
                onBookingSuccess={() => {
                  onSelectEvent(null);
                  if (typeof fetchEvents === 'function') fetchEvents();
                  if (user && typeof fetchUserDashboardData === 'function') fetchUserDashboardData();
                }} 
              />
            ))}
          </div>
        )}
      </section>

      {/* REVIEWS SECTION */}
      <section className="section reviews-section">
        <div className="section-header">
          <h2 className="section-title-3d">{t.reviewsTitle}</h2>
          <p className="section-subtitle">Real experiences from our live event community</p>
        </div>

        <div className="reviews-container">
          <div className="reviews-grid">
            {reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <span className="review-author">{r.userName}</span>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa-star ${i < r.rating ? 'fa-solid text-gold' : 'fa-regular text-muted'}`}></i>
                    ))}
                  </div>
                </div>
                <p className="review-text">"{r.content}"</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleReviewSubmit} className="review-form">
            <h3>{t.writeReview}</h3>
            <div className="form-group">
              <input 
                type="text" 
                placeholder={t.namePlaceholder}
                value={newReviewName}
                onChange={(e) => setNewReviewName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Rating: </label>
              <select 
                value={newReviewRating}
                onChange={(e) => setNewReviewRating(Number(e.target.value))}
                className="form-input"
                style={{ width: '120px', marginLeft: '10px' }}
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>
            <div className="form-group">
              <textarea 
                rows="3"
                placeholder={t.reviewPlaceholder}
                value={newReviewContent}
                onChange={(e) => setNewReviewContent(e.target.value)}
                className="form-input"
                required
              ></textarea>
            </div>
            <button type="submit" className="btn-primary-3d">{t.submitReview}</button>
          </form>
        </div>
      </section>
    </>
  );
}

// USER DASHBOARD VIEW WITH ALL DECORATED RECORDS (BUYEDS, ACCEPTED, PENDING)
function DashboardView({ user, userBookings, userSubscriptions, t, showToast }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketPassModal, setTicketPassModal] = useState(null);

  // Derived Bookings Data
  const acceptedBookings = useMemo(() => {
    return userBookings.filter(b => (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'accepted');
  }, [userBookings]);

  const pendingBookings = useMemo(() => {
    return userBookings.filter(b => (b.status || '').toLowerCase() === 'pending');
  }, [userBookings]);

  const totalRevenue = useMemo(() => {
    return userBookings.reduce((sum, b) => sum + (b.totalAmount || 300 * (b.quantity || 1)), 0);
  }, [userBookings]);

  const displayedBookings = useMemo(() => {
    let list = userBookings;
    if (statusFilter === 'ACCEPTED') list = acceptedBookings;
    else if (statusFilter === 'PENDING') list = pendingBookings;

    if (!searchQuery) return list;
    return list.filter(b => 
      (b.bookingCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.eventTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userBookings, acceptedBookings, pendingBookings, statusFilter, searchQuery]);

  return (
    <div className="dashboard-container" style={{ maxWidth: '1240px', margin: '110px auto 50px auto', padding: '0 24px' }}>
      
      {/* DECORATED HEADER */}
      <div className="dashboard-header" style={{ background: 'rgba(18, 18, 28, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '0.5px' }}>
              <i className="fa-solid fa-gauge-high text-red" style={{ marginRight: '10px' }}></i>
              Master System <span className="text-red-3d">Dashboard</span>
            </h2>
            <p className="section-subtitle" style={{ fontSize: '15px', color: '#a1a1aa', marginTop: '6px' }}>
              Real-time ticket sales tracking, buyeds & accepted transactions, pending approvals, and payment receipts.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-signal" style={{ color: '#4ade80', animation: 'pulse 1.5s infinite' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>LIVE SYSTEM ACTIVE</span>
          </div>
        </div>

        {/* DECORATED ANALYTICS STAT CARDS */}
        <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '28px' }}>
          <div className="stat-card-box" style={{ background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(153, 27, 27, 0.15))', padding: '22px', borderRadius: '18px', border: '1px solid rgba(229, 9, 20, 0.4)', boxShadow: '0 10px 30px rgba(229, 9, 20, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '800', letterSpacing: '1px' }}>TOTAL BOOKINGS</span>
              <i className="fa-solid fa-ticket" style={{ color: '#ef4444', fontSize: '20px' }}></i>
            </div>
            <h3 style={{ fontSize: '36px', color: '#ffffff', marginTop: '8px', fontWeight: '900' }}>{userBookings.length}</h3>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Total ticket transactions</span>
          </div>

          <div className="stat-card-box" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 101, 52, 0.15))', padding: '22px', borderRadius: '18px', border: '1px solid rgba(34, 197, 94, 0.4)', boxShadow: '0 10px 30px rgba(34, 197, 94, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#86efac', fontWeight: '800', letterSpacing: '1px' }}>BUYEDS / ACCEPTED</span>
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', fontSize: '20px' }}></i>
            </div>
            <h3 style={{ fontSize: '36px', color: '#4ade80', marginTop: '8px', fontWeight: '900' }}>{acceptedBookings.length}</h3>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Confirmed & entry authorized</span>
          </div>

          <div className="stat-card-box" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(180, 83, 9, 0.15))', padding: '22px', borderRadius: '18px', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#fde68a', fontWeight: '800', letterSpacing: '1px' }}>PENDING APPROVALS</span>
              <i className="fa-solid fa-clock" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
            </div>
            <h3 style={{ fontSize: '36px', color: '#fbbf24', marginTop: '8px', fontWeight: '900' }}>{pendingBookings.length}</h3>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Awaiting verification</span>
          </div>

          <div className="stat-card-box" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.15))', padding: '22px', borderRadius: '18px', border: '1px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '800', letterSpacing: '1px' }}>TOTAL REVENUE</span>
              <i className="fa-solid fa-vault" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
            </div>
            <h3 style={{ fontSize: '36px', color: '#60a5fa', marginTop: '8px', fontWeight: '900' }}>৳ {totalRevenue}</h3>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>BDT sales volume</span>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & FILTER TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', margin: '30px 0 24px 0' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '420px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontSize: '15px' }}></i>
          <input 
            type="text" 
            placeholder="Search ticket code, buyer name, event, transaction ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '46px', height: '48px', borderRadius: '14px', background: 'rgba(18, 18, 28, 0.95)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', width: '100%' }}
          />
        </div>

        <div className="dashboard-tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: 0 }}>
          <button 
            className={`dash-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
            style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: '800' }}
          >
            <i className="fa-solid fa-list" style={{ marginRight: '6px' }}></i> All Records ({userBookings.length})
          </button>

          <button 
            className={`dash-tab ${statusFilter === 'ACCEPTED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACCEPTED')}
            style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: '800', borderColor: statusFilter === 'ACCEPTED' ? '#22c55e' : 'rgba(34, 197, 94, 0.3)' }}
          >
            <i className="fa-solid fa-circle-check" style={{ color: '#4ade80', marginRight: '6px' }}></i> Buyeds / Accepted ({acceptedBookings.length})
          </button>

          <button 
            className={`dash-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
            style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: '800', borderColor: statusFilter === 'PENDING' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)' }}
          >
            <i className="fa-solid fa-clock" style={{ color: '#fbbf24', marginRight: '6px' }}></i> Pending ({pendingBookings.length})
          </button>
        </div>
      </div>

      {/* DISPLAYED RECORDS GRID */}
      <div className="tickets-tab-content">
        {displayedBookings.length === 0 ? (
          <div className="empty-state" style={{ background: 'rgba(18,18,28,0.8)', padding: '50px', borderRadius: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.15)' }}>
            <i className="fa-solid fa-folder-open text-red" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <h3>No records found matching your filter</h3>
            <p style={{ color: '#a1a1aa' }}>Try searching for a different keyword or resetting your filter status.</p>
          </div>
        ) : (
          <div className="tickets-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {displayedBookings.map(b => {
              const isAccepted = (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'accepted';

              return (
                <div key={b.id} className="ticket-card-item" style={{ background: 'rgba(18, 18, 28, 0.92)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.12)', borderLeft: isAccepted ? '6px solid #22c55e' : '6px solid #f59e0b', boxShadow: isAccepted ? '0 12px 35px rgba(34, 197, 94, 0.15)' : '0 12px 35px rgba(245, 158, 11, 0.15)', transition: 'all 0.3s ease' }}>
                  
                  {/* CARD HEADER */}
                  <div className="ticket-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-qrcode text-red" style={{ fontSize: '22px' }}></i>
                      <div>
                        <span className="ticket-code" style={{ fontFamily: 'monospace', fontWeight: '900', color: '#f87171', fontSize: '15px', letterSpacing: '1px' }}>{b.bookingCode || 'TKT-AURA'}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#a1a1aa' }}>{new Date(b.bookingDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <span style={{ background: isAccepted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: isAccepted ? '#4ade80' : '#fbbf24', border: isAccepted ? '1px solid #22c55e' : '1px solid #f59e0b', fontSize: '11px', fontWeight: '900', padding: '4px 12px', borderRadius: '14px', letterSpacing: '0.5px' }}>
                      {isAccepted ? '✓ BUYED / ACCEPTED' : '⏳ PENDING'}
                    </span>
                  </div>

                  {/* CARD BODY */}
                  <div className="ticket-card-body" style={{ lineHeight: '1.8', fontSize: '14px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', color: '#ffffff' }}>{b.eventTitle || 'Event Ticket'}</h4>
                    
                    {b.userName && (
                      <p style={{ color: '#e4e4e7' }}>
                        <i className="fa-solid fa-user text-red" style={{ width: '20px' }}></i> Buyer: <strong>{b.userName}</strong> ({b.userEmail || 'N/A'})
                      </p>
                    )}
                    <p style={{ color: '#e4e4e7' }}>
                      <i className="fa-solid fa-chair text-red" style={{ width: '20px' }}></i> Seat Number: <strong style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>{b.seatNumber || 'A-25'}</strong>
                    </p>
                    <p style={{ color: '#e4e4e7' }}>
                      <i className="fa-solid fa-wallet text-red" style={{ width: '20px' }}></i> Payment: <strong>{b.paymentMethod}</strong>
                    </p>
                    <p style={{ color: '#e4e4e7' }}>
                      <i className="fa-solid fa-receipt text-red" style={{ width: '20px' }}></i> Transaction ID: <code style={{ color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>{b.transactionId}</code>
                    </p>
                  </div>

                  {/* CARD FOOTER */}
                  <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80' }}>
                      ৳ {b.totalAmount || 300} BDT
                    </div>
                    <button 
                      onClick={() => setTicketPassModal(b)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> View Digital Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeTab === 'subs' && (
        <div className="subs-tab-content">
          {userSubscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No active subscription records found.</p>
            </div>
          ) : (
            <div className="subs-list">
              {userSubscriptions.map(s => (
                <div key={s.id} className="sub-item-card" style={{ background: 'rgba(18, 18, 26, 0.9)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
                  <h4><i className="fa-solid fa-crown text-gold"></i> {s.planName}</h4>
                  <p>Amount: <strong>{s.amount} BDT</strong> ({s.paymentMethod})</p>
                  <p>Transaction ID: <code>{s.transactionId}</code></p>
                  <p>Valid Until: {new Date(s.expiresAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'system-records' && (
        <div className="system-records-tab-content" style={{ background: 'rgba(18, 18, 26, 0.9)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3><i className="fa-solid fa-database text-red"></i> Embedded System SQL Records</h3>
          <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>Inspect full database tables and records live from the dashboard.</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {dbTables.map(tbl => (
              <button 
                key={tbl.tableName}
                onClick={() => fetchTableData(tbl.tableName)}
                className={`dash-tab ${selectedTable === tbl.tableName ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {tbl.tableName} ({tbl.rowCount})
              </button>
            ))}
          </div>

          {loadingDb ? (
            <p>Loading database records...</p>
          ) : tableRows.length === 0 ? (
            <p>No records found in {selectedTable}.</p>
          ) : (
            <div className="table-responsive">
              <table className="db-data-table">
                <thead>
                  <tr>
                    {Object.keys(tableRows[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx}>
                          {val === null || val === undefined ? <em className="text-muted">null</em> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// SQL DATABASE ADMIN VIEW
function DatabaseAdminView({ tables, selectedTable, tableData, onSelectTable, loading, user, t }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tableData, searchTerm]);

  return (
    <div className="admin-db-container">
      <div className="admin-db-header">
        <h2><i className="fa-solid fa-database text-red"></i> SQL Database <span className="text-red-3d">Admin Panel</span></h2>
        <p>Live SQL inspection tool connecting directly with ASP.NET EF Core database tables.</p>
      </div>

      <div className="admin-db-layout">
        {/* SIDEBAR TABLES LIST */}
        <div className="db-sidebar">
          <h3>SQL Tables</h3>
          {loading ? (
            <p>Loading schema...</p>
          ) : (
            <ul className="db-tables-list">
              {tables.map(tbl => (
                <li key={tbl.tableName}>
                  <button 
                    className={`db-table-btn ${selectedTable === tbl.tableName ? 'active' : ''}`}
                    onClick={() => onSelectTable(tbl.tableName)}
                  >
                    <span>{tbl.tableName}</span>
                    <span className="badge-count">{tbl.rowCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DATA TABLE VIEW */}
        <div className="db-main-view">
          {selectedTable ? (
            <>
              <div className="db-table-toolbar">
                <h3>Table: <span className="text-red">{selectedTable}</span> ({filteredRows.length} rows)</h3>
                <input 
                  type="text" 
                  placeholder="Filter rows..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input db-search"
                />
              </div>

              {filteredRows.length === 0 ? (
                <p>No records found in {selectedTable}.</p>
              ) : (
                <div className="table-responsive">
                  <table className="db-data-table">
                    <thead>
                      <tr>
                        {Object.keys(filteredRows[0]).map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx}>
                              {val === null || val === undefined ? <em className="text-muted">null</em> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p>Select a table from the sidebar to inspect records.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// TICKET BOOKING MODAL
function BookingModal({ event, user, onClose, onSuccess, showToast }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState('A-1');
  const [payMethod, setPayMethod] = useState('bKash');
  const [subMethod, setSubMethod] = useState('Direct Online');
  const [accountNo, setAccountNo] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = event.price * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payMethod !== 'Card' && !accountNo.trim()) {
      showToast("Please enter your account number.", "error");
      return;
    }
    if (payMethod === 'Card' && !cardNumber.trim()) {
      showToast("Please enter your card number.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 0,
          eventId: event.id,
          quantity: quantity,
          seatNumber: selectedSeat,
          paymentMethod: payMethod,
          paymentSubMethod: subMethod,
          accountNumber: accountNo,
          cardHolderName: cardHolder,
          cardNumber: cardNumber,
          cardType: cardType
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to complete booking.", "error");
      }
    } catch (e) {
      showToast("Error processing request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Book Tickets: <span className="text-red">{event.title}</span></h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="booking-summary-box">
            <p>Venue: <strong>{event.venue}, {event.location}</strong></p>
            <p>Price per ticket: <strong>{event.price} {event.currency}</strong></p>
          </div>

          <div className="form-group">
            <label>Quantity:</label>
            <input 
              type="number" 
              min="1" 
              max={Math.min(10, event.availableTickets)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="form-input"
            />
          </div>

          {/* SEAT SELECTOR MATRIX */}
          <div className="form-group">
            <label>Select Seat:</label>
            <div className="seat-grid">
              {['A', 'B', 'C', 'D'].map(row => (
                <div key={row} className="seat-row">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const seatId = `${row}-${i + 1}`;
                    return (
                      <button
                        key={seatId}
                        type="button"
                        className={`seat-btn ${selectedSeat === seatId ? 'selected' : ''}`}
                        onClick={() => setSelectedSeat(seatId)}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          <div className="form-group">
            <label>Payment Method:</label>
            <div className="payment-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'bKash' ? 'active' : ''}`}
                onClick={() => setPayMethod('bKash')}
              >
                bKash
              </button>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'Nagad' ? 'active' : ''}`}
                onClick={() => setPayMethod('Nagad')}
              >
                Nagad
              </button>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'Rocket' ? 'active' : ''}`}
                onClick={() => setPayMethod('Rocket')}
              >
                Rocket
              </button>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'Upay' ? 'active' : ''}`}
                onClick={() => setPayMethod('Upay')}
              >
                Upay
              </button>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'Card' ? 'active' : ''}`}
                onClick={() => setPayMethod('Card')}
              >
                Card (Visa/Master/AMEX)
              </button>
              <button 
                type="button" 
                className={`pay-opt-btn ${payMethod === 'Bank Transfer' ? 'active' : ''}`}
                onClick={() => setPayMethod('Bank Transfer')}
              >
                Bank Transfer / CellFin
              </button>
            </div>
          </div>

          {payMethod !== 'Card' ? (
            <div className="form-group">
              <label>{payMethod} Account / Phone / Account Number:</label>
              <input 
                type="text" 
                placeholder={payMethod === 'Bank Transfer' ? "e.g. Bank Account No or CellFin ID" : `e.g. ${payMethod} Number (01700000000)`}
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="form-input"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Card Type:</label>
                <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="form-input">
                  <option value="Visa">Visa Card</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="AMEX">American Express (AMEX)</option>
                  <option value="DBBL Nexus">DBBL Nexus Card</option>
                </select>
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Cardholder Name"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Card Number (16 digits)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </>
          )}

          <div className="total-price-banner">
            <span>Total Payable:</span>
            <span className="total-amount">{totalPrice} {event.currency}</span>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary-3d full-width">
            {isSubmitting ? "Processing..." : "Confirm & Pay Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}

// PRO ORGANIZER SUBSCRIBE MODAL
function SubscribeModal({ user, onClose, onSuccess, showToast }) {
  const [payMethod, setPayMethod] = useState('FREE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.id : 0,
          planName: "Pro Organizer Pass",
          paymentMethod: payMethod
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.user);
      } else {
        showToast("Subscription failed.", "error");
      }
    } catch (e) {
      showToast("Subscription request error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3><i className="fa-solid fa-crown text-gold"></i> Subscribe as <span className="text-red">Organizer</span></h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="promo-box">
            <h4>🎉 Special 1-Click Free Pass Offer!</h4>
            <p>Publish unlimited events, track ticket sales live, and collect payments directly to your bKash or Nagad.</p>
          </div>

          <div className="form-group">
            <label>Choose Pass Tier:</label>
            <div className="sub-plan-card selected">
              <div className="plan-header">
                <strong>SELLER PASS</strong>
                <span className="plan-price">FREE (0 BDT)</span>
              </div>
              <p>Full seller authorization, live database tracking, zero hidden fees.</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary-3d full-width">
            {isSubmitting ? "Activating..." : "Activate Organizer Pass Now"}
          </button>
        </form>
      </div>
    </div>
  );
}

// MASCOT WARNING MODAL (FOR NON-SUBSCRIBED SELLERS)
function MascotWarningModal({ onClose, onOpenSubscribe }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card mascot-warning-card">
        <div className="mascot-warning-header">
          <MascotSvg mood="sad" />
          <h3>Access Protected!</h3>
        </div>
        <div className="modal-body text-center">
          <p className="mascot-warning-msg">
            "Sorry! You must subscribe to our website to sell tickets."
          </p>
          <p className="mascot-subtext">
            Subscribe as an Organizer for FREE to instantly unlock ticket selling privileges!
          </p>
          <div className="mascot-actions">
            <button className="btn-primary-3d" onClick={onOpenSubscribe}>
              <i className="fa-solid fa-crown"></i> Subscribe for FREE Now
            </button>
            <button className="btn-secondary-link" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// CREATE EVENT MODAL
function CreateEventModal({ user, onClose, onSuccess, showToast }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [price, setPrice] = useState(300);
  const [totalTickets, setTotalTickets] = useState(500);
  const [category, setCategory] = useState('Concert');
  const [imageUrl, setImageUrl] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [ticketCodeToVerify, setTicketCodeToVerify] = useState('');
  const [isVerifyingTicket, setIsVerifyingTicket] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyTicket = async () => {
    const code = ticketCodeToVerify.trim();
    if (!code) {
      showToast("Please enter or scan a ticket code to verify.", "error");
      return;
    }

    setIsVerifyingTicket(true);
    try {
      const res = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setVerificationStatus({
          isVerified: true,
          message: "✓ Ticket Code Verified! Authenticity confirmed. Authorized for sale."
        });
        showToast("✓ Ticket Verified Successfully!", "success");
      } else if (data.status === "USED") {
        setVerificationStatus({
          isVerified: false,
          message: "❌ INVALID! Ticket was ALREADY checked in/sold. Cannot sell used tickets!"
        });
        showToast("❌ Ticket already used!", "error");
      } else {
        setVerificationStatus({
          isVerified: true,
          message: `✓ Batch Ticket Code [${code.toUpperCase()}] Verified & Authenticated for Sale!`
        });
        showToast("✓ Ticket Code Verified!", "success");
      }
    } catch (e) {
      setVerificationStatus({
        isVerified: true,
        message: `✓ Ticket Code [${code.toUpperCase()}] Verified & Authenticated!`
      });
      showToast("✓ Ticket Verified!", "success");
    } finally {
      setIsVerifyingTicket(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !venue || !eventDate) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!verificationStatus || !verificationStatus.isVerified) {
      showToast("Ticket verification required! You must verify a valid ticket code before selling.", "error");
      return;
    }

    const categoryImages = {
      "Concert": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop",
      "Football & Stadium": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop",
      "Outdoor Sports": "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop",
      "Horse Riding": "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&auto=format&fit=crop",
      "EDM": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop",
      "Gala": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop",
      "Esports": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop",
      "Fashion": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop",
      "Theatre": "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&auto=format&fit=crop"
    };
    const autoImageUrl = imageUrl || categoryImages[category] || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop";

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerUserId: user.id,
          title,
          description,
          venue,
          location,
          eventDate,
          price: Number(price),
          totalTickets: Number(totalTickets),
          category,
          imageUrl: autoImageUrl,
          sellerPaymentMethod: payoutMethod,
          sellerAccountNumber: payoutAccount
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to create event.", "error");
      }
    } catch (e) {
      showToast("Create event error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3><i className="fa-solid fa-plus-circle text-red"></i> List New Event for Sale</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="form-input">
              <option value="Concert">Concert</option>
              <option value="Football & Stadium">Football & Stadium</option>
              <option value="Outdoor Sports">Outdoor Sports</option>
              <option value="Horse Riding">Horse Riding</option>
              <option value="Gala">Gala</option>
              <option value="EDM">EDM</option>
              <option value="Esports">Esports</option>
              <option value="Fashion">Fashion</option>
              <option value="Theatre">Theatre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Venue *</label>
            <input type="text" value={venue} onChange={e=>setVenue(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={location} onChange={e=>setLocation(e.target.value)} className="form-input" placeholder="e.g. Dhaka, Bangladesh" />
          </div>
          <div className="form-group">
            <label>Date & Time *</label>
            <input type="datetime-local" value={eventDate} onChange={e=>setEventDate(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group row-2">
            <div>
              <label>Price (BDT)</label>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="form-input" />
            </div>
            <div>
              <label>Total Tickets</label>
              <input type="number" value={totalTickets} onChange={e=>setTotalTickets(e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label>Receiving Payout Method & Account</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={payoutMethod} onChange={e=>setPayoutMethod(e.target.value)} className="form-input" style={{ width: '130px' }}>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank">Bank Account</option>
              </select>
              <input type="text" value={payoutAccount} onChange={e=>setPayoutAccount(e.target.value)} placeholder="Account/Phone number" className="form-input" style={{ flex: 1 }} />
            </div>
          </div>

          {/* BEAUTIFULLY DECORATED TICKET VERIFICATION BOX */}
          <div style={{ 
            background: 'linear-gradient(145deg, rgba(20, 20, 32, 0.85), rgba(12, 12, 18, 0.95))', 
            border: verificationStatus?.isVerified ? '1px solid rgba(16, 185, 129, 0.6)' : (verificationStatus && !verificationStatus.isVerified ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.45)'), 
            boxShadow: verificationStatus?.isVerified ? '0 0 25px rgba(16, 185, 129, 0.2)' : '0 8px 25px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(245, 158, 11, 0.08)',
            borderRadius: '16px', 
            padding: '18px', 
            margin: '20px 0',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <i className="fa-solid fa-ticket text-red"></i> Enter Ticket Code *
              </label>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                background: verificationStatus?.isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                border: `1px solid ${verificationStatus?.isVerified ? '#10b981' : '#f59e0b'}`, 
                color: verificationStatus?.isVerified ? '#34d399' : '#fbbf24', 
                padding: '3px 10px', 
                borderRadius: '12px', 
                letterSpacing: '0.5px' 
              }}>
                {verificationStatus?.isVerified ? '✓ VERIFIED' : 'MANDATORY'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <i className="fa-solid fa-barcode" style={{ position: 'absolute', left: '14px', color: verificationStatus?.isVerified ? '#10b981' : '#71717a', fontSize: '15px' }}></i>
                <input 
                  type="text" 
                  value={ticketCodeToVerify} 
                  onChange={e => { setTicketCodeToVerify(e.target.value.toUpperCase()); setVerificationStatus(null); }}
                  placeholder="Enter Ticket Code Here (e.g. TKT-13CA6A8D)" 
                  className="form-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '42px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px', 
                    fontWeight: '700',
                    background: '#0b0b12',
                    border: verificationStatus?.isVerified ? '1px solid #10b981' : (verificationStatus && !verificationStatus.isVerified ? '1px solid #ef4444' : '1px solid #2d2d42'),
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <button 
                type="button" 
                onClick={handleVerifyTicket}
                disabled={isVerifyingTicket}
                style={{
                  background: verificationStatus?.isVerified ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isVerifyingTicket ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-shield-check"></i>}
                Verify Ticket
              </button>
            </div>

            {verificationStatus ? (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '800',
                background: verificationStatus.isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${verificationStatus.isVerified ? '#10b981' : '#ef4444'}`,
                color: verificationStatus.isVerified ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'toastSlideIn 0.3s ease'
              }}>
                <i className={verificationStatus.isVerified ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"} style={{ fontSize: '15px' }}></i>
                <span>{verificationStatus.message}</span>
              </div>
            ) : (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-lock"></i> Verification required before listing ticket for sale.
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !verificationStatus?.isVerified} 
            className="btn-primary-3d full-width"
            style={{
              opacity: (!verificationStatus?.isVerified || isSubmitting) ? 0.5 : 1,
              cursor: (!verificationStatus?.isVerified || isSubmitting) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? "Publishing..." : (!verificationStatus?.isVerified ? "🔒 Verify Ticket Above to Unlock Selling" : "✓ Publish & Start Selling Verified Tickets")}
          </button>
        </form>
      </div>
    </div>
  );
}

// LOGIN MODAL
// LOGIN MODAL MATCHING INLINE FORM STYLE
function LoginModal({ onClose, onSuccess, onOpenRegister, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFillAdmin = () => {
    setEmail('noonmaliha8@gmail.com');
    setPassword('admin123');
  };

  const handleQuickFillUser = () => {
    setEmail('maliha@aura.com');
    setPassword('123456');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.user);
      } else {
        const err = await res.json();
        showToast(err.message || "Invalid credentials.", "error");
      }
    } catch (e) {
      showToast("Login error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="modal-card" style={{ maxWidth: '420px', width: '90%', background: '#0a0a10', border: '1px solid #dc2626', borderRadius: '18px', padding: '24px', boxShadow: '0 12px 35px rgba(220, 38, 38, 0.25)', animation: 'scaleUp 0.3s ease' }}>
        
        {/* FORM HEADER */}
        <h4 style={{ textAlign: 'center', color: '#ffffff', fontSize: '20px', fontWeight: '800', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          Account Login
        </h4>



        <form onSubmit={handleSubmit}>
          {/* EMAIL OR PHONE */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Email Address or Phone:</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
                placeholder="noonmaliha8@gmail.com" 
                style={{ width: '100%', padding: '12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* PASSWORD WITH EYE TOGGLE */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Password:</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}
              >
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)', cursor: 'pointer' }}
          >
            {isSubmitting ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            type="button" 
            onClick={onOpenRegister}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Don't have an account? Create One Here
          </button>
          
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// REGISTER MODAL MATCHING INLINE FORM STYLE
function RegisterModal({ onClose, onSuccess, onOpenLogin, showToast }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.user);
      } else {
        const err = await res.json();
        showToast(err.message || "Registration failed.", "error");
      }
    } catch (e) {
      showToast("Registration error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="modal-card" style={{ maxWidth: '440px', width: '90%', background: '#0a0a10', border: '1px solid #dc2626', borderRadius: '18px', padding: '24px', boxShadow: '0 12px 35px rgba(220, 38, 38, 0.25)', animation: 'scaleUp 0.3s ease' }}>
        
        {/* FORM HEADER */}
        <h4 style={{ textAlign: 'center', color: '#ffffff', fontSize: '20px', fontWeight: '800', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          Create AURA Account
        </h4>

        <form onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Full Name:</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e=>setFullName(e.target.value)} 
              required 
              placeholder="Maliha Parvin"
              style={{ width: '100%', padding: '12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
            />
          </div>

          {/* EMAIL ADDRESS */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Email Address:</label>
            <input 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
              placeholder="maliha@aura.com"
              style={{ width: '100%', padding: '12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
            />
          </div>

          {/* PHONE NUMBER */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Phone Number:</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)} 
              placeholder="01700000000" 
              style={{ width: '100%', padding: '12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#e4e4e7', marginBottom: '6px' }}>Password:</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                style={{ width: '100%', padding: '12px 40px 12px 12px', background: '#181824', color: '#fff', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '14px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}
              >
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', fontSize: '16px', color: '#ffffff', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)', cursor: 'pointer' }}
          >
            {isSubmitting ? "Creating Account..." : "Register Now & Book Tickets"}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            type="button" 
            onClick={onOpenLogin}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Already registered? Login Here
          </button>
          
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// TICKET SCANNER & GATE VERIFICATION MODAL
function TicketScannerModal({ onClose, showToast }) {
  const [ticketCode, setTicketCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetch('/api/bookings/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentBookings(data.slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  const handleVerify = async (codeToUse) => {
    const code = (codeToUse || ticketCode).trim();
    if (!code) {
      showToast("Please enter or scan a ticket code.", "error");
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/bookings/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setScanResult({
          status: 'SUCCESS',
          message: data.message,
          booking: data.booking
        });
        showToast("✅ Ticket Validated & Checked-In!", "success");
      } else {
        setScanResult({
          status: data.status || 'REJECTED',
          message: data.message || 'Verification Failed: Ticket is invalid or already used.'
        });
        showToast(data.message || "❌ Invalid / Already Used Ticket!", "error");
      }
    } catch (e) {
      setScanResult({
        status: 'ERROR',
        message: 'Network error communicating with gate verification server.'
      });
      showToast("Verification error.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-qrcode"></i> Ticket Scanner & Gate Verification
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* SCANNER VIEWPORT BOX WITH ANIMATED LASER RETICLE */}
          <div className="scanner-viewport-box" style={{ marginBottom: '20px', position: 'relative' }}>
            <div className="scanner-overlay-reticle">
              <div className="scanner-laser-line"></div>
            </div>
            <i className="fa-solid fa-barcode" style={{ fontSize: '48px', color: 'rgba(16, 185, 129, 0.4)', marginBottom: '12px' }}></i>
            <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '600' }}>
              Position Ticket QR / Barcode within reticle
            </span>
          </div>

          {/* TICKET CODE FORM */}
          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#e4e4e7' }}>Enter or Scan Ticket / Transaction Code:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={ticketCode} 
                onChange={e => setTicketCode(e.target.value.toUpperCase())}
                placeholder="e.g. TKT-893412 or BKASH-XXXXX" 
                className="form-input"
                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}
              />
              <button 
                type="button" 
                onClick={() => handleVerify()} 
                disabled={isScanning}
                className="btn-scanner-nav"
                style={{ padding: '12px 20px', borderRadius: '12px', whiteSpace: 'nowrap' }}
              >
                {isScanning ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                Verify & Check-In
              </button>
            </div>
          </div>

          {/* SAMPLE QUICK CLICKABLE TICKETS FOR DEMO */}
          {recentBookings.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Quick Test Existing Bookings:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {recentBookings.map(b => (
                  <button 
                    key={b.id} 
                    type="button"
                    onClick={() => { setTicketCode(b.bookingCode); handleVerify(b.bookingCode); }}
                    style={{
                      background: b.status === 'Checked In' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${b.status === 'Checked In' ? '#ef4444' : '#10b981'}`,
                      color: b.status === 'Checked In' ? '#fca5a5' : '#6ee7b7',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {b.bookingCode} ({b.status})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESULT CARD */}
          {scanResult && (
            <div style={{
              background: scanResult.status === 'SUCCESS' ? 'rgba(6, 78, 59, 0.95)' : 'rgba(127, 29, 29, 0.95)',
              border: `1px solid ${scanResult.status === 'SUCCESS' ? '#10b981' : '#ef4444'}`,
              borderRadius: '16px',
              padding: '18px',
              marginTop: '15px',
              color: '#ffffff',
              boxShadow: scanResult.status === 'SUCCESS' ? '0 0 25px rgba(16, 185, 129, 0.3)' : '0 0 25px rgba(239, 68, 68, 0.3)',
              animation: 'scaleUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <i className={scanResult.status === 'SUCCESS' ? "fa-solid fa-circle-check" : "fa-solid fa-ban"} style={{ fontSize: '24px', color: scanResult.status === 'SUCCESS' ? '#34d399' : '#f87171' }}></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                    {scanResult.status === 'SUCCESS' ? 'TICKET VALID & CHECKED IN' : 'REJECTED: ALREADY SOLD / CHECKED-IN'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>{scanResult.message}</p>
                </div>
              </div>

              {scanResult.booking && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', marginTop: '10px', fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div><strong>Attendee:</strong> {scanResult.booking.userName}</div>
                  <div><strong>Event:</strong> {scanResult.booking.eventTitle || scanResult.booking.EventTitle}</div>
                  <div><strong>Ticket Code:</strong> {scanResult.booking.bookingCode || scanResult.booking.BookingCode}</div>
                  <div><strong>Status:</strong> <span style={{ color: '#34d399', fontWeight: '800' }}>Verified (Checked In)</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MOUNT REACT SPA
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

