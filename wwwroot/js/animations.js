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

  // Small shared motion API for dynamically rendered interface states.
  // Every method degrades to visible content without GSAP and honors reduced motion.
  window.AuraMotion = {
    reveal(elements, options = {}) {
      const nodes = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
      if (!nodes || !nodes.length) return;
      if (prefersReducedMotion) {
        nodes.forEach(node => { node.style.opacity = '1'; node.style.transform = 'none'; });
        return;
      }
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(nodes, { opacity: 0, y: options.distance || 20 }, {
          opacity: 1, y: 0, duration: options.duration || .55,
          stagger: options.stagger || 0, ease: 'power3.out', clearProps: 'opacity,transform',
        });
        return;
      }
      nodes.forEach(node => { node.style.opacity = '1'; node.style.transform = 'none'; });
    },
    fadeIn(elements, options = {}) { this.reveal(elements, { ...options, distance: 0 }); },
    exit(elements, options = {}) {
      const nodes = Array.from(typeof elements === 'string' ? document.querySelectorAll(elements) : (elements || []));
      if (!nodes.length || prefersReducedMotion || typeof gsap === 'undefined') {
        nodes.forEach(node => { node.style.opacity = '0'; });
        return Promise.resolve();
      }
      return new Promise(resolve => gsap.to(nodes, {
        autoAlpha: 0, y: 10, duration: options.duration || .18,
        stagger: options.stagger || .025, ease: 'power2.in', overwrite: 'auto', onComplete: resolve,
      }));
    },
    slideIn(elements, options = {}) { this.reveal(elements, { ...options, distance: options.distance || 28 }); },
    staggerReveal(elements, options = {}) { this.reveal(elements, { ...options, stagger: options.stagger || 0.08 }); },
    scaleIn(elements, options = {}) {
      const nodes = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
      if (!nodes || !nodes.length || prefersReducedMotion || typeof gsap === 'undefined') return this.reveal(nodes, options);
      gsap.fromTo(nodes, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: options.duration || .45, stagger: options.stagger || 0, ease: 'power3.out', clearProps: 'opacity,transform' });
    },
    observe(selector, options = {}) {
      if (prefersReducedMotion || !('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { this.reveal([entry.target], options); observer.unobserve(entry.target); }
      }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
      document.querySelectorAll(selector).forEach(node => observer.observe(node));
      return observer;
    },
    verification: {
      begin(ticket) {
        if (!ticket) return;
        ticket.dataset.state = 'scanning';
        ticket.classList.add('is-scanning');
      },
      finish(ticket, state) {
        if (!ticket) return;
        ticket.classList.remove('is-scanning');
        ticket.dataset.state = state;
        if (state === 'verified' && !prefersReducedMotion && typeof gsap !== 'undefined') {
          const mark = ticket.querySelector('.verify-result-mark');
          if (mark) gsap.fromTo(mark, { scale: .82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .48, ease: 'back.out(1.5)', overwrite: 'auto' });
        }
      },
      reset(ticket) {
        if (!ticket) return;
        ticket.classList.remove('is-scanning');
        ticket.dataset.state = 'idle';
      },
    },
    magnetic(elements, options = {}) {
      const nodes = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
      if (!nodes || prefersReducedMotion || isTouch || typeof gsap === 'undefined') return;
      nodes.forEach(node => {
        if (node.dataset.auraMagneticBound) return;
        node.dataset.auraMagneticBound = 'true';
        node.addEventListener('pointermove', event => {
          const rect = node.getBoundingClientRect();
          const max = options.max || 5;
          const x = ((event.clientX - rect.left) / rect.width - .5) * max;
          const y = ((event.clientY - rect.top) / rect.height - .5) * max;
          gsap.to(node, { x, y, duration: .22, ease: 'power2.out', overwrite: true });
        });
        node.addEventListener('pointerleave', () => gsap.to(node, { x: 0, y: 0, duration: .28, ease: 'power2.out', overwrite: true }));
      });
    },
  };

  let heroPlayed = false;
  const hero = document.querySelector('.hero-cinema');
  if (hero && !prefersReducedMotion && typeof gsap !== 'undefined') {
    document.body.classList.add('aura-motion-pending');
  }

  // Called only after the entry/auth gate reveals the homepage, so the sequence
  // is not spent animating behind a hidden layer.
  window.auraPlayHero = function () {
    if (heroPlayed || !hero) return;
    heroPlayed = true;
    document.body.classList.remove('aura-motion-pending');
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo('.hero-backdrop', { autoAlpha: 0, scale: 1.035 }, { autoAlpha: 1, scale: 1, duration: .85 })
      .fromTo('.hero-grain', { autoAlpha: 0 }, { autoAlpha: .18, duration: .6 }, '-=.55')
      .fromTo('.hero-identity', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .42 }, '-=.2')
      .fromTo('.hero-line-inner', { yPercent: 112, rotate: 1.5 }, { yPercent: 0, rotate: 0, duration: .72, stagger: .13 }, '-=.04')
      .fromTo('.hero-subtitle', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .48 }, '-=.2')
      .fromTo('.hero-actions', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .42 }, '-=.16')
      .fromTo('.hero-art', { autoAlpha: 0, x: 42, scale: .98, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, x: 0, scale: 1, clipPath: 'inset(0 0 0% 0)', duration: .8, ease: 'power2.out' }, '-=.04')
      .fromTo('.hero-ticket-object', { autoAlpha: 0, y: 18, rotate: -15 }, { autoAlpha: 1, y: 0, rotate: -8, duration: .55, ease: 'back.out(1.35)' }, '-=.28')
      .fromTo('.hero-art-note, .hero-detail-row, .hero-scroll-cue', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .38, stagger: .08 }, '-=.16');
    return timeline;
  };

  function heroPointerResponse() {
    if (!hero || isTouch || prefersReducedMotion) return;
    const layers = [
      { node: hero.querySelector('[data-hero-layer="backdrop"]'), factor: 2.2 },
      { node: hero.querySelector('[data-hero-layer="art"]'), factor: 6 },
    ].filter(layer => layer.node);
    let frame = 0;
    let point = null;

    hero.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      point = { x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!point) return;
        layers.forEach(({ node, factor }) => {
          // Individual translate composes with GSAP's transform instead of
          // overwriting the entrance timeline's x/scale animation.
          node.style.translate = `${(-point.x * factor).toFixed(2)}px ${(-point.y * factor).toFixed(2)}px`;
        });
      });
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      point = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      layers.forEach(({ node }) => { node.style.translate = ''; });
    }, { passive: true });
  }

  // Bail out gracefully if GSAP failed to load
  if (typeof gsap === 'undefined') {
    console.warn('[AURA] GSAP not found — animations disabled.');
    document.body.classList.remove('aura-motion-pending');
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

  // Scroll-triggered editorial section reveals.
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

    if (prefersReducedMotion || typeof ScrollTrigger === 'undefined') return;
    gsap.fromTo('.ticket-proof', { autoAlpha: 0, x: 34, rotate: 7 }, {
      autoAlpha: 1, x: 0, rotate: 3, duration: .75, ease: 'power3.out',
      scrollTrigger: { trigger: '.ticket-story', start: 'top 72%', toggleActions: 'play none none none' },
    });
    gsap.fromTo('.resale-trust-panel', { autoAlpha: 0, x: 20 }, {
      autoAlpha: 1, x: 0, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: '.resale-trust', start: 'top 72%', toggleActions: 'play none none none' },
    });
  }

  function setupHeroScroll() {
    if (isTouch || prefersReducedMotion || typeof ScrollTrigger === 'undefined') return;
    gsap.to('.hero-grain', {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .55 },
    });
  }

  // Event cards are populated by the marketplace API; animate after render.
  // Called by app.js after cards render. We also auto-apply
  // when the grid is populated the first time.
  window.auraAnimateCards = function (container, options = {}) {
    const grid = container || document.getElementById('events-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.event-card-3d');
    if (!cards.length) return;

    if (options.immediate || prefersReducedMotion || typeof ScrollTrigger === 'undefined') {
      gsap.fromTo(cards, { opacity: 0, y: prefersReducedMotion ? 0 : 18 }, {
        opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : .42,
        ease: 'power3.out', stagger: prefersReducedMotion ? 0 : .055, clearProps: 'opacity,transform',
      });
      return;
    }

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
    setupScrollReveals();
    heroPointerResponse();
    setupHeroScroll();
    if (document.body.classList.contains('aura-site-open')) window.auraPlayHero();
    // Button feedback stays in CSS so hover and pressed transforms never compete
    // with a pointer-driven transform tween.
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
