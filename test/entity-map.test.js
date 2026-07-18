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
  // Controls are not in the Phase 1 table (left unset by resolve)
  assert.equal(cfg.pause_button_entity, undefined);
  assert.equal(cfg.stop_button_entity, undefined);
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
