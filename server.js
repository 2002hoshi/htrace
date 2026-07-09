'use strict';

/**
 * server.js — điểm khởi động của CHẠY TRẠM APP (bản demo web).
 *
 * Nhiệm vụ hiện tại (khung dự án):
 *   - Phục vụ frontend tĩnh trong /public
 *   - Gắn các nhóm route API: /api/admin, /api/player
 *   - Có route /api/health để kiểm tra server sống
 *
 * Các chức năng nghiệp vụ (tạo game, phân trạm, chấm điểm...) sẽ được bổ sung
 * dần vào các file trong src/routes.
 */

const path = require('path');
const express = require('express');

const adminRoutes = require('./src/routes/admin');
const playerRoutes = require('./src/routes/player');
const auth = require('./src/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Đọc body dạng JSON và form.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra sức khỏe server.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'htrace', ts: new Date().toISOString() });
});

// Các nhóm API.
app.use('/api/admin', adminRoutes);
app.use('/api/player', playerRoutes);

// Frontend tĩnh.
app.use(express.static(path.join(__dirname, 'public')));

// Route không khớp -> trả trang chủ (điều hướng phía client sau này).
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Đảm bảo luôn có ít nhất 1 admin để đăng nhập (chỉ tạo khi DB rỗng).
const seeded = auth.seedDefaultAdmin();

app.listen(PORT, () => {
  console.log(`CHẠY TRẠM APP đang chạy tại http://localhost:${PORT}`);
  if (seeded) {
    console.log(
      `Đã tạo admin mặc định: ${auth.DEFAULT_ADMIN.email} / ${auth.DEFAULT_ADMIN.password} (nhớ đổi khi dùng thật).`
    );
  }
});

module.exports = app;
