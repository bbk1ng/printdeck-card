import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Mirror of PrintWatchCard.isOnline semantics for unit testing without Lit.
 * A2: missing entity → online; offline only when present and !== 'on'
 */
const isOnline = (hass, config) => {
  const id = config?.online_entity;
  if (!id || !String(id).trim()) return true;
  const onlineEntity = hass?.states?.[id];
  if (!onlineEntity) return true;
  return onlineEntity.state === 'on';
};

test('isOnline missing entity → true', () => {
  assert.equal(isOnline({ states: {} }, { online_entity: 'binary_sensor.gone' }), true);
});

test('isOnline empty config → true', () => {
  assert.equal(isOnline({ states: {} }, { online_entity: '' }), true);
});

test('isOnline present off → false', () => {
  assert.equal(
    isOnline(
      { states: { 'binary_sensor.online': { state: 'off' } } },
      { online_entity: 'binary_sensor.online' }
    ),
    false
  );
});

test('isOnline present on → true', () => {
  assert.equal(
    isOnline(
      { states: { 'binary_sensor.online': { state: 'on' } } },
      { online_entity: 'binary_sensor.online' }
    ),
    true
  );
});
