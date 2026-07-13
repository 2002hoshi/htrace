// Trang QR: đọc game từ query, lấy QR từ API (cần token admin ở localStorage).
'use strict';

const TOKEN_KEY = 'htrace_admin_token';

const el = {
  game: document.getElementById('qr-game'),
  box: document.getElementById('qr-box'),
  hint: document.getElementById('qr-hint'),
  link: document.getElementById('qr-link'),
  msg: document.getElementById('qr-msg'),
};

function fail(text) {
  el.game.textContent = 'Không hiển thị được QR';
  el.hint.hidden = true;
  el.msg.className = 'msg bad';
  el.msg.textContent = text;
}

async function main() {
  const gameId = new URLSearchParams(location.search).get('game');
  if (!gameId) {
    fail('Thiếu tham số game trong đường dẫn (?game=...).');
    return;
  }

  const token = localStorage.getItem(TOKEN_KEY) || '';
  if (!token) {
    fail('Cần đăng nhập ở trang admin trước rồi mở lại trang QR.');
    return;
  }

  let res;
  try {
    res = await fetch(`/api/admin/games/${encodeURIComponent(gameId)}/qr`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (_) {
    fail('Không kết nối được server. Thử lại sau.');
    return;
  }

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    /* body rỗng */
  }

  if (res.status === 401) {
    fail('Phiên đăng nhập đã hết hạn. Đăng nhập lại ở trang admin.');
    return;
  }
  if (res.status === 404) {
    fail('Không tìm thấy game này.');
    return;
  }
  if (!res.ok) {
    fail(data.error || 'Không tạo được mã QR.');
    return;
  }
  if (!data.game || !data.qrSvg) {
    fail('Dữ liệu QR không hợp lệ.');
    return;
  }

  // qrSvg do thư viện qrcode sinh từ link nội bộ -> an toàn để chèn.
  el.game.textContent = data.game.name;
  el.box.innerHTML = data.qrSvg;
  el.link.textContent = data.joinUrl;
}

main();
