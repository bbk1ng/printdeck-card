import { html } from 'lit';
import { localize } from '../../utils/localize';

/**
 * Camera feed with recovery path.
 * - Offline printer → offline message (no sticky block when picture returns)
 * - Missing picture → unavailable (keeps ability to recover on next hass update)
 * - Error + picture still present → keep <img> so @load can clear sticky error
 */
export const cameraFeedTemplate = ({
  isOnline,
  hasError,
  currentStage,
  entityPicture,
  onError,
  onLoad
}) => {
  if (!isOnline) {
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:printer-off"></ha-icon>
        <span>${localize.t('printer_offline')}</span>
      </div>
    `;
  }

  if (!entityPicture) {
    return html`
      <div class="offline-message">
        <ha-icon icon="mdi:printer-off"></ha-icon>
        <span>${localize.t('camera_unavailable')}</span>
      </div>
    `;
  }

  return html`
    <div class="camera-feed">
      <div class="camera-label">${currentStage}</div>
      ${hasError ? html`
        <div class="camera-error-hint">${localize.t('camera_unavailable')}</div>
      ` : ''}
      <img
        src="${entityPicture}"
        style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;"
        alt="Camera Feed"
        @error=${onError}
        @load=${onLoad}
      />
    </div>
  `;
};
