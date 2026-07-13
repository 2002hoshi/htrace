'use strict';

/**
 * qr.js — dựng link tham gia game cho mã QR.
 *
 * Tách riêng phần ghép link (thuần, dễ test) khỏi việc sinh ảnh QR. `origin`
 * được lấy từ request ở tầng route để điện thoại cùng mạng LAN quét ra đúng
 * host mà admin đang dùng (không hardcode localhost).
 */

/** Trả link đội truy cập vào 1 game, ví dụ "http://192.168.1.5:3000/player.html?game=abc". */
function buildJoinUrl(origin, gameId) {
  const base = String(origin).replace(/\/+$/, ''); // bỏ dấu "/" thừa ở cuối
  return `${base}/player.html?game=${encodeURIComponent(gameId)}`;
}

module.exports = { buildJoinUrl };
