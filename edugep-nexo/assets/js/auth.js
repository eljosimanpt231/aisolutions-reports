// NEXO Dashboard - Auth client-side
// MVP: password hasheada SHA-256 no bundle. Upgrade path para n8n server-side documentado em README.
// Rate limit local: 5 tentativas / 60s.

(function() {
  'use strict';

  // Hash SHA-256 da password oficial.
  // Password actual: "nexo-edugep-setubal-2026"
  // Para trocar: gerar nova hash com `node -e "console.log(require('crypto').createHash('sha256').update('NOVA_PASSWORD').digest('hex'))"`
  const PW_HASH = '6a2f9fe23230688fe03ba7b5b65a581ec7443b40f69709af889c9b60ccaf73e3';
  const SESSION_MS = 8 * 60 * 60 * 1000; // 8h
  const STORAGE_KEY = 'nexo_auth_v1';
  const RL_KEY = 'nexo_auth_rl';
  const RL_MAX = 5;
  const RL_WINDOW_MS = 60 * 1000;

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function checkSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.expires_at) return false;
      if (Date.now() > data.expires_at) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function setSession() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      issued_at: Date.now(),
      expires_at: Date.now() + SESSION_MS,
      nonce: crypto.getRandomValues(new Uint32Array(2)).join('-'),
    }));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function checkRateLimit() {
    try {
      const raw = localStorage.getItem(RL_KEY);
      if (!raw) return { ok: true, remaining: RL_MAX };
      const arr = JSON.parse(raw);
      const now = Date.now();
      const recent = arr.filter(t => now - t < RL_WINDOW_MS);
      localStorage.setItem(RL_KEY, JSON.stringify(recent));
      return { ok: recent.length < RL_MAX, remaining: RL_MAX - recent.length };
    } catch (e) {
      return { ok: true, remaining: RL_MAX };
    }
  }

  function recordFail() {
    try {
      const raw = localStorage.getItem(RL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(Date.now());
      localStorage.setItem(RL_KEY, JSON.stringify(arr));
    } catch (e) { /* noop */ }
  }

  function clearRateLimit() {
    localStorage.removeItem(RL_KEY);
  }

  function showApp() {
    const overlay = document.getElementById('edugep-pw-overlay');
    const app = document.getElementById('edugep-app');
    if (overlay) overlay.style.display = 'none';
    if (app) {
      app.style.display = 'block';
      app.classList.add('edugep-fade-in');
    }
    // Notifica dashboard.js que pode iniciar
    document.dispatchEvent(new CustomEvent('edugep-auth-success'));
  }

  function showOverlay() {
    const overlay = document.getElementById('edugep-pw-overlay');
    const app = document.getElementById('edugep-app');
    if (overlay) overlay.style.display = 'flex';
    if (app) app.style.display = 'none';
    const input = document.getElementById('edugep-pw-input');
    if (input) input.focus();
  }

  async function submit(e) {
    e.preventDefault();
    const rl = checkRateLimit();
    const errEl = document.getElementById('edugep-pw-error');
    const input = document.getElementById('edugep-pw-input');

    if (!rl.ok) {
      errEl.textContent = `Demasiadas tentativas. Aguarde ~1 minuto.`;
      return;
    }

    const pw = input.value.trim();
    if (!pw) {
      errEl.textContent = 'Insira a palavra-passe';
      return;
    }

    errEl.textContent = 'A validar…';

    const hash = await sha256(pw);
    if (hash === PW_HASH) {
      clearRateLimit();
      setSession();
      errEl.textContent = '';
      input.value = '';
      showApp();
    } else {
      recordFail();
      const rlAfter = checkRateLimit();
      errEl.textContent = `Palavra-passe incorrecta. Tentativas restantes: ${rlAfter.remaining}`;
      input.select();
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    if (checkSession()) {
      showApp();
    } else {
      showOverlay();
    }

    const form = document.getElementById('edugep-pw-form');
    if (form) form.addEventListener('submit', submit);

    const logoutBtn = document.getElementById('edugep-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearSession();
        showOverlay();
      });
    }
  });

  // Expose para debug
  window.edugepAuth = { clearSession, checkSession, sha256 };
})();
