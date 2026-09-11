const loginView = document.querySelector('#loginView');
const appView = document.querySelector('#appView');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const userName = document.querySelector('#userName');
const userRole = document.querySelector('#userRole');
const healthStatus = document.querySelector('#healthStatus');

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: response.status, data });
  return data;
}

function showApp(user) {
  loginView.hidden = true;
  appView.hidden = false;
  userName.textContent = user.name;
  userRole.textContent = user.role;
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
}

async function boot() {
  try {
    const { user } = await api('/api/auth/me', { method: 'GET' });
    showApp(user);
    const health = await api('/api/health', { method: 'GET' });
    healthStatus.textContent = health.ok ? 'Online' : 'Có lỗi';
  } catch {
    showLogin();
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.hidden = true;
  try {
    const { user } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value,
      }),
    });
    showApp(user);
    const health = await api('/api/health', { method: 'GET' });
    healthStatus.textContent = health.ok ? 'Online' : 'Có lỗi';
  } catch (error) {
    loginError.textContent = error.status === 401 ? 'Email hoặc mật khẩu không đúng.' : 'Không thể đăng nhập.';
    loginError.hidden = false;
  }
});

document.querySelector('#logoutBtn').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } finally { showLogin(); }
});

boot();
