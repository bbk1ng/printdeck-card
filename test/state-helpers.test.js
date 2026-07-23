import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getAmsSlots,
  getEntityStates,
  isPrinting,
  resolvePrintMetrics
} from '../src/utils/state-helpers.js';

const printingConfig = {
  current_stage_entity: 'sensor.stage',
  print_status_entity: 'sensor.status'
};
const numericConfig = {
  ...printingConfig,
  progress_entity: 'sensor.progress',
  current_layer_entity: 'sensor.current_layer',
  total_layers_entity: 'sensor.total_layers',
  remaining_time_entity: 'sensor.remaining_time',
  bed_temp_entity: 'sensor.bed_temp',
  nozzle_temp_entity: 'sensor.nozzle_temp',
  print_weight_entity: 'sensor.print_weight',
  print_length_entity: 'sensor.print_length'
};
const amsConfig = {
  ams_slot1_entity: 'sensor.ams_1',
  ams_slot2_entity: 'sensor.ams_2',
  external_spool_entity: 'sensor.external_spool'
};

// --- Batch 1 ---

test('isPrinting is safe for missing and undefined stages', () => {
  assert.equal(isPrinting({ states: {} }, printingConfig), false);
  assert.equal(isPrinting({ states: { 'sensor.stage': { state: undefined } } }, printingConfig), false);
});

test('isPrinting prioritizes print status and recognizes paused stages', () => {
  assert.equal(isPrinting({ states: { 'sensor.status': { state: 'printing' } } }, printingConfig), true);
  assert.equal(isPrinting({ states: { 'sensor.stage': { state: 'paused_user' } } }, printingConfig), true);
});

test('numeric entity states use null for missing, unavailable, and unknown values', () => {
  const hass = {
    states: {
      'sensor.progress': { state: 'unavailable' },
      'sensor.current_layer': { state: 'unknown' }
    }
  };

  const entities = getEntityStates(hass, numericConfig);

  for (const key of [
    'progress',
    'currentLayer',
    'totalLayers',
    'remainingTime',
    'bedTemp',
    'nozzleTemp',
    'print_length',
    'print_weight'
  ]) {
    assert.equal(entities[key], null, key);
  }
});

test('string entity states retain their existing falsy defaults', () => {
  const hass = {
    states: {
      'sensor.status': { state: '' },
      'sensor.stage': { state: '' }
    }
  };

  const entities = getEntityStates(hass, numericConfig);

  assert.equal(entities.status, 'idle');
  assert.equal(entities.currentStage, 'unknown');
});

test('numeric entity states still parse finite values', () => {
  const hass = {
    states: {
      'sensor.progress': { state: '42.5' },
      'sensor.current_layer': { state: '12' },
      'sensor.total_layers': { state: '100' },
      'sensor.remaining_time': { state: '75' },
      'sensor.bed_temp': { state: '60.5' },
      'sensor.nozzle_temp': { state: '220.25' },
      'sensor.print_weight': { state: '123' },
      'sensor.print_length': { state: '456' }
    }
  };

  const entities = getEntityStates(hass, numericConfig);
  const expected = {
    progress: 42.5,
    currentLayer: 12,
    totalLayers: 100,
    remainingTime: 75,
    bedTemp: 60.5,
    nozzleTemp: 220.25,
    print_weight: 123,
    print_length: 456
  };

  for (const [key, value] of Object.entries(expected)) {
    assert.equal(entities[key], value, key);
  }

  // Batch 2: entity ID strings for UOM (not the numeric values)
  assert.equal(entities.print_weight_entity, 'sensor.print_weight');
  assert.equal(entities.print_length_entity, 'sensor.print_length');
});

// --- Batch 2: A6/B7 metrics ---

test('resolvePrintMetrics hides null metrics and uses configured UOM', () => {
  const hassStates = {
    'sensor.bambulab_p2s_print_length': {
      state: '12.75',
      attributes: { unit_of_measurement: 'm' }
    },
    'sensor.bambulab_p2s_print_weight': {
      state: 'unavailable',
      attributes: { unit_of_measurement: 'g' }
    }
  };

  const metrics = resolvePrintMetrics(
    {
      print_length: 12.75,
      print_weight: null,
      print_length_entity: 'sensor.bambulab_p2s_print_length',
      print_weight_entity: 'sensor.bambulab_p2s_print_weight'
    },
    hassStates
  );

  assert.deepEqual(metrics.length, { value: 12.75, unit: 'm' });
  assert.equal(metrics.weight, null);
});

test('resolvePrintMetrics shows both metrics with configured non-p1s UOM', () => {
  const metrics = resolvePrintMetrics(
    {
      print_length: 1.5,
      print_weight: 42,
      print_length_entity: 'sensor.bambulab_p2s_print_length',
      print_weight_entity: 'sensor.bambulab_p2s_print_weight'
    },
    {
      'sensor.bambulab_p2s_print_length': {
        state: '1.5',
        attributes: { unit_of_measurement: 'm' }
      },
      'sensor.bambulab_p2s_print_weight': {
        state: '42',
        attributes: { unit_of_measurement: 'g' }
      }
    }
  );

  assert.deepEqual(metrics.length, { value: 1.5, unit: 'm' });
  assert.deepEqual(metrics.weight, { value: 42, unit: 'g' });
});

test('resolvePrintMetrics omits both when values are null', () => {
  const metrics = resolvePrintMetrics(
    {
      print_length: null,
      print_weight: null,
      print_length_entity: 'sensor.bambulab_p2s_print_length',
      print_weight_entity: 'sensor.bambulab_p2s_print_weight'
    },
    {}
  );

  assert.equal(metrics.length, null);
  assert.equal(metrics.weight, null);
});

// --- Batch 2: B9 AMS merge ---

test('getAmsSlots merges AMS trays and external spool when both present', () => {
  const hass = {
    states: {
      'sensor.ams_1': {
        state: 'PLA',
        attributes: { color: '#ff0000', empty: false, active: true, name: 'Slot1' }
      },
      'sensor.ams_2': {
        state: 'PETG',
        attributes: { color: '#00ff00', empty: false, active: false, name: 'Slot2' }
      },
      'sensor.external_spool': {
        state: 'ABS',
        attributes: { color: '#0000ff', name: 'External', active: false }
      }
    }
  };

  const slots = getAmsSlots(hass, amsConfig);
  assert.equal(slots.length, 3);
  assert.equal(slots[0].type, 'PLA');
  assert.equal(slots[1].type, 'PETG');
  assert.equal(slots[2].type, 'ABS');
  assert.equal(slots[2].name, 'External');
  assert.deepEqual(
    slots.map((s) => s.active),
    [true, false, false]
  );
});

test('getAmsSlots defaults external active when attribute missing (legacy)', () => {
  const hass = {
    states: {
      'sensor.ams_1': {
        state: 'PLA',
        attributes: { color: '#ff0000', empty: false, active: false, name: 'Slot1' }
      },
      'sensor.external_spool': {
        state: 'ABS',
        attributes: { color: '#0000ff', name: 'External' }
        // no active attribute
      }
    }
  };

  const slots = getAmsSlots(hass, amsConfig);
  assert.equal(slots.length, 2);
  assert.equal(slots[1].active, true);
  // sole claimed-active wins after enforce
  assert.equal(slots.filter((s) => s.active).length, 1);
});

test('getAmsSlots enforces single active when external and AMS both claim active', () => {
  const hass = {
    states: {
      'sensor.ams_1': {
        state: 'PLA',
        attributes: { color: '#ff0000', empty: false, active: true, name: 'Slot1' }
      },
      'sensor.ams_2': {
        state: 'PETG',
        attributes: { color: '#00ff00', empty: false, active: false, name: 'Slot2' }
      },
      'sensor.external_spool': {
        state: 'ABS',
        attributes: { color: '#0000ff', name: 'External', active: true }
      }
    }
  };

  const slots = getAmsSlots(hass, amsConfig);
  assert.equal(slots.filter((s) => s.active).length, 1);
  assert.equal(slots[0].active, true);
  assert.equal(slots[2].active, false);
});

test('getAmsSlots returns external spool alone when no AMS slots configured', () => {
  const hass = {
    states: {
      'sensor.external_spool': {
        state: 'TPU',
        attributes: { color: '#ffffff', name: 'ExtOnly' }
      }
    }
  };

  const slots = getAmsSlots(hass, { external_spool_entity: 'sensor.external_spool' });
  assert.equal(slots.length, 1);
  assert.equal(slots[0].type, 'TPU');
  assert.equal(slots[0].name, 'ExtOnly');
  assert.equal(slots[0].active, true);
});

test('getAmsSlots keeps AMS when external is unavailable or unknown', () => {
  const baseAms = {
    'sensor.ams_1': {
      state: 'PLA',
      attributes: { color: '#ff0000', empty: false, active: false, name: 'Slot1' }
    }
  };

  const slotsUnavailable = getAmsSlots(
    { states: { ...baseAms, 'sensor.external_spool': { state: 'unavailable', attributes: {} } } },
    amsConfig
  );
  assert.equal(slotsUnavailable.length, 1);
  assert.equal(slotsUnavailable[0].type, 'PLA');

  const slotsUnknown = getAmsSlots(
    { states: { ...baseAms, 'sensor.external_spool': { state: 'unknown', attributes: {} } } },
    amsConfig
  );
  assert.equal(slotsUnknown.length, 1);
  assert.equal(slotsUnknown[0].type, 'PLA');
});

test('getAmsSlots drops unavailable/unknown AMS entities instead of showing fake slots', () => {
  const hass = {
    states: {
      'sensor.ams_1': { state: 'unavailable', attributes: { active: false, name: 'Gone' } },
      'sensor.ams_2': { state: 'unknown', attributes: { active: false, name: 'Ghost' } },
      'sensor.external_spool': {
        state: 'PLA',
        attributes: { color: '#ff0000', name: 'External', active: true }
      }
    }
  };

  const slots = getAmsSlots(hass, amsConfig);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].type, 'PLA');
  assert.equal(slots[0].name, 'External');
  assert.equal(slots[0].active, true);
});

test('print-status has no sensor.p1s_print_* hardcodes and joins stats without trailing pipe', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(
    join(here, '../src/templates/components/print-status.js'),
    'utf8'
  );

  assert.equal(/sensor\.p1s_print_/.test(source), false);
  assert.match(source, /resolvePrintMetrics/);
  assert.match(source, /statParts\.join/);
  assert.equal(/\|\s*`\s*:/.test(source), false);
});

test('remaining time normalizes hour and second units to minutes', () => {
  const build = (state, unit) => getEntityStates({
    states: { 'sensor.remaining_time': { state, attributes: { unit_of_measurement: unit } } }
  }, numericConfig).remainingTime;

  assert.equal(build('3.6', 'h'), 216);
  assert.equal(build('90', 'min'), 90);
  assert.equal(build('120', 's'), 2);
  assert.equal(build('45', undefined), 45);
});
