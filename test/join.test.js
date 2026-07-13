'use strict';

// Test cho src/join.js — chạy bằng: node --test test/join.test.js
const test = require('node:test');
const assert = require('node:assert');
const { pickOpenSlot } = require('../src/join');

function team(id, gameId, status) {
  return { id, gameId, name: id, status };
}

test('chọn slot empty đầu tiên của đúng game', () => {
  const teams = [
    team('a', 'g1', 'joined'),
    team('b', 'g1', 'empty'),
    team('c', 'g1', 'empty'),
  ];
  assert.strictEqual(pickOpenSlot(teams, 'g1').id, 'b');
});

test('bỏ qua đội của game khác', () => {
  const teams = [team('x', 'g2', 'empty'), team('y', 'g1', 'empty')];
  assert.strictEqual(pickOpenSlot(teams, 'g1').id, 'y');
});

test('trả null khi mọi slot của game đã joined', () => {
  const teams = [team('a', 'g1', 'joined'), team('b', 'g1', 'joined')];
  assert.strictEqual(pickOpenSlot(teams, 'g1'), null);
});

test('trả null khi game không có đội nào', () => {
  assert.strictEqual(pickOpenSlot([team('a', 'g2', 'empty')], 'g1'), null);
});
