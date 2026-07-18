// src/templates/components/temperature-controls.js
import { html } from 'lit';
import { localize } from '../../utils/localize';
import { selectOption, setNumberValue } from '../../utils/control-helpers';

export const temperatureDialogTemplate = (dialogConfig, hass) => {
  if (!dialogConfig?.open) return html``;

  const handleSubmit = (e) => {
    e.preventDefault();
    const dialog = e.target.closest('ha-dialog');
    if (!dialog) return;

    let value;
    if (dialogConfig.type === 'speed') {
      const select = dialog.querySelector('ha-select');
      value = select?.value;
    } else {
      const input = dialog.querySelector('ha-textfield');
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

  let selectedValue = dialogConfig.currentValue;

  const handleSelectionChange = (e) => {
    selectedValue = e.target.value;
    // Prevent dialog from closing
    e.stopPropagation();
  };

  const renderContent = () => {
    if (dialogConfig.type === 'speed') {
      const profiles =
        hass.states[dialogConfig.entityId]?.attributes?.options ||
        ['silent', 'standard', 'sport', 'ludicrous'];
      return html`
        <ha-select
          label=${localize.t('temperatures.speed_profile')}
          .value=${selectedValue}
          @selected=${handleSelectionChange}
          @closed=${(e) => e.stopPropagation()}
          class="speed-select"
          fixedMenuPosition
          naturalMenuWidth
        >
          ${profiles.map(profile => html`
            <mwc-list-item .value=${profile}>
              ${profile.charAt(0).toUpperCase() + profile.slice(1)}
            </mwc-list-item>
          `)}
        </ha-select>
      `;
    }

    return html`
      <ha-textfield
        label=${localize.t(`temperatures.${dialogConfig.type}_target`)}
        .value=${dialogConfig.currentValue}
        type="number"
        min=${dialogConfig.min}
        max=${dialogConfig.max}
        class="temp-input"
        suffix="°C"
        autoValidate
        required
      ></ha-textfield>
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