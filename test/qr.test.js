'use strict';

// Test cho src/qr.js — chạy bằng: node --test test/qr.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildJoinUrl } = require('../src/qr');

test('buildJoinUrl ghép đúng đường dẫn player', () => {
  assert.strictEqual(
    buildJoinUrl('http://localhost:3000', 'abc'),
    'http://localhost:3000/player.html?game=abc'
  );
});

test('buildJoinUrl encode gameId có ký tự đặc biệt', () => {
  assert.strictEqual(
    buildJoinUrl('http://x', 'a b&c'),
    'http://x/player.html?game=a%20b%26c'
  );
});

test('buildJoinUrl không sinh dấu "/" thừa khi origin có "/" cuối', () => {
  assert.strictEqual(
    buildJoinUrl('http://192.168.1.5:3000/', 'g1'),
    'http://192.168.1.5:3000/player.html?game=g1'
  );
});
