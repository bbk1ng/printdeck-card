import { html } from 'lit';
import { localize } from '../../utils/localize';
import { formatTemperature } from '../../utils/formatters';

export const temperatureDisplayTemplate = (
  entities,
  hass,
  dialogConfig = {},
  setDialogConfig,
  controlFlags = {}
) => {
  const handleControlClick = (type, currentValue, entityId, writable) => {
    if (!writable || !setDialogConfig) return;

    let config = {
      open: true,
      type,
      currentValue,
      entityId,
      onClose: () => setDialogConfig({ open: false })
    };

    switch (type) {
      case 'bed':
        config = {
          ...config,
          title: localize.t('temperatures.bed_target'),
          min: 0,
          max: 120
        };
        break;
      case 'nozzle':
        config = {
          ...config,
          title: localize.t('temperatures.nozzle_target'),
          min: 0,
          max: 320
        };
        break;
      case 'speed':
        config = {
          ...config,
          title: localize.t('temperatures.speed_profile')
        };
        break;
    }

    setDialogConfig(config);
  };

  const bedTempUnit = hass.states[entities.bed_temp_entity]?.attributes?.unit_of_measurement || '°C';
  const nozzleTempUnit = hass.states[entities.nozzle_temp_entity]?.attributes?.unit_of_measurement || '°C';

  const bedTarget = entities.bedTargetTemp;
  const nozzleTarget = entities.nozzleTargetTemp;
  const speedRaw = hass.states[entities.speed_profile_entity]?.state;
  const speedLabel =
    speedRaw && !['unavailable', 'unknown'].includes(speedRaw)
      ? speedRaw.charAt(0).toUpperCase() + speedRaw.slice(1)
      : '---';

  const bedWritable = Boolean(controlFlags.canSetBedTarget);
  const nozzleWritable = Boolean(controlFlags.canSetNozzleTarget);
  const speedWritable = Boolean(controlFlags.canSetSpeed);

  const bedActual = formatTemperature(entities.bedTemp, bedTempUnit);
  const nozzleActual = formatTemperature(entities.nozzleTemp, nozzleTempUnit);
  const bedTargetStr =
    bedTarget == null ? null : formatTemperature(bedTarget, bedTempUnit);
  const nozzleTargetStr =
    nozzleTarget == null ? null : formatTemperature(nozzleTarget, nozzleTempUnit);

  return html`
    <div class="temperatures">
      <div
        class="temp-item ${bedWritable ? 'controllable' : ''}"
        @click=${() =>
          handleControlClick(
            'bed',
            entities.bedTemp,
            entities.bed_target_temp_entity,
            bedWritable
          )}
      >
        <div class="temp-value">
          ${bedActual}${bedTargetStr ? html` <span class="temp-target">→ ${bedTargetStr}</span>` : ''}
        </div>
        <div>${localize.t('temperatures.bed')}</div>
      </div>

      <div
        class="temp-item ${nozzleWritable ? 'controllable' : ''}"
        @click=${() =>
          handleControlClick(
            'nozzle',
            entities.nozzleTemp,
            entities.nozzle_target_temp_entity,
            nozzleWritable
          )}
      >
        <div class="temp-value">
          ${nozzleActual}${nozzleTargetStr ? html` <span class="temp-target">→ ${nozzleTargetStr}</span>` : ''}
        </div>
        <div>${localize.t('temperatures.nozzle')}</div>
      </div>

      <div
        class="temp-item ${speedWritable ? 'controllable' : ''}"
        @click=${() =>
          handleControlClick(
            'speed',
            speedRaw || 'standard',
            entities.speed_profile_entity,
            speedWritable
          )}
      >
        <div class="temp-value">${speedLabel}</div>
        <div>${localize.t('temperatures.speed')}</div>
      </div>
    </div>
  `;
};
