import { entityDomain, entityExists, isControllable } from './entity-map.js';

/** Domains that can accept number.set_value */
const NUMBER_DOMAINS = ['number'];
/** Domains that can accept select.select_option */
const SELECT_DOMAINS = ['select'];
/** Domains that can accept button.press */
const BUTTON_DOMAINS = ['button'];
/** Domains that can accept light.turn_on/off */
const LIGHT_DOMAINS = ['light'];
/** Domains that can accept fan.turn_on/off */
const FAN_DOMAINS = ['fan'];

/**
 * Presence flags for control UI.
 * @param {object} hass
 * @param {Record<string, string>} config
 */
export const getControlFlags = (hass, config) => {
  const pauseId = config.pause_button_entity;
  const resumeId = config.resume_button_entity;
  const stopId = config.stop_button_entity;
  const lightId = config.chamber_light_entity;
  const fanId = config.aux_fan_entity;
  const bedTargetId = config.bed_target_temp_entity;
  const nozzleTargetId = config.nozzle_target_temp_entity;
  const speedId = config.speed_profile_entity;

  return {
    canPause: isControllable(hass, pauseId, BUTTON_DOMAINS),
    canResume: isControllable(hass, resumeId, BUTTON_DOMAINS),
    canStop: isControllable(hass, stopId, BUTTON_DOMAINS),
    canLight: isControllable(hass, lightId, LIGHT_DOMAINS),
    canFan: isControllable(hass, fanId, FAN_DOMAINS),
    // Writable set-value UI only for number/select — sensors are display-only
    canSetBedTarget: isControllable(hass, bedTargetId, NUMBER_DOMAINS),
    canSetNozzleTarget: isControllable(hass, nozzleTargetId, NUMBER_DOMAINS),
    canSetSpeed: isControllable(hass, speedId, SELECT_DOMAINS),
    // Display-only targets/speed when entity exists as any domain
    hasBedTarget: entityExists(hass, bedTargetId),
    hasNozzleTarget: entityExists(hass, nozzleTargetId),
    hasSpeed: entityExists(hass, speedId)
  };
};

/**
 * Guarded button.press
 * @param {object} hass
 * @param {string} entityId
 */
export const pressButton = (hass, entityId) => {
  if (!isControllable(hass, entityId, BUTTON_DOMAINS)) return false;
  hass.callService('button', 'press', { entity_id: entityId });
  return true;
};

/**
 * Guarded light toggle
 * @param {object} hass
 * @param {string} entityId
 */
export const toggleLight = (hass, entityId) => {
  if (!isControllable(hass, entityId, LIGHT_DOMAINS)) return false;
  const state = hass.states[entityId];
  const service = state.state === 'on' ? 'turn_off' : 'turn_on';
  hass.callService('light', service, { entity_id: entityId });
  return true;
};

/**
 * Guarded fan toggle
 * @param {object} hass
 * @param {string} entityId
 */
export const toggleFan = (hass, entityId) => {
  if (!isControllable(hass, entityId, FAN_DOMAINS)) return false;
  const state = hass.states[entityId];
  const service = state.state === 'on' ? 'turn_off' : 'turn_on';
  hass.callService('fan', service, { entity_id: entityId });
  return true;
};

/**
 * Guarded number.set_value — rejects NaN / non-number domain
 * @param {object} hass
 * @param {string} entityId
 * @param {unknown} value
 */
export const setNumberValue = (hass, entityId, value) => {
  if (!isControllable(hass, entityId, NUMBER_DOMAINS)) return false;
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return false;
  hass.callService('number', 'set_value', { entity_id: entityId, value: n });
  return true;
};

/**
 * Guarded select.select_option
 * @param {object} hass
 * @param {string} entityId
 * @param {string} option
 */
export const selectOption = (hass, entityId, option) => {
  if (!isControllable(hass, entityId, SELECT_DOMAINS)) return false;
  if (option == null || option === '') return false;
  hass.callService('select', 'select_option', {
    entity_id: entityId,
    option
  });
  return true;
};

export {
  entityDomain,
  entityExists,
  isControllable,
  NUMBER_DOMAINS,
  SELECT_DOMAINS,
  BUTTON_DOMAINS,
  LIGHT_DOMAINS,
  FAN_DOMAINS
};
