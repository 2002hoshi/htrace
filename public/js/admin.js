// Logic trang Admin: đăng nhập (token lưu localStorage), tạo game, xem danh sách.
'use strict';

const TOKEN_KEY = 'htrace_admin_token';

const el = {
  status: document.getElementById('admin-status'),
  viewLogin: document.getElementById('view-login'),
  viewAdmin: document.getElementById('view-admin'),
  loginForm: document.getElementById('login-form'),
  loginMsg: document.getElementById('login-msg'),
  logoutBtn: document.getElementById('logout-btn'),
  whoEmail: document.getElementById('who-email'),
  gameForm: document.getElementById('game-form'),
  gameMsg: document.getElementById('game-msg'),
  gameList: document.getElementById('game-list'),
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

// Gọi API có kèm token. Trả { ok, status, data }.
// Lỗi mạng (server tắt, mất kết nối) trả ok:false, status:0 kèm thông báo.
async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    return { ok: false, status: 0, data: { error: 'Không kết nối được server. Thử lại sau.' } };
  }
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    /* body rỗng */
  }
  return { ok: res.ok, status: res.status, data };
}

function showLogin() {
  el.viewAdmin.hidden = true;
  el.viewLogin.hidden = false;
  el.status.textContent = 'Chưa đăng nhập';
  el.status.className = 'status';
}

function showAdmin(email) {
  el.viewLogin.hidden = true;
  el.viewAdmin.hidden = false;
  el.whoEmail.textContent = email || '';
  el.status.textContent = '● đã đăng nhập';
  el.status.className = 'status ok';
}

function renderGames(games) {
  el.gameList.innerHTML = '';
  if (!games || games.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Chưa có game nào. Hãy tạo game đầu tiên!';
    el.gameList.appendChild(li);
    return;
  }
  // Mới nhất lên đầu.
  [...games].reverse().forEach((g) => {
    const li = document.createElement('li');
    const created = g.createdAt ? new Date(g.createdAt).toLocaleString('vi-VN') : '';
    li.innerHTML =
      `<strong></strong><span class="meta"></span>`;
    li.querySelector('strong').textContent = g.name;
    li.querySelector('.meta').textContent = `${g.teamCount} đội · ${created}`;
    el.gameList.appendChild(li);
  });
}

async function loadGames() {
  const r = await api('/games');
  if (r.ok) {
    renderGames(r.data.games);
  } else if (r.status === 401) {
    // Token hết hiệu lực giữa chừng -> quay về đăng nhập.
    setToken('');
    showLogin();
  }
}

// Kiểm tra token còn hiệu lực khi mở trang.
async function init() {
  if (!getToken()) {
    showLogin();
    return;
  }
  const r = await api('/me');
  if (r.ok) {
    showAdmin(r.data.admin.email);
    loadGames();
  } else {
    setToken('');
    showLogin();
  }
}

el.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.loginMsg.textContent = '';
  const fd = new FormData(el.loginForm);
  const r = await api('/login', {
    method: 'POST',
    body: { email: fd.get('email'), password: fd.get('password') },
  });
  if (r.ok) {
    setToken(r.data.token);
    el.loginForm.reset();
    showAdmin(r.data.admin.email);
    loadGames();
  } else {
    el.loginMsg.textContent = r.data.error || 'Đăng nhập thất bại.';
    el.loginMsg.className = 'msg bad';
  }
});

el.logoutBtn.addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  setToken('');
  showLogin();
});

el.gameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.gameMsg.textContent = '';
  const fd = new FormData(el.gameForm);
  const r = await api('/games', {
    method: 'POST',
    body: {
      name: fd.get('name'),
      teamCount: Number(fd.get('teamCount')),
      bannerUrl: fd.get('bannerUrl'),
    },
  });
  if (r.ok) {
    el.gameForm.reset();
    el.gameMsg.textContent = `Đã tạo game "${r.data.game.name}".`;
    el.gameMsg.className = 'msg ok';
    loadGames();
  } else if (r.status === 401) {
    setToken('');
    showLogin();
  } else {
    el.gameMsg.textContent = r.data.error || 'Tạo game thất bại.';
    el.gameMsg.className = 'msg bad';
  }
});

init();
