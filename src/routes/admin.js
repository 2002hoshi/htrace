'use strict';

/**
 * Các API dành cho Admin.
 *
 * Hiện có: đăng nhập, thêm admin, tạo/liệt kê game. Mọi route (trừ /login) đều
 * qua middleware requireAdmin. Các chức năng khác (trạm, câu hỏi, chấm điểm,
 * sinh slot đội...) sẽ bổ sung ở các story sau.
 */

const crypto = require('crypto');
const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const auth = require('../auth');
const { buildTeamSlots } = require('../teams');
const { buildJoinUrl } = require('../qr');

const router = express.Router();

// ---- Công khai: đăng nhập ----------------------------------------------------

router.post('/login', (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Cần nhập email và mật khẩu.' });
  }

  const { admins } = db.read();
  const admin = admins.find((a) => a.email.toLowerCase() === email);
  // Luôn chạy verify (dùng hash mồi khi không có admin) để thời gian phản hồi
  // đồng đều; thông báo chung chung, không tiết lộ email hay mật khẩu sai.
  const ok = auth.verifyPassword(password, admin ? admin.passwordHash : auth.DUMMY_HASH);
  if (!admin || !ok) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }

  const token = auth.createToken(admin.id);
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

// ---- Từ đây trở xuống: bắt buộc đăng nhập ------------------------------------

router.use(auth.requireAdmin);

// Đăng xuất: hủy token hiện tại.
router.post('/logout', (req, res) => {
  auth.revokeToken(req.token);
  res.json({ ok: true });
});

// Admin đang đăng nhập là ai.
router.get('/me', (req, res) => {
  const { admins } = db.read();
  const admin = admins.find((a) => a.id === req.adminId);
  if (!admin) return res.status(401).json({ error: 'Phiên không hợp lệ.' });
  res.json({ admin: { id: admin.id, email: admin.email } });
});

// Thêm admin mới (chỉ admin đã đăng nhập).
router.post('/admins', (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Cần nhập email và mật khẩu.' });
  }

  const created = db.update((data) => {
    if (data.admins.some((a) => a.email.toLowerCase() === email)) return null;
    const admin = {
      id: crypto.randomUUID(),
      email,
      passwordHash: auth.hashPassword(password),
    };
    data.admins.push(admin);
    return admin;
  });

  if (!created) {
    return res.status(409).json({ error: 'Email này đã tồn tại.' });
  }
  res.status(201).json({ admin: { id: created.id, email: created.email } });
});

// Liệt kê game.
router.get('/games', (req, res) => {
  const { games } = db.read();
  res.json({ games });
});

// Tạo game — thực thể nền tảng cho mọi thứ khác.
router.post('/games', (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const bannerUrl = typeof body.bannerUrl === 'string' ? body.bannerUrl.trim() : '';
  // Chỉ nhận number hoặc string cho số đội; loại bỏ array/boolean/object để
  // Number() không "ăn may" (Number([5])===5, Number(true)===1).
  const rawCount = body.teamCount;
  const teamCount =
    typeof rawCount === 'number' || typeof rawCount === 'string' ? Number(rawCount) : NaN;

  if (!name) {
    return res.status(400).json({ error: 'Cần nhập tên game.' });
  }
  if (!Number.isInteger(teamCount) || teamCount < 1) {
    return res.status(400).json({ error: 'Số đội phải là số nguyên ≥ 1.' });
  }

  const game = {
    id: crypto.randomUUID(),
    name,
    bannerUrl: bannerUrl || null,
    teamCount,
    createdAt: new Date().toISOString(),
  };

  db.update((data) => {
    data.games.push(game);
    return game;
  });

  res.status(201).json({ game });
});

// Liệt kê đội của 1 game.
router.get('/games/:gameId/teams', (req, res) => {
  const { games, teams } = db.read();
  if (!games.some((g) => g.id === req.params.gameId)) {
    return res.status(404).json({ error: 'Không tìm thấy game.' });
  }
  res.json({ teams: teams.filter((t) => t.gameId === req.params.gameId) });
});

// Sinh slot đội cho 1 game (1 lần/game). Tên đội auto-generate.
router.post('/games/:gameId/teams', (req, res) => {
  const gameId = req.params.gameId;

  const result = db.update((data) => {
    const game = data.games.find((g) => g.id === gameId);
    if (!game) return { error: 404 };
    // Phòng dữ liệu bị sửa tay: teamCount phải là số nguyên ≥ 1.
    if (!Number.isInteger(game.teamCount) || game.teamCount < 1) return { error: 400 };
    if (data.teams.some((t) => t.gameId === gameId)) return { error: 409 };
    const slots = buildTeamSlots(gameId, game.teamCount);
    // Push từng phần tử (không spread) để không vỡ ngăn xếp khi số đội rất lớn.
    for (const slot of slots) data.teams.push(slot);
    return { slots };
  });

  if (result.error === 404) {
    return res.status(404).json({ error: 'Không tìm thấy game.' });
  }
  if (result.error === 400) {
    return res.status(400).json({ error: 'Số đội của game không hợp lệ.' });
  }
  if (result.error === 409) {
    return res.status(409).json({ error: 'Game này đã sinh slot đội rồi.' });
  }
  res.status(201).json({ teams: result.slots });
});

// Mã QR để đội quét vào 1 game. Trả link tham gia + ảnh QR dạng SVG.
router.get('/games/:gameId/qr', async (req, res) => {
  // Bọc cả thân handler: handler async nên throw đồng bộ (vd db.read khi db hỏng)
  // sẽ thành unhandled rejection và Express 4 không tự trả 500 -> client treo.
  try {
    const { games } = db.read();
    const game = games.find((g) => g.id === req.params.gameId);
    if (!game) {
      return res.status(404).json({ error: 'Không tìm thấy game.' });
    }

    const host = req.get('host');
    if (!host) {
      return res.status(400).json({ error: 'Thiếu Host trong yêu cầu.' });
    }

    // Origin lấy từ request để điện thoại cùng mạng LAN quét ra đúng host.
    const origin = `${req.protocol}://${host}`;
    const joinUrl = buildJoinUrl(origin, game.id);
    const qrSvg = await QRCode.toString(joinUrl, { type: 'svg', margin: 1, width: 512 });
    res.json({ game: { id: game.id, name: game.name }, joinUrl, qrSvg });
  } catch (err) {
    res.status(500).json({ error: 'Không tạo được mã QR.' });
  }
});

module.exports = router;
