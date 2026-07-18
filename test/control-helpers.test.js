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

test('writable id prefers dedicated number/select slot', () => {
  const h = hass({
    'sensor.p_bed_target_temperature': { state: '60' },
    'number.p_bed_target_temperature': { state: '60' },
    'select.p_printing_speed': { state: 'standard', attributes: { options: ['silent', 'standard'] } }
  });
  const flags = getControlFlags(h, {
    bed_target_temp_entity: 'sensor.p_bed_target_temperature',
    bed_target_number_entity: 'number.p_bed_target_temperature',
    nozzle_target_temp_entity: '',
    nozzle_target_number_entity: 'number.p_missing',
    speed_profile_entity: '',
    speed_select_entity: 'select.p_printing_speed'
  });
  assert.equal(flags.canSetBedTarget, true);
  assert.equal(flags.bedTargetControlId, 'number.p_bed_target_temperature');
  assert.equal(flags.hasBedTarget, true);
  // number entity absent from hass → gated off
  assert.equal(flags.canSetNozzleTarget, false);
  assert.equal(flags.nozzleTargetControlId, null);
  assert.equal(flags.canSetSpeed, true);
  assert.equal(flags.speedControlId, 'select.p_printing_speed');
});

test('legacy config with writable domain in display key still works', () => {
  const h = hass({ 'number.legacy_bed': { state: '60' } });
  const flags = getControlFlags(h, {
    bed_target_temp_entity: 'number.legacy_bed',
    bed_target_number_entity: ''
  });
  assert.equal(flags.canSetBedTarget, true);
  assert.equal(flags.bedTargetControlId, 'number.legacy_bed');
});

test('signature-gated setup: control slots resolved but absent from hass → all gated', () => {
  const h = hass({ 'sensor.p_bed_target_temperature': { state: '60' } });
  const flags = getControlFlags(h, {
    pause_button_entity: 'button.p_pause',
    resume_button_entity: 'button.p_resume',
    stop_button_entity: 'button.p_stop',
    aux_fan_entity: 'fan.p_aux_fan',
    bed_target_temp_entity: 'sensor.p_bed_target_temperature',
    bed_target_number_entity: 'number.p_bed_target_temperature',
    speed_select_entity: 'select.p_printing_speed'
  });
  assert.equal(flags.canPause, false);
  assert.equal(flags.canResume, false);
  assert.equal(flags.canStop, false);
  assert.equal(flags.canFan, false);
  assert.equal(flags.canSetBedTarget, false);
  assert.equal(flags.canSetSpeed, false);
  // Display still on — sensor exists
  assert.equal(flags.hasBedTarget, true);
});

test('pressButton no-ops when entity missing', () => {
  const calls = [];
  const h = { states: {}, callService: (...args) => calls.push(args) };
  assert.equal(pressButton(h, 'button.missing'), false);
  assert.equal(calls.length, 0);
});
