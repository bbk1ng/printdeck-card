/**
 * Default configuration for the PrintDeck card.
 * Entity slots default empty — use `entity_prefix` or explicit `*_entity` keys.
 * No foreign printer serials (A1).
 */
export const DEFAULT_CONFIG = {
  printer_name: 'My 3D Printer',
  entity_prefix: '',
  print_status_entity: '',
  current_stage_entity: '',
  task_name_entity: '',
  progress_entity: '',
  current_layer_entity: '',
  total_layers_entity: '',
  remaining_time_entity: '',
  bed_temp_entity: '',
  nozzle_temp_entity: '',
  bed_target_temp_entity: '',
  nozzle_target_temp_entity: '',
  speed_profile_entity: '',
  ams_slot1_entity: '',
  ams_slot2_entity: '',
  ams_slot3_entity: '',
  ams_slot4_entity: '',
  external_spool_entity: '',
  camera_entity: '',
  cover_image_entity: '',
  pause_button_entity: '',
  resume_button_entity: '',
  stop_button_entity: '',
  chamber_light_entity: '',
  aux_fan_entity: '',
  bed_target_number_entity: '',
  nozzle_target_number_entity: '',
  speed_select_entity: '',
  online_entity: '',
  print_weight_entity: '',
  print_length_entity: '',
  // Opt-in gate for unreleased features: `experimental: true` in card YAML.
  experimental: false
};

/**
 * Default camera update interval in milliseconds
 */
export const DEFAULT_CAMERA_REFRESH_RATE = 1000;
