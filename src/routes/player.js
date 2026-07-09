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

module.exports = router;
