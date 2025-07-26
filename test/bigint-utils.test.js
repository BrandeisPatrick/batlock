import test from 'node:test';
import assert from 'node:assert/strict';
import { addStrings, subtractStrings, accountIdToSteamId64, steamId64ToAccountId } from '../public/js/bigint-utils.js';

test('addStrings adds numeric strings correctly', () => {
  assert.strictEqual(addStrings('123', '456'), '579');
  assert.strictEqual(addStrings('0', '0'), '0');
  assert.strictEqual(addStrings('999', '1'), '1000');
});

test('subtractStrings subtracts numeric strings correctly', () => {
  assert.strictEqual(subtractStrings('10', '1'), '9');
  assert.strictEqual(subtractStrings('1000', '1'), '999');
});

test('accountIdToSteamId64 and steamId64ToAccountId convert ids correctly', () => {
  const steam = accountIdToSteamId64('0');
  assert.strictEqual(steam, '76561197960265728');
  assert.strictEqual(steamId64ToAccountId(steam), '0');

  const another = accountIdToSteamId64('123456');
  assert.strictEqual(steamId64ToAccountId(another), '123456');
});

