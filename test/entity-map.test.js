import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENTITY_SLOTS,
  buildEntityId,
  resolveConfig
} from '../src/utils/entity-map.js';

test('entity_prefix bambulab_p2s matches design table (spot checks)', () => {
  const cfg = resolveConfig({
    printer_name: 'P2S',
    entity_prefix: 'bambulab_p2s'
  });

  assert.equal(cfg.camera_entity, 'camera.bambulab_p2s_camera');
  assert.equal(cfg.online_entity, 'binary_sensor.bambulab_p2s_online');
  assert.equal(
    cfg.external_spool_entity,
    'sensor.bambulab_p2s_external_spool_external_spool'
  );
  assert.equal(cfg.bed_target_temp_entity, 'sensor.bambulab_p2s_bed_target_temperature');
  assert.equal(cfg.nozzle_target_temp_entity, 'sensor.bambulab_p2s_nozzle_target_temperature');
  assert.equal(cfg.speed_profile_entity, 'sensor.bambulab_p2s_speed_profile');
  assert.equal(cfg.ams_slot1_entity, 'sensor.bambulab_p2s_ams_tray_1');
  assert.equal(cfg.chamber_light_entity, 'light.bambulab_p2s_chamber_light');
  // Phase 2: controls resolve from prefix too (UI presence-gates on hass)
  assert.equal(cfg.pause_button_entity, 'button.bambulab_p2s_pause');
  assert.equal(cfg.resume_button_entity, 'button.bambulab_p2s_resume');
  assert.equal(cfg.stop_button_entity, 'button.bambulab_p2s_stop');
  assert.equal(cfg.aux_fan_entity, 'fan.bambulab_p2s_aux_fan');
  assert.equal(cfg.bed_target_number_entity, 'number.bambulab_p2s_bed_target_temperature');
  assert.equal(cfg.nozzle_target_number_entity, 'number.bambulab_p2s_nozzle_target_temperature');
  assert.equal(cfg.speed_select_entity, 'select.bambulab_p2s_printing_speed');
});

test('explicit override wins over prefix', () => {
  const cfg = resolveConfig({
    printer_name: 'P2S',
    entity_prefix: 'bambulab_p2s',
    progress_entity: 'sensor.custom_progress'
  });
  assert.equal(cfg.progress_entity, 'sensor.custom_progress');
  assert.equal(cfg.task_name_entity, 'sensor.bambulab_p2s_task_name');
});

test('overrides.<key> wins over entity_prefix derivation', () => {
  const cfg = resolveConfig({
    printer_name: 'P2S',
    entity_prefix: 'bambulab_p2s',
    overrides: {
      camera_entity: 'camera.p2s_special',
      bed_temp_entity: 'sensor.external_probe'
    }
  });
  assert.equal(cfg.camera_entity, 'camera.p2s_special');
  assert.equal(cfg.bed_temp_entity, 'sensor.external_probe');
  // unset slots still derive from prefix
  assert.equal(cfg.task_name_entity, 'sensor.bambulab_p2s_task_name');
});

test('flat *_entity key beats overrides.<key> beats prefix', () => {
  const cfg = resolveConfig({
    printer_name: 'P2S',
    entity_prefix: 'bambulab_p2s',
    camera_entity: 'camera.flat_wins',
    overrides: {
      camera_entity: 'camera.from_overrides',
      bed_temp_entity: 'sensor.from_overrides'
    }
  });
  // flat > overrides
  assert.equal(cfg.camera_entity, 'camera.flat_wins');
  // overrides > prefix
  assert.equal(cfg.bed_temp_entity, 'sensor.from_overrides');
  // prefix only
  assert.equal(cfg.nozzle_temp_entity, 'sensor.bambulab_p2s_nozzle_temperature');
});

test('flat keys remain back-compat when overrides is absent', () => {
  const cfg = resolveConfig({
    entity_prefix: 'bambulab_p2s',
    progress_entity: 'sensor.custom_progress',
    camera_entity: 'camera.custom_cam'
  });
  assert.equal(cfg.progress_entity, 'sensor.custom_progress');
  assert.equal(cfg.camera_entity, 'camera.custom_cam');
  assert.equal(cfg.task_name_entity, 'sensor.bambulab_p2s_task_name');
});

test('missing overrides is a no-op', () => {
  const cfg = resolveConfig({
    entity_prefix: 'bambulab_p2s'
  });
  assert.equal(cfg.camera_entity, 'camera.bambulab_p2s_camera');
  assert.equal(cfg.bed_temp_entity, 'sensor.bambulab_p2s_bed_temperature');
});

test('empty overrides map is a no-op', () => {
  const cfg = resolveConfig({
    entity_prefix: 'bambulab_p2s',
    overrides: {}
  });
  assert.equal(cfg.camera_entity, 'camera.bambulab_p2s_camera');
  assert.equal(cfg.progress_entity, 'sensor.bambulab_p2s_print_progress');
});

test('empty-string override does not beat prefix (same as empty flat key)', () => {
  const cfg = resolveConfig({
    entity_prefix: 'bambulab_p2s',
    overrides: {
      camera_entity: '',
      bed_temp_entity: '   '
    }
  });
  assert.equal(cfg.camera_entity, 'camera.bambulab_p2s_camera');
  assert.equal(cfg.bed_temp_entity, 'sensor.bambulab_p2s_bed_temperature');
});

test('overrides applies multi-AMS ams_slot5–16 (not only ENTITY_SLOTS)', () => {
  const cfg = resolveConfig({
    entity_prefix: 'bambulab_p2s',
    overrides: {
      ams_slot5_entity: 'sensor.ams_tray_5',
      ams_slot16_entity: 'sensor.ams_tray_16'
    }
  });
  assert.equal(cfg.ams_slot5_entity, 'sensor.ams_tray_5');
  assert.equal(cfg.ams_slot16_entity, 'sensor.ams_tray_16');
  // slots 1–4 still prefix-derived when not overridden
  assert.equal(cfg.ams_slot1_entity, 'sensor.bambulab_p2s_ams_tray_1');
});

test('flat multi-AMS key beats overrides.ams_slotN_entity', () => {
  const cfg = resolveConfig({
    ams_slot5_entity: 'sensor.flat_ams_5',
    overrides: {
      ams_slot5_entity: 'sensor.override_ams_5'
    }
  });
  assert.equal(cfg.ams_slot5_entity, 'sensor.flat_ams_5');
});

test('no prefix + no entity keys → no P1S serial strings', () => {
  const cfg = resolveConfig({ printer_name: 'X' });
  const blob = JSON.stringify(cfg);
  assert.equal(blob.includes('p1s_01p00a'), false);
  assert.equal(blob.includes('p1s_print'), false);
  assert.equal(cfg.camera_entity, '');
  assert.equal(cfg.print_status_entity, '');
});

test('buildEntityId formats domain.prefix_suffix', () => {
  assert.equal(
    buildEntityId('bambulab_p2s', ENTITY_SLOTS.camera_entity),
    'camera.bambulab_p2s_camera'
  );
});
