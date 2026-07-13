'use strict';

// Test cho src/teams.js — chạy bằng: node --test test/teams.test.js
const test = require('node:test');
const assert = require('node:assert');
const { NAME_BANK, teamName, buildTeamSlots } = require('../src/teams');

test('buildTeamSlots sinh đúng số lượng', () => {
  assert.strictEqual(buildTeamSlots('g1', 15).length, 15);
  assert.strictEqual(buildTeamSlots('g1', 1).length, 1);
  assert.strictEqual(buildTeamSlots('g1', 0).length, 0);
});

test('mọi tên đội là duy nhất trong 1 game', () => {
  const teams = buildTeamSlots('g1', 20);
  const names = teams.map((t) => t.name);
  assert.strictEqual(new Set(names).size, names.length);
});

test('tên vẫn duy nhất khi số đội vượt ngân hàng tên', () => {
  const count = NAME_BANK.length + 5;
  const names = buildTeamSlots('g1', count).map((t) => t.name);
  assert.strictEqual(new Set(names).size, count);
});

test('mỗi slot đủ trường schema với trạng thái ban đầu đúng', () => {
  const [t] = buildTeamSlots('game-abc', 1);
  assert.strictEqual(t.gameId, 'game-abc');
  assert.strictEqual(t.status, 'empty');
  assert.strictEqual(t.currentStationId, null);
  assert.deepStrictEqual(t.visitedStationIds, []);
  assert.ok(typeof t.id === 'string' && t.id.length > 0);
  assert.ok(typeof t.name === 'string' && t.name.length > 0);
});

test('teamName định dạng "Đội <tên> (NN)" với số pad 2 chữ số', () => {
  assert.strictEqual(teamName(0), `Đội ${NAME_BANK[0]} (01)`);
  assert.strictEqual(teamName(9), `Đội ${NAME_BANK[9]} (10)`);
});
