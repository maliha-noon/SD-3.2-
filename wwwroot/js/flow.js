/* ============================================================
   AURA++ — FLOW CONTROLLER
   Stage sequence:
     1. Entrance gate → 2. Welcome modal → 3. Intro screen
     → 4. Public discovery (accounts are needed for booking/account tools)
   Returning users skip straight to the full site.
   ============================================================ */

(function () {
  'use strict';

  const INTRO_DURATION = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 4000;

  const params = new URLSearchParams(window.location.search);
  const devSkip = params.get('skipIntro') === '1';

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
    document.body.classList.remove('gate-open', 'intro-open');
    document.body.classList.add('aura-site-open');
    if (typeof window.auraPlayHero === 'function') window.auraPlayHero();

    const gate = $('entrance-gate');
    const intro = $('intro-screen');
    const welcome = $('welcome-modal');

    if (gate) gate.classList.add('hidden');
    if (intro) intro.classList.add('stage-hidden');
    if (welcome) welcome.classList.remove('active');
    if (welcome) welcome.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.refresh(); } catch (e) {}
      }
      if (typeof window.updateUserNav === 'function') {
        try { window.updateUserNav(); } catch (e) {}
      }
    }, 120);
  }

  function showIntroScreen() {
    const welcome = $('welcome-modal');
    const intro = $('intro-screen');
    const nextBtn = $('intro-next-btn');

    if (welcome) welcome.classList.remove('active');
    if (intro) {
      intro.classList.remove('stage-hidden');
      void intro.offsetWidth;
      intro.classList.add('active');
      const title = intro.querySelector('.intro-title');
      if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    }

    document.body.classList.add('intro-open');
    document.body.classList.remove('gate-open');

    if (nextBtn) {
      nextBtn.classList.remove('revealed');
      setTimeout(() => {
        nextBtn.classList.remove('stage-hidden');
        nextBtn.classList.add('revealed');
      }, INTRO_DURATION);
    }
  }

  // ============================================================
  // PUBLIC
  // ============================================================

  window.enterSite = function () {
    const gate = $('entrance-gate');
    if (gate) gate.classList.add('hidden');
    document.body.classList.remove('gate-open');

    if (isLoggedIn()) {
      showSite();
      return;
    }

    setTimeout(() => {
      const welcome = $('welcome-modal');
      if (welcome) {
        welcome.setAttribute('aria-hidden', 'false');
        welcome.classList.add('active');
        const focusTarget = welcome.querySelector('button:not(:disabled)');
        focusTarget?.focus({ preventScroll: true });
      }
    }, INTRO_DURATION ? 700 : 0);
  };

  window.closeWelcome = function () {
    const welcome = $('welcome-modal');
    if (welcome) welcome.classList.remove('active');
    if (welcome) welcome.setAttribute('aria-hidden', 'true');

    if (isLoggedIn()) {
      showSite();
      return;
    }

    setTimeout(showIntroScreen, INTRO_DURATION ? 250 : 0);
  };

  window.advanceToDiscovery = function () {
    showSite();
  };

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    if (isLoggedIn()) {
      showSite();
      return;
    }

    if (devSkip) {
      showSite();
      return;
    }

    const intro = $('intro-screen');
    if (intro) intro.classList.add('stage-hidden');

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
