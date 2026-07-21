/**
 * js/core/cloud-save.js
 *
 * Player auth + cloud save client.
 * Pure fetch-based, credentials:'include' for cookie auth.
 * Gracefully returns null / signals guest mode when offline or unauthenticated.
 */

const API_BASE = '/api';

let _user = null;

export function isLoggedIn() {
  return _user !== null;
}

export function getEmail() {
  return _user ? _user.email : null;
}

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return res;
  } catch {
    return null;
  }
}

export async function getMe() {
  if (typeof fetch === 'undefined') return null;
  const res = await apiFetch('/me');
  if (!res || !res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function login(email, password) {
  if (typeof fetch === 'undefined') return null;
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    _user = data;
    return data;
  } catch { return null; }
}

export async function register(email, password) {
  if (typeof fetch === 'undefined') return null;
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    _user = data;
    return data;
  } catch { return null; }
}

export async function logout() {
  if (typeof fetch === 'undefined') return false;
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  _user = null;
  return !!(res && res.ok);
}

export async function fetchSave() {
  if (typeof fetch === 'undefined') return null;
  const res = await apiFetch('/save');
  if (!res) return null;
  if (res.status === 401) return { guest: true };
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function pushSave(saveObject) {
  if (typeof fetch === 'undefined') return null;
  const res = await apiFetch('/save', {
    method: 'PUT',
    body: JSON.stringify({ save: saveObject }),
  });
  if (!res) return null;
  if (res.status === 401) return { guest: true };
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

/**
 * Init cloud save: check auth, pull cloud save into gameState.
 * @param {object} gameState
 */
export async function initCloudSave(gameState) {
  const me = await getMe();
  if (me && me.email) {
    _user = me;
    const cloud = await fetchSave();
    if (cloud && cloud.save) {
      Object.assign(gameState.state, cloud.save);
      gameState.notify();
    } else if (cloud && !cloud.guest) {
      pushSave(gameState.state);
    }
  }
}

/**
 * Render login panel into container.
 * @param {HTMLElement} container
 * @param {object} gameState
 */
export function renderLoginPanel(container, gameState) {
  if (!container || typeof document === 'undefined') return;

  const update = () => {
    container.innerHTML = '';

    if (_user) {
      const row = document.createElement('div');
      row.className = 'cloud-row';

      const info = document.createElement('span');
      info.className = 'cloud-email';
      info.textContent = _user.email;

      const btn = document.createElement('button');
      btn.className = 'cloud-btn cloud-logout';
      btn.textContent = 'Logout';
      btn.addEventListener('click', async () => {
        await logout();
        update();
      });

      row.append(info, btn);
      container.appendChild(row);
    } else {
      const form = document.createElement('div');
      form.className = 'cloud-form';

      const email = document.createElement('input');
      email.type = 'email';
      email.placeholder = 'Email';
      email.className = 'cloud-input';

      const pass = document.createElement('input');
      pass.type = 'password';
      pass.placeholder = 'Password';
      pass.className = 'cloud-input';

      const btns = document.createElement('div');
      btns.className = 'cloud-btn-row';

      const loginBtn = document.createElement('button');
      loginBtn.className = 'cloud-btn cloud-login';
      loginBtn.textContent = 'Login';
      loginBtn.addEventListener('click', async () => {
        const data = await login(email.value, pass.value);
        if (data) {
          const cloud = await fetchSave();
          if (cloud && cloud.save) {
            Object.assign(gameState.state, cloud.save);
            gameState.notify();
          } else if (cloud && !cloud.guest) {
            pushSave(gameState.state);
          }
          update();
        }
      });

      const regBtn = document.createElement('button');
      regBtn.className = 'cloud-btn cloud-register';
      regBtn.textContent = 'Register';
      regBtn.addEventListener('click', async () => {
        const data = await register(email.value, pass.value);
        if (data) {
          const cloud = await fetchSave();
          if (cloud && cloud.save) {
            Object.assign(gameState.state, cloud.save);
            gameState.notify();
          } else if (cloud && !cloud.guest) {
            pushSave(gameState.state);
          }
          update();
        }
      });

      btns.append(loginBtn, regBtn);
      form.append(email, pass, btns);
      container.appendChild(form);
    }
  };

  update();
}
