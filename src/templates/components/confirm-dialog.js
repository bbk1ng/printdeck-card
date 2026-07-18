// src/templates/components/confirm-dialog.js
import { html } from 'lit';
import { localize } from '../../utils/localize';

export const confirmDialogTemplate = (dialogConfig) => {
  if (!dialogConfig?.open) return html``;

  return html`
    <ha-dialog
      open
      @closed=${dialogConfig.onCancel}
      .heading=${dialogConfig.title}
    >
      <div class="dialog-content">
        ${dialogConfig.message}
      </div>
      <button
        slot="secondaryAction"
        @click=${dialogConfig.onCancel}
        class="dialog-btn cancel-button"
      >
        ${localize.t('controls.cancel')}
      </button>
      <button
        slot="primaryAction"
        @click=${dialogConfig.onConfirm}
        class="dialog-btn confirm-button"
        style="${dialogConfig.type === 'stop' ? 'color: rgb(229, 57, 53);' : ''}"
      >
        ${localize.t(`dialogs.${dialogConfig.type}.confirm`)}
      </button>
    </ha-dialog>
  `;
};