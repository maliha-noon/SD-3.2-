/* ============================================================
   AURA++ — AUTH BRIDGE
   - Shows site if user is logged in
   - Wires login/register buttons to full pages
   - Applies role to DOM for role-aware UI
   - NEW: If the backend response is missing "role", we
     fall back to a hardcoded lookup so the sidebar still works
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // Fallback roles in case the backend forgets to send "role"
  const KNOWN_ROLES = {
    'shanti@aura.com': 'Admin',
    'maliha@aura.com': 'Organizer',
    'john@aura.com': 'Customer'
  };

  function getUser() {
    try {
      const raw = localStorage.getItem('aura_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function resolveRole(user) {
    if (!user) return 'Customer';
    if (user.role) return user.role;
    const email = (user.email || '').toLowerCase();
    if (KNOWN_ROLES[email]) return KNOWN_ROLES[email];
    if (user.isSubscribed) return 'Organizer';
    return 'Customer';
  }

  function hasValidUser() {
    const u = getUser();
    return !!(u && (u.id || u.email));
  }

  function applyRole(user) {
    const role = resolveRole(user);

    // Persist the resolved role so other scripts see it too
    if (user && user.role !== role) {
      user.role = role;
      try { localStorage.setItem('aura_user', JSON.stringify(user)); } catch (e) {}
    }

    document.body.setAttribute('data-role', role);

    document.querySelectorAll('[data-role-only]').forEach(el => {
      const allowed = el.getAttribute('data-role-only');
      if (!allowed) return;
      const roles = allowed.split(',').map(s => s.trim().toLowerCase());
      if (roles.includes(role.toLowerCase())) el.style.display = '';
      else el.style.display = 'none';
    });
  }

  function showFullSite() {
    const gate = $('entrance-gate');
    const welcome = $('welcome-modal');
    const intro = $('intro-screen');

    if (gate) gate.classList.add('hidden');
    if (welcome) welcome.classList.remove('active');
    if (intro) intro.classList.add('stage-hidden');
    document.body.classList.remove('gate-open', 'intro-open');
    document.body.classList.add('aura-site-open');
    if (typeof window.auraPlayHero === 'function') window.auraPlayHero();

    if (typeof window.updateUserNav === 'function') {
      try { window.updateUserNav(); } catch (e) {}
    }

    const user = getUser();
    if (user) {
      const name = user.fullName || user.email || 'User';
      const first = name.split(' ')[0];

      if ($('logged-user-name')) $('logged-user-name').textContent = name;
      if ($('dash-username')) $('dash-username').textContent = name;
      if ($('dash-home-username')) $('dash-home-username').textContent = first;
      if ($('dash-avatar')) $('dash-avatar').textContent = name.charAt(0).toUpperCase();

      applyRole(user);
    }

    if (typeof ScrollTrigger !== 'undefined') {
      try { ScrollTrigger.refresh(); } catch (e) {}
    }
  }

  // ---------- login gate buttons → real pages ----------
  function wireGateButtons() {
    window.openLoginModal = function () { window.location.href = 'login.html'; };
    window.openRegisterModal = function () { window.location.href = 'register.html'; };
    window.openForgotPasswordModal = function () { window.location.href = 'login.html'; };
  }

  // ---------- modal submit handlers ----------
  function patchFormHandlers() {
    window.handleLogin = async function (e) {
      if (e) e.preventDefault();
      const email = ($('login-email') || {}).value || '';
      const password = ($('login-password') || {}).value || '';
      if (!email || !password) return;
      const submitButton = e?.submitter || e?.target?.querySelector('button[type="submit"]');
      if (typeof setActionLoading === 'function') setActionLoading(submitButton, true, 'Signing in...');

      let user = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.user) user = data.user;
        else throw new Error(data.message || 'Sign in failed.');
      } catch (err) {}
      if (!user) {
        if (typeof setActionLoading === 'function') setActionLoading(submitButton, false);
        if (typeof showToast === 'function') showToast('AURA could not sign you in. Check your connection and credentials.', 'error');
        return;
      }
      user.role = resolveRole(user);
      localStorage.setItem('aura_user', JSON.stringify(user));
      if (typeof closeModals === 'function') closeModals();
      showFullSite();
      if (typeof setActionLoading === 'function') setActionLoading(submitButton, false);
    };

    window.handleRegister = async function (e) {
      if (e) e.preventDefault();
      const fullName = ($('reg-fullname') || {}).value || '';
      const email = ($('reg-email') || {}).value || '';
      const phone = ($('reg-phone') || {}).value || '';
      const password = ($('reg-password') || {}).value || '';
      const confirm = ($('reg-confirm-password') || {}).value || '';
      const submitButton = e?.submitter || e?.target?.querySelector('button[type="submit"]');

      if (password && confirm && password !== confirm) {
        if (typeof showToast === 'function') showToast('Passwords do not match.');
        return;
      }
      if (typeof setActionLoading === 'function') setActionLoading(submitButton, true, 'Creating account...');

      let user = null;
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone, password })
        });
        const data = await res.json();
        if (res.ok && data.user) user = data.user;
        else throw new Error(data.message || 'Registration failed.');
      } catch (err) {}
      if (!user) {
        if (typeof setActionLoading === 'function') setActionLoading(submitButton, false);
        if (typeof showToast === 'function') showToast('AURA could not create your account. Check your details and try again.', 'error');
        return;
      }
      user.role = resolveRole(user);
      localStorage.setItem('aura_user', JSON.stringify(user));
      if (typeof closeModals === 'function') closeModals();
      showFullSite();
      if (typeof setActionLoading === 'function') setActionLoading(submitButton, false);
    };

    window.handleGoogleLogin = function () {
      if (typeof showToast === 'function') showToast('Google sign in is not connected yet.');
    };
  }

  function patchLogout() {
    const origLogout = window.logoutUser;
    window.logoutUser = function () {
      localStorage.removeItem('aura_user');
      localStorage.removeItem('aura_subscribed');
      if (typeof origLogout === 'function') {
        try { origLogout(); } catch (e) {}
      }
      setTimeout(() => window.location.reload(), 300);
    };
  }

  // ---------- init ----------
  function init() {
    wireGateButtons();
    patchFormHandlers();
    patchLogout();

    if (hasValidUser()) showFullSite();

    window.addEventListener('storage', (e) => {
      if (e.key === 'aura_user' && e.newValue) showFullSite();
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
