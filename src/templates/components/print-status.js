// src/templates/components/print-status.js
import { html } from 'lit';
import { localize } from '../../utils/localize';
import { resolvePrintMetrics } from '../../utils/state-helpers';

export const printStatusTemplate = (entities, config) => {
  if (!entities || !config || !config.hass) return html``;

  if (!entities.isPrinting) {
    return html`
      <div class="not-printing">
        <div class="message">${localize.t('not_printing')}</div>
        ${entities.lastPrintName ? html`
          <div class="last-print">
            ${localize.t('last_print', { name: entities.lastPrintName })}
          </div>
        ` : ''}
      </div>
    `;
  }

  const hasCoverImage = entities.cover_image_entity &&
    config.hass.states[entities.cover_image_entity]?.attributes?.entity_picture;

  const metrics = resolvePrintMetrics(entities, config.hass.states);
  const statParts = [];
  if (metrics.length) {
    statParts.push(
      `${localize.t('print.length')}: ${metrics.length.value}${metrics.length.unit ? ` ${metrics.length.unit}` : ''}`
    );
  }
  if (metrics.weight) {
    statParts.push(
      `${localize.t('print.weight')}: ${metrics.weight.value}${metrics.weight.unit ? ` ${metrics.weight.unit}` : ''}`
    );
  }

  const flags = config.controlFlags || {};
  const showPause = entities.isPaused ? flags.canResume : flags.canPause;
  const showStop = flags.canStop;
  const showControls = showPause || showStop;

  return html`
    <div class="print-status">
      <div class="print-preview">
        ${hasCoverImage ? html`
          <div class="preview-image">
            <img
              src="${config.hass.states[entities.cover_image_entity].attributes.entity_picture}"
              alt="Print Preview"
              @error=${config.onImageError}
              @load=${config.onImageLoad}
            />
          </div>
        ` : ''}
        <div class="print-details">
          <h3>${entities.taskName}</h3>
          ${statParts.length ? html`
            <div class="print-stats">${statParts.join(' | ')}</div>
          ` : ''}

          ${showControls ? html`
            <div class="controls">
              ${showPause ? html`
                <button
                  class="btn btn-pause"
                  @click=${config.onPause}
                >
                  ${entities.isPaused ?
                    localize.t('controls.resume') :
                    localize.t('controls.pause')}
                </button>
              ` : ''}
              ${showStop ? html`
                <button
                  class="btn btn-stop"
                  @click=${config.onStop}
                >
                  ${localize.t('controls.stop')}
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};
