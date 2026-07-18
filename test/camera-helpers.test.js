import test from 'node:test';
import assert from 'node:assert/strict';

import { withCacheBust } from '../src/utils/camera-helpers.js';

test('cache-bust appends ?t= when no query', () => {
  assert.equal(withCacheBust('/api/camera_proxy/camera.x', 123), '/api/camera_proxy/camera.x?t=123');
});

test('cache-bust appends &t= when query exists', () => {
  assert.equal(
    withCacheBust('/api/camera_proxy/camera.x?token=abc', 99),
    '/api/camera_proxy/camera.x?token=abc&t=99'
  );
});

test('cache-bust empty url returns empty', () => {
  assert.equal(withCacheBust(''), '');
  assert.equal(withCacheBust(null), '');
});
