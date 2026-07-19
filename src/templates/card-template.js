// src/templates/card-template.js
import { html } from 'lit';
import { headerTemplate } from './components/header';
import { cameraFeedTemplate } from './components/camera-feed';
import { printStatusTemplate } from './components/print-status';
import { temperatureDisplayTemplate } from './components/temperature-display';
import { materialSlotsTemplate } from './components/material-slots';
import { temperatureDialogTemplate } from './components/temperature-controls';
import { confirmDialogTemplate } from './components/confirm-dialog';

export const cardTemplate = (context) => {
  const {
    entities,
    hass,
    amsSlots,
    controlFlags = {},
    _toggleLight,
    _toggleFan,
    _cameraError,
    isOnline,
    dialogConfig,
    confirmDialog,
    setDialogConfig,
    handlePauseDialog,
    handleStopDialog
  } = context;

  if (!entities || !hass) return html``;

  const controls = {
    lightState: hass.states[entities.chamber_light_entity]?.state,
    fanState: hass.states[entities.aux_fan_entity]?.state,
    hasLight: Boolean(controlFlags.canLight),
    hasFan: Boolean(controlFlags.canFan),
    onLightToggle: _toggleLight,
    onFanToggle: _toggleFan,
    hass
  };

  const cameraEntity = entities.camera_entity
    ? hass.states[entities.camera_entity]
    : null;
  const entityPicture = cameraEntity?.attributes?.entity_picture || '';

  const cameraProps = {
    isOnline,
    hasError: _cameraError,
    currentStage: entities.currentStage,
    entityPicture,
    onError: context.handleImageError,
    onLoad: context.handleImageLoad
  };

  return html`
    <div class="card">
      ${headerTemplate(entities, controls)}
      ${cameraFeedTemplate(cameraProps)}
      ${printStatusTemplate(entities, {
        hass,
        controlFlags,
        onPause: handlePauseDialog,
        onStop: handleStopDialog,
        onImageError: context.handleCoverError,
        onImageLoad: context.handleCoverLoad
      })}
      ${temperatureDisplayTemplate(entities, hass, dialogConfig, setDialogConfig, controlFlags)}
      ${materialSlotsTemplate(amsSlots)}
      ${temperatureDialogTemplate(dialogConfig, hass)}
      ${confirmDialogTemplate(confirmDialog)}
    </div>
  `;
};
