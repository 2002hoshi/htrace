'use strict';

/**
 * Các API dành cho Player (khung — sẽ bổ sung dần).
 *
 * Dự kiến: nhận slot đội khi quét QR, lấy câu đố bí ẩn mở màn, nộp đáp án,
 * nhận trạm được phân (random ưu tiên trạm chưa đầy & chưa chơi), xem trạng
 * thái, màn chờ, xem kết quả.
 */

const express = require('express');
const db = require('../db');
const { pickOpenSlot } = require('../join');

const router = express.Router();

// Placeholder: trạng thái tổng quát (để kiểm tra khung chạy được).
router.get('/status', (req, res) => {
  const data = db.read();
  res.json({
    games: data.games.length,
    stations: data.stations.length,
    teams: data.teams.length,
  });
});

// Player quét QR → claim 1 slot đội còn trống của game (1 lần/thiết bị nhờ
// localStorage phía client). Tìm + đổi status trong cùng 1 db.update để 2 thiết
// bị không nhận trùng slot (Node đơn luồng, phần sync của update không xen kẽ).
router.post('/games/:gameId/join', (req, res) => {
  const gameId = req.params.gameId;

  try {
    const result = db.update((data) => {
      if (!data.games.some((g) => g.id === gameId)) return { error: 404 };
      // Chưa sinh slot đội nào -> "chưa mở", khác với "đã đầy".
      if (!data.teams.some((t) => t.gameId === gameId)) return { error: 'notready' };
      const slot = pickOpenSlot(data.teams, gameId);
      if (!slot) return { error: 409 };
      slot.status = 'joined';
      return { team: slot };
    });

    if (result.error === 404) {
      return res.status(404).json({ error: 'Không tìm thấy game.' });
    }
    if (result.error === 'notready') {
      return res.status(409).json({ error: 'Game chưa mở để tham gia.', notReady: true });
    }
    if (result.error === 409) {
      return res.status(409).json({ error: 'Game đã hết slot đội.', full: true });
    }
    res.status(200).json({ team: { id: result.team.id, name: result.team.name } });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ. Thử lại sau.' });
  }
});

// Lấy lại đội theo teamId đã lưu (để hiển thị lại khi reload/quét lại).
router.get('/games/:gameId/teams/:teamId', (req, res) => {
  try {
    const { teams } = db.read();
    const team = teams.find(
      (t) => t.id === req.params.teamId && t.gameId === req.params.gameId
    );
    if (!team) {
      return res.status(404).json({ error: 'Không tìm thấy đội.' });
    }
    res.json({ team: { id: team.id, name: team.name, status: team.status } });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ. Thử lại sau.' });
  }
});

module.exports = router;
