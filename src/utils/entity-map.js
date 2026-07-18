/**
 * Static Phase 1 domain/suffix table for ha-bambulab-style entity IDs.
 * Resolve: `{domain}.{prefix}_{suffix}`
 * Explicit config `*_entity` keys always win over prefix derivation.
 */

/** @type {Record<string, { domain: string, suffix: string }>} */
export const ENTITY_SLOTS = {
  print_status_entity: { domain: 'sensor', suffix: 'print_status' },
  current_stage_entity: { domain: 'sensor', suffix: 'current_stage' },
  task_name_entity: { domain: 'sensor', suffix: 'task_name' },
  progress_entity: { domain: 'sensor', suffix: 'print_progress' },
  current_layer_entity: { domain: 'sensor', suffix: 'current_layer' },
  total_layers_entity: { domain: 'sensor', suffix: 'total_layer_count' },
  remaining_time_entity: { domain: 'sensor', suffix: 'remaining_time' },
  bed_temp_entity: { domain: 'sensor', suffix: 'bed_temperature' },
  nozzle_temp_entity: { domain: 'sensor', suffix: 'nozzle_temperature' },
  bed_target_temp_entity: { domain: 'sensor', suffix: 'bed_target_temperature' },
  nozzle_target_temp_entity: { domain: 'sensor', suffix: 'nozzle_target_temperature' },
  speed_profile_entity: { domain: 'sensor', suffix: 'speed_profile' },
  ams_slot1_entity: { domain: 'sensor', suffix: 'ams_tray_1' },
  ams_slot2_entity: { domain: 'sensor', suffix: 'ams_tray_2' },
  ams_slot3_entity: { domain: 'sensor', suffix: 'ams_tray_3' },
  ams_slot4_entity: { domain: 'sensor', suffix: 'ams_tray_4' },
  external_spool_entity: { domain: 'sensor', suffix: 'external_spool_external_spool' },
  camera_entity: { domain: 'camera', suffix: 'camera' },
  cover_image_entity: { domain: 'image', suffix: 'cover_image' },
  chamber_light_entity: { domain: 'light', suffix: 'chamber_light' },
  online_entity: { domain: 'binary_sensor', suffix: 'online' },
  print_weight_entity: { domain: 'sensor', suffix: 'print_weight' },
  print_length_entity: { domain: 'sensor', suffix: 'print_length' },
  // Phase 2 controls — only exist when ha-bambulab control gate is open
  // (cloud MQTT or printer LAN developer mode); UI presence-gates on hass.states
  pause_button_entity: { domain: 'button', suffix: 'pause' },
  resume_button_entity: { domain: 'button', suffix: 'resume' },
  stop_button_entity: { domain: 'button', suffix: 'stop' },
  aux_fan_entity: { domain: 'fan', suffix: 'aux_fan' },
  bed_target_number_entity: { domain: 'number', suffix: 'bed_target_temperature' },
  nozzle_target_number_entity: { domain: 'number', suffix: 'nozzle_target_temperature' },
  speed_select_entity: { domain: 'select', suffix: 'printing_speed' }
};

/**
 * Build entity id from prefix + slot table entry.
 * @param {string} prefix
 * @param {{ domain: string, suffix: string }} slot
 */
export const buildEntityId = (prefix, slot) => {
  if (!prefix || !slot) return undefined;
  return `${slot.domain}.${prefix}_${slot.suffix}`;
};

/**
 * True when value is a non-empty entity id string.
 * @param {unknown} value
 */
export const isExplicitEntity = (value) =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Resolve card config: explicit *_entity → prefix table → empty.
 * Does not inject foreign P1S serials.
 *
 * @param {Record<string, unknown>} rawConfig
 * @returns {Record<string, unknown>}
 */
export const resolveConfig = (rawConfig = {}) => {
  const config = { ...rawConfig };
  const prefix =
    typeof config.entity_prefix === 'string' && config.entity_prefix.trim()
      ? config.entity_prefix.trim()
      : '';

  for (const [key, slot] of Object.entries(ENTITY_SLOTS)) {
    if (isExplicitEntity(config[key])) continue;
    if (prefix) {
      config[key] = buildEntityId(prefix, slot);
    } else {
      // Leave unset / empty — do not inject defaults
      if (config[key] === undefined || config[key] === null) {
        config[key] = '';
      }
    }
  }

  return config;
};

/**
 * Domain of an entity id string.
 * @param {string|undefined|null} entityId
 */
export const entityDomain = (entityId) => {
  if (!isExplicitEntity(entityId)) return null;
  const i = entityId.indexOf('.');
  return i > 0 ? entityId.slice(0, i) : null;
};

/**
 * Entity exists in hass.states.
 * @param {object|undefined} hass
 * @param {string|undefined|null} entityId
 */
export const entityExists = (hass, entityId) =>
  isExplicitEntity(entityId) && Boolean(hass?.states?.[entityId]);

/**
 * Controllable for a given action domain set.
 * @param {object|undefined} hass
 * @param {string|undefined|null} entityId
 * @param {string[]} allowedDomains
 */
export const isControllable = (hass, entityId, allowedDomains) => {
  if (!entityExists(hass, entityId)) return false;
  const domain = entityDomain(entityId);
  return Boolean(domain && allowedDomains.includes(domain));
};
