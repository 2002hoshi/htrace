// Trang player: quét QR vào game -> nhận & hiển thị slot đội.
// Danh tính đội giữ ở localStorage theo gameId (key htrace_team_<gameId>).
'use strict';

const el = {
  loading: document.getElementById('view-loading'),
  joined: document.getElementById('view-joined'),
  full: document.getElementById('view-full'),
  error: document.getElementById('view-error'),
  teamName: document.getElementById('team-name'),
  errorMsg: document.getElementById('error-msg'),
};

// Chỉ hiện đúng 1 khu, ẩn các khu còn lại.
function show(view) {
  [el.loading, el.joined, el.full, el.error].forEach((v) => {
    v.hidden = v !== view;
  });
}

function showError(text) {
  el.errorMsg.textContent = text;
  show(el.error);
}

function showTeam(name) {
  el.teamName.textContent = name;
  show(el.joined);
}

function teamKey(gameId) {
  return `htrace_team_${gameId}`;
}

// localStorage có thể ném lỗi (chế độ ẩn danh / bị tắt) -> bọc an toàn.
function getSavedTeamId(gameId) {
  try {
    return localStorage.getItem(teamKey(gameId));
  } catch (_) {
    return null;
  }
}
function saveTeamId(gameId, teamId) {
  try {
    localStorage.setItem(teamKey(gameId), teamId);
  } catch (_) {
    /* không có storage -> vẫn hiển thị đội, chỉ là reload sẽ join lại */
  }
}
function clearTeamId(gameId) {
  try {
    localStorage.removeItem(teamKey(gameId));
  } catch (_) {
    /* bỏ qua */
  }
}

// Gọi API player. Trả { ok, status, data }; lỗi mạng -> status 0.
async function api(path, method = 'GET') {
  let res;
  try {
    res = await fetch(`/api/player${path}`, { method });
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

async function joinGame(gameId) {
  const r = await api(`/games/${encodeURIComponent(gameId)}/join`, 'POST');
  if (r.ok && r.data.team) {
    saveTeamId(gameId, r.data.team.id);
    showTeam(r.data.team.name);
    return;
  }
  if (r.status === 409 && r.data.notReady) {
    showError('Game chưa mở để tham gia. Quay lại sau nhé!');
    return;
  }
  if (r.status === 409) {
    show(el.full);
    return;
  }
  if (r.status === 404) {
    showError('Không tìm thấy game này. Kiểm tra lại mã QR nhé.');
    return;
  }
  showError(r.data.error || 'Không vào được game. Thử lại sau.');
}

async function main() {
  const gameId = new URLSearchParams(location.search).get('game');
  if (!gameId) {
    showError('Thiếu mã game trong đường dẫn. Hãy quét lại QR.');
    return;
  }

  // Đã có teamId lưu -> hiển thị lại đúng đội, không chiếm slot mới.
  const savedTeamId = getSavedTeamId(gameId);
  if (savedTeamId) {
    const r = await api(`/games/${encodeURIComponent(gameId)}/teams/${encodeURIComponent(savedTeamId)}`);
    if (r.ok && r.data.team) {
      showTeam(r.data.team.name);
      return;
    }
    if (r.status === 404) {
      // teamId chết (đổi máy/xóa dữ liệu server) -> quên đi rồi join lại.
      clearTeamId(gameId);
    } else {
      // Lỗi khác (mạng/5xx): KHÔNG join mới để tránh chiếm slot thứ 2; giữ teamId.
      showError(r.data.error || 'Không tải lại được đội. Thử lại sau.');
      return;
    }
  }

  await joinGame(gameId);
}

main();
