import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRINTDECK_EDITOR_TAG,
  PrintDeckCardEditor,
  createConfigElement,
  createStubConfig,
  editorValue,
  findEntityPrefixes,
  registerPrintDeckCard,
  updateEditorConfig
} from '../src/components/printdeck-card-editor.js';

test('stub config is immediately valid for the card editor', () => {
  assert.deepEqual(createStubConfig(), {
    printer_name: 'My 3D Printer',
    entity_prefix: ''
  });
});

test('config element helper creates the registered editor tag', () => {
  const fakeDocument = { createElement: (tag) => ({ tag }) };
  assert.deepEqual(createConfigElement(fakeDocument), {
    tag: PRINTDECK_EDITOR_TAG
  });
});

test('printer prefixes are discovered from print status entities', () => {
  assert.deepEqual(
    findEntityPrefixes({
      'sensor.bambulab_x1c_print_status': {},
      'sensor.bambulab_p2s_print_status': {},
      'camera.bambulab_p2s_camera': {},
      'sensor.unrelated': {}
    }),
    ['bambulab_p2s', 'bambulab_x1c']
  );
});

test('editor updates preserve advanced YAML overrides', () => {
  const original = { printer_name: 'P2S', camera_entity: 'camera.custom' };
  const updated = updateEditorConfig(original, 'entity_prefix', 'bambulab_p2s');
  assert.deepEqual(updated, {
    printer_name: 'P2S',
    camera_entity: 'camera.custom',
    entity_prefix: 'bambulab_p2s'
  });
  assert.notEqual(updated, original);
});

test('editor emits typed checkbox and number config changes', () => {
  assert.equal(editorValue({ type: 'checkbox', checked: false }), false);
  assert.equal(editorValue({ type: 'number', value: '2500' }), 2500);

  const editor = Object.create(PrintDeckCardEditor.prototype);
  editor._config = { printer_name: 'P2S' };
  let emitted;
  editor.dispatchEvent = (event) => {
    emitted = event;
    return true;
  };
  editor._valueChanged({
    currentTarget: {
      dataset: { configKey: 'allow_temp_control' },
      type: 'checkbox',
      checked: true
    }
  });

  assert.equal(emitted.type, 'config-changed');
  assert.equal(emitted.detail.config.allow_temp_control, true);
  assert.equal(emitted.bubbles, true);
  assert.equal(emitted.composed, true);

  editor._valueChanged({
    currentTarget: {
      dataset: { configKey: 'camera_refresh_rate' },
      type: 'number',
      value: '2500'
    }
  });
  assert.equal(emitted.detail.config.camera_refresh_rate, 2500);
});

test('visual card registration is duplicate-safe', () => {
  const registry = [];
  registerPrintDeckCard(registry);
  registerPrintDeckCard(registry);
  assert.equal(registry.length, 1);
  assert.equal(registry[0].type, 'printdeck-card');
  assert.equal(registry[0].preview, true);
});
