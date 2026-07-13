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

    const head = document.createElement('div');
    head.className = 'game-head';
    const strong = document.createElement('strong');
    strong.textContent = g.name;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${g.teamCount} đội · ${created}`;
    head.append(strong, meta);

    const teamsArea = document.createElement('div');
    teamsArea.className = 'teams-area';
    teamsArea.textContent = 'Đang tải đội…';

    li.append(head, teamsArea);
    el.gameList.appendChild(li);
    loadTeams(g, teamsArea);
  });
}

// Tải danh sách đội của 1 game rồi vẽ khu đội tương ứng.
async function loadTeams(game, area) {
  const r = await api(`/games/${game.id}/teams`);
  if (r.status === 401) {
    setToken('');
    showLogin();
    return;
  }
  if (!r.ok) {
    area.className = 'teams-area';
    area.textContent = r.data.error || 'Lỗi tải đội.';
    return;
  }
  renderTeamsArea(game, area, r.data.teams);
}

// Vẽ khu đội: chưa có -> nút sinh; đã có -> danh sách chip tên đội.
function renderTeamsArea(game, area, teams) {
  area.className = 'teams-area';
  area.innerHTML = '';

  if (teams.length === 0) {
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.textContent = `Sinh slot đội (${game.teamCount})`;
    const msg = document.createElement('p');
    msg.className = 'msg';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      msg.className = 'msg';
      msg.textContent = 'Đang sinh…';
      const r = await api(`/games/${game.id}/teams`, { method: 'POST' });
      if (r.status === 401) {
        setToken('');
        showLogin();
        return;
      }
      if (r.ok) {
        renderTeamsArea(game, area, r.data.teams);
      } else if (r.status === 409) {
        // Đã sinh ở nơi khác (tab/phiên khác) -> tải lại để hiện trạng thái thật.
        loadTeams(game, area);
      } else {
        btn.disabled = false;
        msg.className = 'msg bad';
        msg.textContent = r.data.error || 'Sinh slot đội thất bại.';
      }
    });
    area.append(btn, msg);
    return;
  }

  const label = document.createElement('div');
  label.className = 'teams-label';
  label.textContent = `Đã sinh ${teams.length} đội:`;
  const chips = document.createElement('div');
  chips.className = 'team-chips';
  teams.forEach((t) => {
    const chip = document.createElement('span');
    chip.className = 'team-chip';
    chip.textContent = t.name;
    chips.appendChild(chip);
  });
  area.append(label, chips);
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
