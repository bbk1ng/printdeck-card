import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getControlFlags,
  isControllable,
  setNumberValue,
  pressButton
} from '../src/utils/control-helpers.js';

const hass = (states) => ({ states, callService: () => {} });

test('missing entity → not controllable', () => {
  assert.equal(isControllable(hass({}), 'button.x', ['button']), false);
});

test('sensor target is not writable for set_value', () => {
  const h = hass({
    'sensor.bed_target': { state: '60' }
  });
  assert.equal(isControllable(h, 'sensor.bed_target', ['number']), false);
  const flags = getControlFlags(h, {
    bed_target_temp_entity: 'sensor.bed_target',
    nozzle_target_temp_entity: '',
    speed_profile_entity: '',
    pause_button_entity: '',
    resume_button_entity: '',
    stop_button_entity: '',
    chamber_light_entity: '',
    aux_fan_entity: ''
  });
  assert.equal(flags.canSetBedTarget, false);
  assert.equal(flags.hasBedTarget, true);
});

test('number/button/light domains are writable for matching actions', () => {
  const h = hass({
    'number.bed': { state: '60' },
    'button.pause': { state: 'unknown' },
    'light.chamber': { state: 'on' }
  });
  assert.equal(isControllable(h, 'number.bed', ['number']), true);
  assert.equal(isControllable(h, 'button.pause', ['button']), true);
  assert.equal(isControllable(h, 'light.chamber', ['light']), true);
});

test('setNumberValue rejects NaN and missing id', () => {
  const calls = [];
  const h = {
    states: { 'number.bed': { state: '60' } },
    callService: (...args) => calls.push(args)
  };
  assert.equal(setNumberValue(h, 'number.bed', NaN), false);
  assert.equal(setNumberValue(h, '', 50), false);
  assert.equal(setNumberValue(h, 'number.bed', 50), true);
  assert.equal(calls.length, 1);
});

test('pressButton no-ops when entity missing', () => {
  const calls = [];
  const h = { states: {}, callService: (...args) => calls.push(args) };
  assert.equal(pressButton(h, 'button.missing'), false);
  assert.equal(calls.length, 0);
});
