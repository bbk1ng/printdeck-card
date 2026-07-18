// src/styles/card-styles.js
import { css } from 'lit';

export const cardStyles = css`
  /* Print preview */
  .preview-image {
    flex-shrink: 0;
    width: 100px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--secondary-background-color);
    align-self: stretch;
  }

  .preview-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .print-preview {
    display: flex;
    gap: 8px;
    align-items: stretch;
    min-height: 100px;
  }

  .print-details {
    flex-grow: 1;
    padding: 0 8px;
  }

  .print-details h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: var(--primary-text-color);
    white-space: normal;
    overflow-wrap: break-word;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .print-details .print-stats {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--secondary-text-color);
  }

  /* Card Layout */
  .card {
    background: var(--ha-card-background, var(--card-background-color));
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    position: relative;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .printer-name {
    font-size: 24px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .status {
    color: var(--state-active-color);
    font-size: 16px;
    font-weight: 500;
    text-transform: capitalize;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-text {
    color: var(--secondary-text-color);
    font-size: 14px;
    font-weight: 400;
    opacity: 0.9;
  }

  .header-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  /* Control Buttons */
  .icon-button {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .icon-button:hover {
    background: var(--secondary-background-color);
  }

  .icon-button.active {
    color: var(--state-active-color);
  }

  .icon-button ha-icon {
    width: 24px;
    height: 24px;
  }

  /* Camera Feed */
  .camera-feed {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    margin-bottom: 16px;
    position: relative;
    background: var(--secondary-background-color);
    overflow: hidden;
  }

  .offline-message {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    margin-bottom: 16px;
    background: var(--secondary-background-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color);
    gap: 8px;
  }

  .camera-label {
    position: absolute;
    top: 4px;
    left: 4px;
    color: var(--secondary-text-color);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 16px;
    background-color: color-mix(in srgb, var(--card-background-color) 80%, transparent);
    text-transform: capitalize;
  }

  /* Print Status */
  .print-status {
    background: var(--ha-card-background);
    padding: 16px 0;
    margin-bottom: 16px;
  }

  .not-printing {
    background: var(--ha-card-background);
    padding: 24px;
    margin-bottom: 16px;
    text-align: center;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .not-printing .message {
    color: var(--secondary-text-color);
    font-size: 16px;
    font-weight: 500;
  }

  .not-printing .last-print {
    color: var(--secondary-text-color);
    font-size: 14px;
    opacity: 0.8;
  }

  .layer-info {
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  .progress-bar {
    height: 4px;
    background: var(--secondary-background-color);
    border-radius: 2px;
    margin: 4px 0;
  }

  .progress-fill {
    width: 0%;
    height: 100%;
    background: var(--state-active-color);
    border-radius: 2px;
    transition: width 0.3s;
  }

  /* Control Buttons */
  .controls {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .btn {
    padding: 8px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;
    cursor: pointer;
  }

  .btn-pause {
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
  }

  .btn-stop {
    background: var(--error-color);
    color: var(--text-primary-color);
  }

  /* Temperature Display */
    .temperatures {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-bottom: 32px;
    padding-bottom: 32px;
    position: relative;
  }

  .temperatures::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 1px;
    background-color: var(--divider-color);
  }

  .temp-item {
    text-align: center;
    color: var(--primary-text-color);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
    padding: 12px;
    border-radius: 12px;
    transition: background-color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .temp-item.controllable {
    cursor: pointer;
  }

  .temp-item.controllable:hover {
    background-color: var(--secondary-background-color);
  }

  .temp-item.controllable:active {
    background-color: var(--primary-color);
    opacity: 0.8;
  }

  .temp-value {
    font-size: 32px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .temp-target {
    font-size: 16px;
    font-weight: 400;
    color: var(--secondary-text-color);
  }

  .camera-error-hint {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 12px;
    color: var(--secondary-text-color);
    background: var(--ha-card-background, var(--card-background-color));
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 1;
  }

  /* Dialog Styles — own overlay, no ha-dialog (lazy-loaded, unreliable) */
  .pw-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .pw-dialog {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    color: var(--primary-text-color);
    border-radius: 12px;
    min-width: 300px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .pw-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 0 20px;
  }

  .pw-dialog-title {
    font-size: 18px;
    font-weight: 500;
  }

  .pw-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 12px 12px 12px;
  }

  button.close-button {
    font-size: 16px;
    line-height: 1;
    padding: 6px 10px;
  }

  .dialog-content {
    padding: 20px;
    min-width: 300px;
    box-sizing: border-box;
  }

  .dialog-label {
    display: block;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  .temp-input,
  .speed-select {
    display: block;
    width: 100%;
    margin: 8px 0;
    padding: 10px 12px;
    box-sizing: border-box;
    font-size: 16px;
    color: var(--primary-text-color);
    background: var(--ha-card-background, var(--card-background-color));
    border: 1px solid var(--divider-color);
    border-radius: 8px;
  }

  .temp-input:focus,
  .speed-select:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .range-limits {
    color: var(--secondary-text-color);
    font-size: 14px;
    margin-top: 8px;
    text-align: center;
  }

  .dialog-version {
    color: var(--secondary-text-color);
    font-size: 11px;
    margin-top: 12px;
    text-align: right;
    opacity: 0.6;
  }

  .temp-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .temp-row .temp-slider {
    flex: 1;
    accent-color: var(--primary-color);
    margin: 8px 0;
  }

  .temp-row .temp-input {
    width: 84px;
    flex: none;
  }

  button.dialog-btn {
    border: none;
    background: none;
    font: inherit;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
  }

  button.dialog-btn:hover {
    background: rgba(127, 127, 127, 0.12);
  }

  button.save-button,
  button.confirm-button {
    color: var(--primary-color);
  }

  button.cancel-button {
    color: var(--secondary-text-color);
  }

  ha-textfield {
    width: 100%;
  }

  ha-select {
    width: 100%;
  }

  /* Materials */
  .materials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .material-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .material-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--divider-color);
    position: relative;
    transition: transform 0.3s ease;
  }

  .material-circle.active {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px var(--primary-background-color),
                0 0 0 4px var(--primary-color);
  }

  .material-type {
    font-size: 12px;
    color: var(--primary-text-color);
    text-align: center;
  }
`;