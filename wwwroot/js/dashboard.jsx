const { useState, useEffect, useMemo, useRef } = React;

// DYNAMIC 3D CANVAS BACKGROUND
function AuraCanvas() {
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

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height));
      gradient.addColorStop(0, 'rgba(30, 10, 20, 0.85)');
      gradient.addColorStop(1, 'rgba(8, 8, 14, 0.98)');
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

  return null;
}

// DECORATED STANDALONE DASHBOARD APP
function StandaloneDashboardApp() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [bookings, setBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACCEPTED', 'PENDING', 'SUBS'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isTicketScannerOpen, setIsTicketScannerOpen] = useState(false);
  const [ticketPassModal, setTicketPassModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch All Bookings & Summary Stats via DashboardController
  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/records');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Sync user to localStorage
  useEffect(() => {
    if (user) localStorage.setItem('aura_user', JSON.stringify(user));
    else localStorage.removeItem('aura_user');
  }, [user]);

  // Derived Statistics & Categorization
  const acceptedBookings = useMemo(() => {
    return bookings.filter(b => (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'accepted');
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => (b.status || '').toLowerCase() === 'pending');
  }, [bookings]);

  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (b.totalAmount || 300 * (b.quantity || 1)), 0);
  }, [bookings]);

  // Filtered Bookings
  const displayedBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter === 'ACCEPTED') list = acceptedBookings;
    else if (statusFilter === 'PENDING') list = pendingBookings;

    if (!searchQuery) return list;
    return list.filter(b => 
      (b.bookingCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.eventTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.paymentMethod || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookings, acceptedBookings, pendingBookings, statusFilter, searchQuery]);

  // Action: Approve / Accept a Pending Ticket via API
  const handleApproveTicket = async (bookingId) => {
    try {
      const res = await fetch(`/api/dashboard/approve/${bookingId}`, { method: 'POST' });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Accepted' } : b));
        showToast("Ticket status updated to ACCEPTED!", "success");
      }
    } catch (e) {
      showToast("Approve error.", "error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    showToast("Logged out successfully.", "info");
  };

  return (
    <div className="aura-app-container">
      <AuraCanvas />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="index.html" className="brand-logo">
          AURA<span className="red-plus">+</span>
        </a>
        <ul className="nav-links">
          <li><a href="index.html" className="nav-link-btn">EVENTS</a></li>
          <li><a href="dashboard.html" className="nav-link-btn active"><i className="fa-solid fa-chart-line" style={{ marginRight: '4px' }}></i> DASHBOARD</a></li>
          <li>
            <button className="btn-subscribe-nav" onClick={() => setIsSubscribeOpen(true)}>
              <i className="fa-solid fa-crown" style={{ marginRight: '4px' }}></i> 
              {user && user.isSubscribed ? <span style={{ color: '#4ade80', fontWeight: '800' }}>✓ SUBSCRIBED</span> : "SUBSCRIBE"}
            </button>
          </li>
          <li>
            <a href="index.html#events-section" className="btn-nav-seller">
              <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> SELL TICKETS
            </a>
          </li>
          {!user ? (
            <>
              <li><a href="login.html" className="btn-login-nav" onClick={(e) => { e.preventDefault(); setIsLoginOpen(true); }}>LOGIN</a></li>
              <li><a href="register.html" className="btn-register-nav" onClick={(e) => { e.preventDefault(); setIsRegisterOpen(true); }}><i className="fa-solid fa-user-plus" style={{ marginRight: '4px' }}></i> REGISTRATION</a></li>
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
                  <i className="fa-solid fa-right-from-bracket"></i> LOGOUT
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* DECORATED DASHBOARD CONTENT */}
      <main className="main-content">
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
                <h3 style={{ fontSize: '36px', color: '#ffffff', marginTop: '8px', fontWeight: '900' }}>{bookings.length}</h3>
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
            
            {/* SEARCH BOX */}
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

            {/* FILTER BUTTONS */}
            <div className="dashboard-tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: 0 }}>
              <button 
                className={`dash-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
                style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: '800' }}
              >
                <i className="fa-solid fa-list" style={{ marginRight: '6px' }}></i> All Records ({bookings.length})
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
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                <p>Fetching real-time ticket records...</p>
              </div>
            ) : displayedBookings.length === 0 ? (
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

                      {/* CARD FOOTER & ACTIONS */}
                      <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80' }}>
                          ৳ {b.totalAmount || 300} BDT
                        </div>

                        {!isAccepted ? (
                          <button 
                            onClick={() => handleApproveTicket(b.id)}
                            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)' }}
                          >
                            <i className="fa-solid fa-check-double" style={{ marginRight: '4px' }}></i> Approve & Accept
                          </button>
                        ) : (
                          <button 
                            onClick={() => setTicketPassModal(b)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                          >
                            <i className="fa-solid fa-ticket" style={{ marginRight: '4px' }}></i> View Digital Pass
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* TICKET DIGITAL PASS MODAL */}
      {ticketPassModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px', border: '2px solid #22c55e', boxShadow: '0 0 40px rgba(34, 197, 94, 0.4)' }}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-ticket text-green" style={{ marginRight: '8px' }}></i> Digital Event Ticket Pass</h3>
              <button className="modal-close" onClick={() => setTicketPassModal(null)}>&times;</button>
            </div>
            <div className="modal-body text-center" style={{ padding: '20px' }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
                <i className="fa-solid fa-qrcode" style={{ fontSize: '120px', color: '#000000' }}></i>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>{ticketPassModal.eventTitle}</h4>
              <p style={{ color: '#f87171', fontWeight: '800', fontSize: '16px', margin: '8px 0' }}>Ticket Code: {ticketPassModal.bookingCode}</p>
              <p style={{ color: '#a1a1aa' }}>Buyer: {ticketPassModal.userName}</p>
              <p style={{ color: '#a1a1aa' }}>Seat: <strong style={{ color: '#fbbf24' }}>{ticketPassModal.seatNumber || 'A-25'}</strong></p>
              <div style={{ marginTop: '20px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '10px', borderRadius: '10px', fontWeight: '800' }}>
                ✓ VERIFIED & ENTRY AUTHORIZED
              </div>
            </div>
          </div>
        </div>
      )}

      {isTicketScannerOpen && (
        <TicketScannerModal 
          onClose={() => setIsTicketScannerOpen(false)}
          showToast={showToast}
        />
      )}

      {/* FOOTER */}
      <footer className="aura-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>AURA<span className="red-plus">+</span></h3>
            <p>The ultimate live event marketplace & seller platform.</p>
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
    </div>
  );
}

// TICKET SCANNER MODAL FOR DASHBOARD
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
          <div className="scanner-viewport-box" style={{ marginBottom: '20px', position: 'relative' }}>
            <div className="scanner-overlay-reticle">
              <div className="scanner-laser-line"></div>
            </div>
            <i className="fa-solid fa-barcode" style={{ fontSize: '48px', color: 'rgba(16, 185, 129, 0.4)', marginBottom: '12px' }}></i>
            <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '600' }}>
              Position Ticket QR / Barcode within reticle
            </span>
          </div>

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

// MOUNT STANDALONE DASHBOARD APP
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<StandaloneDashboardApp />);
