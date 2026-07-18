import test from 'node:test';
import assert from 'node:assert/strict';

import { formatDuration } from '../src/utils/formatters.js';

test('formatDuration shows unavailable values honestly', () => {
  assert.equal(formatDuration(null), '---');
  assert.equal(formatDuration(NaN), '---');
  assert.equal(formatDuration(Infinity), '---');
});
