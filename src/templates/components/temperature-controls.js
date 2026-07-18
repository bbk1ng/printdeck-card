// src/templates/components/temperature-controls.js
import { html } from 'lit';
import { localize } from '../../utils/localize';
import { selectOption, setNumberValue } from '../../utils/control-helpers';
import { CARD_VERSION } from '../../constants/version';

export const temperatureDialogTemplate = (dialogConfig, hass) => {
  if (!dialogConfig?.open) return html``;

  const handleSubmit = (e) => {
    e.preventDefault();
    const dialog = e.target.closest('ha-dialog');
    if (!dialog) return;

    let value;
    if (dialogConfig.type === 'speed') {
      const select = dialog.querySelector('select.speed-select');
      value = select?.value;
    } else {
      const input = dialog.querySelector('input.temp-input');
      value = input ? parseFloat(input.value) : null;
    }

    if (value === null || value === undefined) return;
    if (dialogConfig.type !== 'speed' && !Number.isFinite(value)) return;

    let ok = false;
    if (dialogConfig.type === 'speed') {
      ok = selectOption(hass, dialogConfig.entityId, value);
    } else {
      ok = setNumberValue(hass, dialogConfig.entityId, value);
    }
    if (ok) dialogConfig.onClose();
  };

  // Native input/select — HA's ha-textfield/ha-select are lazy-loaded and
  // often not registered on dashboard views, rendering as empty elements.
  const renderContent = () => {
    if (dialogConfig.type === 'speed') {
      const profiles =
        hass.states[dialogConfig.entityId]?.attributes?.options ||
        ['silent', 'standard', 'sport', 'ludicrous'];
      return html`
        <label class="dialog-label">
          ${localize.t('temperatures.speed_profile')}
          <select class="speed-select" @click=${(e) => e.stopPropagation()}>
            ${profiles.map(profile => html`
              <option value=${profile} ?selected=${profile === dialogConfig.currentValue}>
                ${profile.charAt(0).toUpperCase() + profile.slice(1)}
              </option>
            `)}
          </select>
        </label>
      `;
    }

    return html`
      <label class="dialog-label">
        ${localize.t(`temperatures.${dialogConfig.type}_target`)}
        <input
          class="temp-input"
          type="number"
          .value=${String(dialogConfig.currentValue ?? '')}
          min=${dialogConfig.min}
          max=${dialogConfig.max}
          step="1"
          inputmode="numeric"
          required
        />
      </label>
      <div class="range-limits">
        ${localize.t('temperatures.range', { min: dialogConfig.min, max: dialogConfig.max })}
      </div>
    `;
  };

  return html`
    <ha-dialog
      open
      @closed=${dialogConfig.onClose}
      .heading=${dialogConfig.title}
    >
      <div class="dialog-content">
        ${renderContent()}
        <div class="dialog-version">printwatch ${CARD_VERSION}</div>
      </div>
      <mwc-button
        slot="secondaryAction"
        dialogAction="close"
        class="cancel-button"
      >
        ${localize.t('controls.cancel')}
      </mwc-button>
      <mwc-button
        slot="primaryAction"
        @click=${handleSubmit}
        class="save-button"
      >
        ${localize.t('controls.save')}
      </mwc-button>
    </ha-dialog>
  `;
};