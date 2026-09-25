/* ============================================================
   AURA++ — FLOW CONTROLLER
   Stage sequence:
     1. Entrance gate     (Enter button)
     2. Welcome modal     (Let's Explore More button)
     3. Intro screen      (ULTIMATE EVENT EXPERIENCE, 4s + Next)
     4. Login gate        (Login / Create Account buttons)
     5. Full site         (shown only after login)
   If already logged in → skip straight to stage 5.
   ============================================================ */

(function () {
  'use strict';

  // How long the intro screen stays before "Next" appears (ms)
  const INTRO_DURATION = 4000;

  // Dev shortcut: add ?skipIntro=1 to URL to bypass stages 1-4
  const params = new URLSearchParams(window.location.search);
  const devSkip = params.get('skipIntro') === '1';

  // ---------- helpers ----------
  const $ = id => document.getElementById(id);

  function isLoggedIn() {
    try {
      const u = JSON.parse(localStorage.getItem('aura_user'));
      return !!(u && (u.id || u.email));
    } catch (e) {
      return false;
    }
  }

  function showSite() {
    document.body.classList.remove('gate-open', 'intro-open', 'login-gate-open');
    document.body.classList.add('logged-in');

    // Hide all gates
    const gate = $('entrance-gate');
    const intro = $('intro-screen');
    const loginGate = $('login-gate');
    const welcome = $('welcome-modal');

    if (gate) gate.classList.add('hidden');
    if (intro) intro.classList.add('stage-hidden');
    if (loginGate) loginGate.classList.add('stage-hidden');
    if (welcome) welcome.classList.remove('active');

    // Let the animations refresh (ScrollTrigger) after site becomes visible
    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.refresh(); } catch (e) {}
      }
      // app.js needs to re-run updateUserNav so navbar shows correctly
      if (typeof window.updateUserNav === 'function') {
        try { window.updateUserNav(); } catch (e) {}
      }
    }, 120);
  }

  function showLoginGate() {
    const intro = $('intro-screen');
    const loginGate = $('login-gate');

    if (intro) intro.classList.add('stage-hidden');
    if (loginGate) loginGate.classList.remove('stage-hidden');

    document.body.classList.remove('intro-open');
    document.body.classList.add('login-gate-open');
  }

  function showIntroScreen() {
    const welcome = $('welcome-modal');
    const intro = $('intro-screen');
    const nextBtn = $('intro-next-btn');

    if (welcome) welcome.classList.remove('active');
    if (intro) {
      intro.classList.remove('stage-hidden');
      // Force reflow so the animation starts from scratch
      void intro.offsetWidth;
      intro.classList.add('active');
    }

    document.body.classList.add('intro-open');
    document.body.classList.remove('gate-open', 'login-gate-open');

    // After INTRO_DURATION, reveal the Next button
    if (nextBtn) {
      nextBtn.classList.remove('revealed');
      setTimeout(() => {
        nextBtn.classList.remove('stage-hidden');
        nextBtn.classList.add('revealed');
      }, INTRO_DURATION);
    }
  }

  // ============================================================
  // PUBLIC FUNCTIONS — used by inline onclick handlers
  // ============================================================

  window.enterSite = function () {
    const gate = $('entrance-gate');
    if (gate) gate.classList.add('hidden');
    document.body.classList.remove('gate-open');

    // If already logged in, skip straight to the full site
    if (isLoggedIn()) {
      showSite();
      return;
    }

    // Otherwise, show welcome modal after gate fades
    setTimeout(() => {
      const welcome = $('welcome-modal');
      if (welcome) welcome.classList.add('active');
    }, 700);
  };

  window.closeWelcome = function () {
    const welcome = $('welcome-modal');
    if (welcome) welcome.classList.remove('active');

    // If logged in, go straight to site
    if (isLoggedIn()) {
      showSite();
      return;
    }

    // Otherwise show intro screen
    setTimeout(showIntroScreen, 250);
  };

  window.advanceToLogin = function () {
    showLoginGate();
  };

  // ============================================================
  // Hook into login/register success
  // We poll for the aura_user key in localStorage because app.js
  // sets it via localStorage.setItem — not through a function call
  // we can hook into directly.
  // ============================================================
  function watchLoginState() {
    setInterval(() => {
      if (isLoggedIn() && !document.body.classList.contains('logged-in')) {
        // User just logged in somewhere (modal), advance to site
        showSite();
      }
    }, 400);
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    // If already logged in on page load, skip straight to site
    if (isLoggedIn()) {
      showSite();
      return;
    }

    // Dev shortcut — skip everything
    if (devSkip) {
      showSite();
      return;
    }

    // Default: entrance gate is visible (body has .gate-open in HTML)
    // Make sure intro & login-gate are hidden initially
    const intro = $('intro-screen');
    const loginGate = $('login-gate');
    if (intro) intro.classList.add('stage-hidden');
    if (loginGate) loginGate.classList.add('stage-hidden');

    // Start watching for login events
    watchLoginState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();