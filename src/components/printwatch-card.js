// src/components/printwatch-card.js
import { LitElement, html } from 'lit';
import { cardTemplate } from '../templates/card-template';
import { cardStyles } from '../styles/card-styles';
import { formatDuration, formatEndTime } from '../utils/formatters';
import { isPrinting, isPaused, getAmsSlots, getEntityStates } from '../utils/state-helpers';
import { DEFAULT_CONFIG, DEFAULT_CAMERA_REFRESH_RATE } from '../constants/config';
import { resolveConfig } from '../utils/entity-map';
import { withCacheBust } from '../utils/camera-helpers';
import {
  getControlFlags,
  pressButton,
  toggleLight,
  toggleFan
} from '../utils/control-helpers';
import { localize } from '../utils/localize';
import { CARD_VERSION } from '../constants/version';

class PrintWatchCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _lastCameraUpdate: { type: Number },
      _cameraUpdateInterval: { type: Number },
      _cameraError: { type: Boolean },
      _coverError: { type: Boolean },
      _dialogConfig: { state: true },
      _confirmDialog: { state: true }
    };
  }

  static get styles() {
    return cardStyles;
  }

  constructor() {
    super();
    this._lastCameraUpdate = 0;
    this._cameraUpdateInterval = DEFAULT_CAMERA_REFRESH_RATE;
    this._cameraError = false;
    this._coverError = false;
    this._dialogConfig = { open: false };
    this._confirmDialog = { open: false };
    this.formatters = {
      formatDuration,
      formatEndTime
    };
  }

  setConfig(config) {
    if (!config.printer_name) {
      throw new Error('Please define printer_name');
    }
    // Empty defaults first, then user config, then prefix resolution (A1)
    const merged = { ...DEFAULT_CONFIG, ...config };
    this.config = resolveConfig(merged);
    this._cameraUpdateInterval = config.camera_refresh_rate || DEFAULT_CAMERA_REFRESH_RATE;
  }

  /**
   * A2: missing online entity → treat as online/unknown (do not kill camera).
   * Offline only when entity exists and state !== 'on'.
   */
  isOnline() {
    const id = this.config?.online_entity;
    if (!id || !String(id).trim()) return true;
    const onlineEntity = this.hass?.states?.[id];
    if (!onlineEntity) return true;
    return onlineEntity.state === 'on';
  }

  shouldUpdateCamera() {
    if (!this.isOnline()) return false;
    return Date.now() - this._lastCameraUpdate > this._cameraUpdateInterval;
  }

  handleCameraError() {
    this._cameraError = true;
    this.requestUpdate();
  }

  handleCameraLoad() {
    this._cameraError = false;
  }

  handleCoverError() {
    this._coverError = true;
    this.requestUpdate();
  }

  handleCoverLoad() {
    this._coverError = false;
  }

  _toggleLight() {
    toggleLight(this.hass, this.config.chamber_light_entity);
  }

  _toggleFan() {
    toggleFan(this.hass, this.config.aux_fan_entity);
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has('hass')) {
      // Clear sticky errors when entity_picture / token changes
      const cam = this.hass?.states?.[this.config?.camera_entity];
      const cover = this.hass?.states?.[this.config?.cover_image_entity];
      const camPic = cam?.attributes?.entity_picture;
      const coverPic = cover?.attributes?.entity_picture;
      if (camPic && this._lastCameraPicture && camPic !== this._lastCameraPicture) {
        this._cameraError = false;
      }
      if (coverPic && this._lastCoverPicture && coverPic !== this._lastCoverPicture) {
        this._coverError = false;
      }
      this._lastCameraPicture = camPic;
      this._lastCoverPicture = coverPic;

      if (this.shouldUpdateCamera()) {
        this._updateCameraFeed();
      }
    }
  }

  _updateCameraFeed() {
    if (!this.isOnline()) return;

    this._lastCameraUpdate = Date.now();
    const timestamp = Date.now();

    const cameraImg = this.shadowRoot?.querySelector('.camera-feed img');
    if (cameraImg) {
      const cameraEntity = this.hass.states[this.config.camera_entity];
      const pic = cameraEntity?.attributes?.entity_picture;
      if (pic) {
        cameraImg.src = withCacheBust(pic, timestamp);
      }
    }

    const coverImg = this.shadowRoot?.querySelector('.preview-image img');
    if (coverImg) {
      const coverEntity = this.hass.states[this.config.cover_image_entity];
      const pic = coverEntity?.attributes?.entity_picture;
      if (pic) {
        coverImg.src = withCacheBust(pic, timestamp);
      }
    }
  }

  handlePauseDialog() {
    const flags = getControlFlags(this.hass, this.config);
    const isPausedNow = isPaused(this.hass, this.config);
    if (isPausedNow && !flags.canResume) return;
    if (!isPausedNow && !flags.canPause) return;

    this._confirmDialog = {
      open: true,
      type: 'pause',
      title: localize.t('dialogs.pause.title'),
      message: localize.t('dialogs.pause.message'),
      onConfirm: () => {
        const entity = isPaused(this.hass, this.config)
          ? this.config.resume_button_entity
          : this.config.pause_button_entity;
        pressButton(this.hass, entity);
        this._confirmDialog = { open: false };
      },
      onCancel: () => {
        this._confirmDialog = { open: false };
      }
    };
    this.requestUpdate();
  }

  handleStopDialog() {
    const flags = getControlFlags(this.hass, this.config);
    if (!flags.canStop) return;

    this._confirmDialog = {
      open: true,
      type: 'stop',
      title: localize.t('dialogs.stop.title'),
      message: localize.t('dialogs.stop.message'),
      onConfirm: () => {
        pressButton(this.hass, this.config.stop_button_entity);
        this._confirmDialog = { open: false };
      },
      onCancel: () => {
        this._confirmDialog = { open: false };
      }
    };
    this.requestUpdate();
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const entities = getEntityStates(this.hass, this.config);
    const amsSlots = getAmsSlots(this.hass, this.config);
    const controlFlags = getControlFlags(this.hass, this.config);

    const setDialogConfig = (config) => {
      this._dialogConfig = config;
      this.requestUpdate();
    };

    return cardTemplate({
      entities,
      hass: this.hass,
      amsSlots,
      controlFlags,
      formatters: this.formatters,
      _toggleLight: () => this._toggleLight(),
      _toggleFan: () => this._toggleFan(),
      _cameraError: this._cameraError,
      _coverError: this._coverError,
      isOnline: this.isOnline(),
      handleImageError: () => this.handleCameraError(),
      handleImageLoad: () => this.handleCameraLoad(),
      handleCoverError: () => this.handleCoverError(),
      handleCoverLoad: () => this.handleCoverLoad(),
      dialogConfig: this._dialogConfig,
      confirmDialog: this._confirmDialog,
      setDialogConfig,
      handlePauseDialog: () => this.handlePauseDialog(),
      handleStopDialog: () => this.handleStopDialog()
    });
  }

  getCardSize() {
    return 6;
  }
}

customElements.define('printwatch-card', PrintWatchCard);

console.info(
  `%c PRINTWATCH-CARD %c v${CARD_VERSION} `,
  'background:#03a9f4;color:#fff;font-weight:bold;border-radius:4px 0 0 4px;padding:2px 0',
  'background:#555;color:#fff;border-radius:0 4px 4px 0;padding:2px 0'
);

export default PrintWatchCard;
