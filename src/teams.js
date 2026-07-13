'use strict';

/**
 * teams.js — sinh slot đội cho một game.
 *
 * Luật: đội KHÔNG tự đặt tên. Hệ thống sinh sẵn đúng số đội với tên tự động =
 * tên vui (con vật) + số thứ tự 2 chữ số. Số thứ tự đảm bảo tên duy nhất kể cả
 * khi số đội vượt quá số tên trong ngân hàng (tên con vật lặp lại nhưng số khác).
 */

const crypto = require('crypto');

// Ngân hàng tên vui (tiếng Việt).
const NAME_BANK = [
  'Hổ Mang',
  'Đại Bàng',
  'Sư Tử',
  'Báo Gấm',
  'Cá Mập',
  'Chó Sói',
  'Tê Giác',
  'Voi Rừng',
  'Kỳ Lân',
  'Phượng Hoàng',
  'Rồng Lửa',
  'Cọp Vằn',
  'Cáo Trắng',
  'Gấu Trúc',
  'Rùa Vàng',
  'Ngựa Chiến',
];

/** Tên đội theo chỉ số 0-based, ví dụ index 0 -> "Đội Hổ Mang (01)". */
function teamName(index) {
  const animal = NAME_BANK[index % NAME_BANK.length];
  const num = String(index + 1).padStart(2, '0');
  return `Đội ${animal} (${num})`;
}

/**
 * Sinh mảng `count` slot đội cho `gameId`. Mỗi slot theo schema `teams`:
 * { id, gameId, name, currentStationId:null, visitedStationIds:[], status:'empty' }.
 * status 'empty' = slot chưa có ai quét QR nhận.
 */
function buildTeamSlots(gameId, count) {
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    slots.push({
      id: crypto.randomUUID(),
      gameId,
      name: teamName(i),
      currentStationId: null,
      visitedStationIds: [],
      status: 'empty',
    });
  }
  return slots;
}

module.exports = { NAME_BANK, teamName, buildTeamSlots };
