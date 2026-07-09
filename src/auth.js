'use strict';

/**
 * auth.js — nền xác thực cho Admin (bản demo).
 *
 * - Băm mật khẩu bằng crypto.scrypt (KHÔNG lưu plaintext), format "salt:hashHex".
 * - Token đăng nhập giữ trong bộ nhớ (Map token -> adminId). Đủ cho demo; khởi
 *   động lại server thì các phiên cũ mất — chấp nhận được.
 * - Middleware requireAdmin: chặn mọi API admin nếu thiếu/sai token.
 * - seedDefaultAdmin: tạo sẵn 1 admin khi DB chưa có admin nào.
 */

const crypto = require('crypto');
const db = require('./db');

// Thông tin admin mặc định — chỉ dùng khi DB rỗng (xem README để đổi).
const DEFAULT_ADMIN = { email: 'admin@htrace', password: 'admin123' };

// Phiên đăng nhập: token (chuỗi hex) -> adminId.
const tokens = new Map();

// Hash "mồi" tính sẵn 1 lần (hashPassword được hoisted): dùng khi email không
// tồn tại để verifyPassword vẫn chạy scrypt, giữ thời gian phản hồi đồng đều ->
// không lộ email nào có thật.
const DUMMY_HASH = hashPassword('không-bao-giờ-khớp');

/** Băm mật khẩu, trả chuỗi "salt:hash" (đều ở dạng hex). */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** So khớp mật khẩu với chuỗi "salt:hash" đã lưu. */
function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = crypto.scryptSync(password, salt, 64);
  // So sánh theo thời gian hằng định, phòng dò mật khẩu qua thời gian phản hồi.
  return hashBuf.length === testBuf.length && crypto.timingSafeEqual(hashBuf, testBuf);
}

/** Sinh token mới cho adminId và ghi nhớ. */
function createToken(adminId) {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, adminId);
  return token;
}

/** Trả adminId ứng với token, hoặc null nếu không hợp lệ. */
function resolveToken(token) {
  if (!token) return null;
  return tokens.get(token) || null;
}

/** Xóa token (đăng xuất). */
function revokeToken(token) {
  tokens.delete(token);
}

/**
 * Middleware bảo vệ route admin. Đọc header "Authorization: Bearer <token>",
 * gắn req.adminId nếu hợp lệ, ngược lại trả 401.
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const adminId = resolveToken(token);
  if (!adminId) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
  }
  req.adminId = adminId;
  req.token = token;
  next();
}

/** Tạo sẵn admin mặc định nếu DB chưa có admin nào. Trả true nếu vừa tạo. */
function seedDefaultAdmin() {
  return db.update((data) => {
    if (data.admins.length > 0) return false;
    data.admins.push({
      id: crypto.randomUUID(),
      email: DEFAULT_ADMIN.email,
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
    });
    return true;
  });
}

module.exports = {
  DEFAULT_ADMIN,
  DUMMY_HASH,
  hashPassword,
  verifyPassword,
  createToken,
  resolveToken,
  revokeToken,
  requireAdmin,
  seedDefaultAdmin,
};
