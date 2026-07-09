'use strict';

/**
 * db.js — kho dữ liệu đơn giản dựa trên 1 file JSON.
 *
 * Đủ dùng cho bản demo (vài chục đội). Đọc toàn bộ vào bộ nhớ, ghi lại cả file
 * mỗi lần thay đổi (đồng bộ, tránh mất dữ liệu khi reload). Sau này muốn chịu tải
 * cao hơn thì thay lớp này bằng SQLite mà không phải đổi phần còn lại của app.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Cấu trúc mặc định khi chưa có dữ liệu.
const EMPTY = {
  admins: [],     // { id, email, passwordHash }
  games: [],      // { id, name, bannerUrl, teamCount, createdAt }
  stations: [],   // { id, gameId, name, description, mapLink, hint, timeLimitSec, unit, capacity, isPrivate, ... }
  teams: [],      // { id, gameId, name, currentStationId, visitedStationIds, status }
  questions: [],  // { id, gameId, text, options: [], correctIndex }  -- ngân hàng câu hỏi trắc nghiệm
  scores: [],     // { id, gameId, teamId, stationId, points, scoredBy, scoredAt }
};

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

function read() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch (err) {
    throw new Error('db.json bị hỏng định dạng JSON: ' + err.message);
  }
}

function write(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

/** Đọc rồi cập nhật trong một lần, ghi lại kết quả. */
function update(mutator) {
  const data = read();
  const result = mutator(data);
  write(data);
  return result;
}

module.exports = { read, write, update, DATA_FILE, EMPTY };
