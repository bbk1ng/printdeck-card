import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CAMERA_REFRESH_RATE,
  DEFAULT_CONFIG,
  getFeatureFlags
} from '../src/constants/config.js';

test('feature defaults preserve displays and safeguard set controls', () => {
  assert.equal(DEFAULT_CONFIG.show_camera, true);
  assert.equal(DEFAULT_CONFIG.show_ams, true);
  assert.equal(DEFAULT_CONFIG.allow_temp_control, false);
  assert.equal(DEFAULT_CONFIG.camera_refresh_rate, DEFAULT_CAMERA_REFRESH_RATE);
  assert.equal(DEFAULT_CONFIG.experimental, false);
  assert.deepEqual(getFeatureFlags(DEFAULT_CONFIG, {}), {
    showCamera: true,
    showAms: true,
    allowTempControl: false
  });
});

test('camera requires both its toggle and a resolved entity', () => {
  assert.equal(getFeatureFlags({ show_camera: true }, null).showCamera, false);
  assert.equal(getFeatureFlags({ show_camera: false }, {}).showCamera, false);
});

test('AMS and temperature controls follow their opt-in flags', () => {
  const flags = getFeatureFlags({ show_ams: false, allow_temp_control: true }, {});
  assert.equal(flags.showAms, false);
  assert.equal(flags.allowTempControl, true);
  assert.equal(getFeatureFlags({}, {}).allowTempControl, false);
});
