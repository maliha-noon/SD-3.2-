/* ============================================================
   AURA++ — ANIMATIONS
   GSAP + ScrollTrigger based motion
   Loaded AFTER gsap.min.js and ScrollTrigger.min.js
   ============================================================ */

(function () {
  'use strict';

  const isTouch =
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bail out gracefully if GSAP failed to load
  if (typeof gsap === 'undefined') {
    console.warn('[AURA] GSAP not found — animations disabled.');
    // Make everything visible even without GSAP
    document.querySelectorAll('[data-anim="fade-up"]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('[data-anim="split-text"] span').forEach(el => {
      el.style.opacity = '1';
    });
    return;
  }

  // Register ScrollTrigger
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ============================================================
  // 1. HERO TEXT — split into letters and reveal
  // ============================================================
  function splitAndRevealHero() {
    const title = document.querySelector('[data-anim="split-text"]');
    if (!title) return;

    const lines = title.querySelectorAll('.serif-italic, .sans-bold');
    if (!lines.length) return;

    lines.forEach(line => {
      const text = line.textContent.trim();
      line.innerHTML = '';

      // Wrap each letter
      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(40px) rotate(6deg)';
        span.setAttribute('data-letter', i);
        line.appendChild(span);
      });
    });

    // Animate all letters in sequence
    const allLetters = title.querySelectorAll('span[data-letter]');

    gsap.to(allLetters, {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: prefersReducedMotion ? 0.01 : 1.1,
      ease: 'power3.out',
      stagger: prefersReducedMotion ? 0 : 0.02,
      delay: 0.3,
    });
  }

  // ============================================================
  // 2. HERO FADE-UP ITEMS (eyebrow, subtitle, button)
  // ============================================================
  function animateHeroExtras() {
    const items = document.querySelectorAll('.hero [data-anim="fade-up"]');
    if (!items.length) return;

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: prefersReducedMotion ? 0.01 : 1,
      ease: 'power3.out',
      stagger: prefersReducedMotion ? 0 : 0.18,
      delay: 1.1,
    });
  }

  // ============================================================
  // 3. SCROLL-TRIGGERED REVEALS
  // ============================================================
  function setupScrollReveals() {
    // All fade-up elements NOT inside the hero
    const scrollItems = document.querySelectorAll(
      '[data-anim="fade-up"]:not(.hero [data-anim="fade-up"])'
    );

    scrollItems.forEach(el => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.01 : 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

  // ============================================================
  // 4. EVENT CARDS — STAGGER IN
  // ============================================================
  // Called by app.js after cards render. We also auto-apply
  // when the grid is populated the first time.
  window.auraAnimateCards = function (container) {
    const grid = container || document.getElementById('events-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.event-card-3d');
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.01 : 1,
        ease: 'power3.out',
        stagger: prefersReducedMotion ? 0 : 0.09,
        scrollTrigger: {
          trigger: grid,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      }
    );
  };

  // Auto-trigger when events-grid first gets children
  function watchEventsGrid() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (grid.children.length > 0) {
      window.auraAnimateCards(grid);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      if (grid.children.length > 0) {
        window.auraAnimateCards(grid);
        obs.disconnect();
      }
    });

    observer.observe(grid, { childList: true });
  }

  // ============================================================
  // 5. SUBTLE PARALLAX ON HERO GRADIENT
  // ============================================================
  function heroParallax() {
    if (prefersReducedMotion || isTouch) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    gsap.to(hero, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  }

  // ============================================================
  // 6. CUSTOM CURSOR (desktop only)
  // ============================================================
  function customCursor() {
    if (isTouch) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.body.classList.add('cursor-active');
    });

    window.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
    });

    // Interactive hover targets
    const hoverTargets =
      'a, button, .event-card-3d, .corner-btn, .corner-pill, .page-btn, .pay-tab, .dash-tab, input, select, textarea';

    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.remove('cursor-hover');
      }
    });

    // Render loop
    gsap.ticker.add(() => {
      // Dot follows instantly
      gsap.set(dot, { x: mouseX, y: mouseY, xPercent: -50, yPercent: -50 });

      // Ring follows with easing
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      gsap.set(ring, { x: ringX, y: ringY, xPercent: -50, yPercent: -50 });
    });
  }

  // ============================================================
  // 7. MAGNETIC BUTTONS
  // ============================================================
  function magneticButtons() {
    if (isTouch || prefersReducedMotion) return;

    const buttons = document.querySelectorAll(
      '.btn-primary-3d, .gate-enter-btn, .btn-nav-seller, .welcome-continue-btn'
    );

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.22,
          y: y * 0.22,
          duration: 0.4,
          ease: 'power2.out',
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.45)',
        });
      });
    });
  }

  // ============================================================
  // 8. CARD HOVER — SUBTLE TILT
  // ============================================================
  function cardTilt() {
    if (isTouch || prefersReducedMotion) return;

    // Watch for cards being added dynamically
    document.addEventListener('mouseover', e => {
      const card = e.target.closest('.event-card-3d');
      if (!card || card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';

      card.addEventListener('mousemove', ev => {
        const rect = card.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotY = ((x - cx) / cx) * 3;
        const rotX = -((y - cy) / cy) * 3;

        gsap.to(card, {
          rotateX: rotX,
          rotateY: rotY,
          y: -8,
          duration: 0.5,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
        });
      });
    });
  }

  // ============================================================
  // 9. NAVBAR SCROLL STATE (belt + suspenders with inline script)
  // ============================================================
  function navbarScroll() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    let lastState = false;
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 40;
      if (scrolled !== lastState) {
        lastState = scrolled;
        if (scrolled) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      }
    });
  }

  // ============================================================
  // 10. PAGE-LOAD INIT
  // ============================================================
  function init() {
    document.body.classList.add('gsap-ready');
    splitAndRevealHero();
    animateHeroExtras();
    setupScrollReveals();
    watchEventsGrid();
    heroParallax();
    customCursor();
    magneticButtons();
    cardTilt();
    navbarScroll();

    // Refresh ScrollTrigger once webfonts finish loading
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();