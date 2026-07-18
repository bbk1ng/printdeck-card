// src/templates/components/confirm-dialog.js
import { html } from 'lit';
import { localize } from '../../utils/localize';

export const confirmDialogTemplate = (dialogConfig) => {
  if (!dialogConfig?.open) return html``;

  return html`
    <div class="pw-overlay" @click=${dialogConfig.onCancel}>
      <div
        class="pw-dialog"
        role="dialog"
        aria-modal="true"
        @click=${(e) => e.stopPropagation()}
        @keydown=${(e) => { if (e.key === 'Escape') dialogConfig.onCancel(); }}
      >
        <div class="pw-dialog-header">
          <span class="pw-dialog-title">${dialogConfig.title}</span>
          <button class="dialog-btn close-button" @click=${dialogConfig.onCancel}>✕</button>
        </div>
        <div class="dialog-content">
          ${dialogConfig.message}
        </div>
        <div class="pw-dialog-actions">
          <button class="dialog-btn cancel-button" @click=${dialogConfig.onCancel}>
            ${localize.t('controls.cancel')}
          </button>
          <button
            class="dialog-btn confirm-button"
            @click=${dialogConfig.onConfirm}
            style="${dialogConfig.type === 'stop' ? 'color: rgb(229, 57, 53);' : ''}"
          >
            ${localize.t(`dialogs.${dialogConfig.type}.confirm`)}
          </button>
        </div>
      </div>
    </div>
  `;
};