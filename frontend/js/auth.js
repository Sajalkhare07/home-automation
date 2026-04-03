// js/auth.js
const API = 'http://localhost:5000/api';

// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('signup-form').classList.toggle('hidden', isLogin);
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', isLogin ? i === 0 : i === 1);
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'dashboard.html';

  } catch (error) {
    err.textContent = error.message;
    err.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const err = document.getElementById('signup-error');
  err.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     document.getElementById('signup-name').value,
        email:    document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
      }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'dashboard.html';

  } catch (error) {
    err.textContent = error.message;
    err.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}