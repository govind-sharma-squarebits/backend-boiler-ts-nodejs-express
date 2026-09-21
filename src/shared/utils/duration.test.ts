import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDurationToMs } from './duration';

describe('parseDurationToMs', () => {
  it('parses seconds, minutes, hours, and days', () => {
    assert.equal(parseDurationToMs('30s'), 30_000);
    assert.equal(parseDurationToMs('15m'), 15 * 60_000);
    assert.equal(parseDurationToMs('1h'), 3_600_000);
    assert.equal(parseDurationToMs('7d'), 7 * 86_400_000);
  });

  it('rejects invalid formats', () => {
    assert.throws(() => parseDurationToMs('7days'), /Invalid duration/);
    assert.throws(() => parseDurationToMs(''), /Invalid duration/);
  });
});
