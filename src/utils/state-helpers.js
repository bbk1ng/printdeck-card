const PRINTING_STATES = ['printing', 'running', 'pause'];
const NON_PRINTING_STATES = ['idle', 'offline', 'unknown'];
const PRINTING_PROCESS_STATES = [
  'heatbed_preheating',
  'heating_hotend',
  'checking_extruder_temperature',
  'auto_bed_leveling',
  'scanning_bed_surface',
  'inspecting_first_layer',
  'calibrating_extrusion',
  'calibrating_extrusion_flow'
];

const isUsableEntityState = (state) =>
  Boolean(state?.state) &&
  state.state !== 'unknown' &&
  state.state !== 'unavailable';

/** Prefer first active slot when multiple claim active (AMS + external). */
const enforceSingleActive = (slots) => {
  let seenActive = false;
  return slots.map((slot) => {
    if (!slot.active) return slot;
    if (seenActive) return { ...slot, active: false };
    seenActive = true;
    return slot;
  });
};

export const isPrinting = (hass, config) => {
  const currentStage = hass.states[config.current_stage_entity]?.state;
  const printStatus = hass.states[config.print_status_entity]?.state;

  if (PRINTING_STATES.includes(printStatus)) return true;
  if (NON_PRINTING_STATES.includes(currentStage)) return false;
  if (currentStage === 'printing' || currentStage?.startsWith('paused_')) return true;

  return PRINTING_PROCESS_STATES.includes(currentStage);
};

export const isPaused = (hass, config) =>
  hass.states[config.print_status_entity]?.state === 'pause';

/**
 * AMS trays + external spool merged (design §5 / B9).
 * External no longer hard-wins; unavailable/unknown external is ignored.
 * External without `active` attribute defaults active:true (legacy HA entities).
 */
export const getAmsSlots = (hass, config) => {
  const amsSlotEntities = [
    config.ams_slot1_entity,
    config.ams_slot2_entity,
    config.ams_slot3_entity,
    config.ams_slot4_entity,
    config.ams_slot5_entity,
    config.ams_slot6_entity,
    config.ams_slot7_entity,
    config.ams_slot8_entity,
    config.ams_slot9_entity,
    config.ams_slot10_entity,
    config.ams_slot11_entity,
    config.ams_slot12_entity,
    config.ams_slot13_entity,
    config.ams_slot14_entity,
    config.ams_slot15_entity,
    config.ams_slot16_entity
  ].filter((entity) => entity != null && entity.trim() !== '');

  const processedSlots = amsSlotEntities
    .map((entity) => {
      const state = hass.states[entity];
      if (!isUsableEntityState(state)) return null;

      return {
        type: state.state || 'Empty',
        color: state.attributes?.color || '#E0E0E0',
        empty: state.attributes?.empty || false,
        active: Boolean(state.attributes?.active),
        name: state.attributes?.name || 'Unknown'
      };
    })
    .filter(Boolean);

  const externalSpoolEntity = config.external_spool_entity;
  if (externalSpoolEntity) {
    const externalSpool = hass.states[externalSpoolEntity];
    if (isUsableEntityState(externalSpool)) {
      const attrActive = externalSpool.attributes?.active;
      const externalActive = attrActive == null ? true : Boolean(attrActive);

      processedSlots.push({
        type: externalSpool.state || 'External Spool',
        color: externalSpool.attributes?.color || '#E0E0E0',
        empty: false,
        name: externalSpool.attributes?.name || 'External Spool',
        active: externalActive
      });
    }
  }

  return enforceSingleActive(processedSlots);
};

const getLastPrintName = (hass, config) => {
  const printStatus = hass.states[config.print_status_entity]?.state;
  const taskName = hass.states[config.task_name_entity]?.state;

  return ['idle', 'finish'].includes(printStatus) &&
    taskName &&
    !['unavailable', 'unknown'].includes(taskName)
    ? taskName
    : null;
};

/**
 * Length/weight display + UOM from configured entity IDs (A6/B7).
 */
export const resolvePrintMetrics = (entities, hassStates) => {
  const resolve = (value, entityId) => {
    if (value == null) return null;
    return {
      value,
      unit: hassStates?.[entityId]?.attributes?.unit_of_measurement || ''
    };
  };

  return {
    length: resolve(entities.print_length, entities.print_length_entity),
    weight: resolve(entities.print_weight, entities.print_weight_entity)
  };
};

export const getEntityStates = (hass, config) => {
  const getState = (entity, defaultValue = '0') =>
    hass.states[entity]?.state || defaultValue;
  const getNumericState = (entity, parser) => {
    const value = parser(hass.states[entity]?.state);
    return Number.isFinite(value) ? value : null;
  };

  return {
    name: config.printer_name || 'Unnamed Printer',
    status: getState(config.print_status_entity, 'idle'),
    currentStage: getState(config.current_stage_entity, 'unknown'),
    taskName: getState(config.task_name_entity, 'No active print'),
    progress: getNumericState(config.progress_entity, parseFloat),
    currentLayer: getNumericState(config.current_layer_entity, parseInt),
    totalLayers: getNumericState(config.total_layers_entity, parseInt),
    remainingTime: getNumericState(config.remaining_time_entity, parseInt),
    bedTemp: getNumericState(config.bed_temp_entity, parseFloat),
    nozzleTemp: getNumericState(config.nozzle_temp_entity, parseFloat),
    bedTargetTemp: getNumericState(config.bed_target_temp_entity, parseFloat),
    nozzleTargetTemp: getNumericState(config.nozzle_target_temp_entity, parseFloat),
    print_length: getNumericState(config.print_length_entity, parseFloat),
    print_weight: getNumericState(config.print_weight_entity, parseFloat),
    speedProfile: getState(config.speed_profile_entity, '---'),
    isPrinting: isPrinting(hass, config),
    isPaused: isPaused(hass, config),
    lastPrintName: getLastPrintName(hass, config),
    bed_temp_entity: config.bed_temp_entity,
    nozzle_temp_entity: config.nozzle_temp_entity,
    bed_target_temp_entity: config.bed_target_temp_entity,
    nozzle_target_temp_entity: config.nozzle_target_temp_entity,
    speed_profile_entity: config.speed_profile_entity,
    chamber_light_entity: config.chamber_light_entity,
    aux_fan_entity: config.aux_fan_entity,
    camera_entity: config.camera_entity,
    cover_image_entity: config.cover_image_entity,
    pause_button_entity: config.pause_button_entity,
    resume_button_entity: config.resume_button_entity,
    stop_button_entity: config.stop_button_entity,
    print_length_entity: config.print_length_entity,
    print_weight_entity: config.print_weight_entity
  };
};
