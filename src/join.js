'use strict';

/**
 * join.js — chọn slot đội cho player khi quét QR vào game.
 *
 * Tách phần "tìm slot trống" (thuần, dễ test) khỏi route. Slot được sinh sẵn với
 * status 'empty'; join = claim slot đó (đổi sang 'joined'), không tạo đội mới.
 */

/** Trả slot 'empty' đầu tiên của gameId, hoặc null nếu đã hết slot trống. */
function pickOpenSlot(teams, gameId) {
  return teams.find((t) => t.gameId === gameId && t.status === 'empty') || null;
}

module.exports = { pickOpenSlot };
