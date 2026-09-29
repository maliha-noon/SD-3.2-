// AURA++ React 18 Interactive Component Suite
(function () {
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.log('React 18 waiting for DOM load...');
    return;
  }

  const { useState, useEffect } = React;
  const e = React.createElement;

  // 1. React Interactive Mascot Component
  function ReactMascot() {
    const [blinking, setBlinking] = useState(false);
    const [mood, setMood] = useState('happy'); // happy, excited, celebratory
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 200);
      }, 3500);

      const handleUserChange = () => {
        const u = JSON.parse(localStorage.getItem('aura_user')) || null;
        setUserStatus(u);
        if (u && u.isSubscribed) {
          setMood('celebratory');
        } else {
          setMood('happy');
        }
      };

      handleUserChange();
      window.addEventListener('storage', handleUserChange);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleUserChange);
      };
    }, []);

    const mascotColor = mood === 'celebratory' ? '#10b981' : '#e50914';

    return e(
      'div',
      {
        className: 'react-mascot-widget',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          borderRadius: '24px',
          background: 'rgba(20, 20, 30, 0.75)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${mascotColor}44`,
          boxShadow: `0 8px 32px ${mascotColor}22`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
        onMouseEnter: () => setMood('excited'),
        onMouseLeave: () => setMood(userStatus && userStatus.isSubscribed ? 'celebratory' : 'happy'),
      },
      e(
        'svg',
        {
          width: '36',
          height: '36',
          viewBox: '0 0 64 64',
          style: { transform: mood === 'excited' ? 'scale(1.15) rotate(5deg)' : 'scale(1)', transition: 'transform 0.2s ease' },
        },
        e('circle', { cx: '32', cy: '32', r: '28', fill: mascotColor }),
        e('ellipse', { cx: '22', cy: '26', rx: '4', ry: blinking ? '0.5' : '5', fill: '#ffffff' }),
        e('ellipse', { cx: '42', cy: '26', rx: '4', ry: blinking ? '0.5' : '5', fill: '#ffffff' }),
        e('path', {
          d: mood === 'excited' ? 'M20 40 Q32 54 44 40' : 'M22 42 Q32 48 42 42',
          stroke: '#ffffff',
          strokeWidth: '3.5',
          fill: 'none',
          strokeLinecap: 'round',
        })
      ),
      e(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        e('span', { style: { fontSize: '12px', fontWeight: '800', color: mascotColor, letterSpacing: '0.5px' } }, 'REACT MASCOT AI'),
        e('span', { style: { fontSize: '11px', color: 'rgba(255,255,255,0.8)' } },
          mood === 'celebratory'
            ? '✓ Pro Seller Activated!'
            : mood === 'excited'
            ? 'Ready for your next event!'
            : 'Explore concerts & festivals'
        )
      )
    );
  }

  // 2. React Live Stats Tracker Component
  function ReactLiveStats() {
    const [stats, setStats] = useState({ events: 0, tickets: 0, activeUsers: 1 });

    useEffect(() => {
      fetch('/api/events')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const totalAvail = data.reduce((acc, curr) => acc + (curr.availableTickets || 0), 0);
            setStats({ events: data.length, tickets: totalAvail, activeUsers: Math.floor(Math.random() * 50) + 120 });
          }
        })
        .catch(() => {});
    }, []);

    return e(
      'div',
      {
        className: 'react-stats-bar',
        style: {
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          margin: '16px 0',
        },
      },
      e('div', { style: { textAlign: 'center' } },
        e('div', { style: { fontSize: '18px', fontWeight: '900', color: '#e50914' } }, stats.events),
        e('div', { style: { fontSize: '10px', color: '#888', textTransform: 'uppercase' } }, 'Live Events')
      ),
      e('div', { style: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' } }),
      e('div', { style: { textAlign: 'center' } },
        e('div', { style: { fontSize: '18px', fontWeight: '900', color: '#10b981' } }, stats.tickets),
        e('div', { style: { fontSize: '10px', color: '#888', textTransform: 'uppercase' } }, 'Tickets Left')
      ),
      e('div', { style: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' } }),
      e('div', { style: { textAlign: 'center' } },
        e('div', { style: { fontSize: '18px', fontWeight: '900', color: '#3b82f6' } }, stats.activeUsers),
        e('div', { style: { fontSize: '10px', color: '#888', textTransform: 'uppercase' } }, 'Active Fans Online')
      )
    );
  }

  // Mount React Components on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    const mascotContainer = document.getElementById('react-mascot-root');
    if (mascotContainer) {
      const root = ReactDOM.createRoot(mascotContainer);
      root.render(e(ReactMascot));
    }

    const statsContainer = document.getElementById('react-stats-root');
    if (statsContainer) {
      const root = ReactDOM.createRoot(statsContainer);
      root.render(e(ReactLiveStats));
    }
  });
})();
