import { LitElement, css, html } from 'lit';
import { DEFAULT_CAMERA_REFRESH_RATE } from '../constants/config.js';

export const PRINTDECK_EDITOR_TAG = 'printdeck-card-editor';

export const createStubConfig = () => ({
  printer_name: 'My 3D Printer',
  entity_prefix: ''
});

export const createConfigElement = (documentRef = document) =>
  documentRef.createElement(PRINTDECK_EDITOR_TAG);

export const findEntityPrefixes = (states = {}) =>
  [
    ...new Set(
      Object.keys(states)
        .map((entityId) => entityId.match(/^sensor\.(.+)_print_status$/)?.[1])
        .filter(Boolean)
    )
  ].sort();

export const updateEditorConfig = (config, key, value) => ({
  ...config,
  [key]: value
});

export const editorValue = (input) => {
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'number') {
    const value = Number(input.value);
    return input.value === '' || !Number.isFinite(value)
      ? DEFAULT_CAMERA_REFRESH_RATE
      : value;
  }
  return input.value.trim();
};

export const registerPrintDeckCard = (registry) => {
  if (registry.some((card) => card.type === 'printdeck-card')) return;
  registry.push({
    type: 'printdeck-card',
    name: 'PrintDeck',
    description: 'Monitor and control a Bambu Lab 3D printer',
    preview: true
  });
};

export class PrintDeckCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { state: true }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--primary-text-color);
      }

      .editor {
        overflow: hidden;
        border: 1px solid var(--divider-color, #d6d9dc);
        border-radius: 14px;
        background: var(--card-background-color, #fff);
      }

      header {
        padding: 18px 20px 16px;
        border-bottom: 1px solid var(--divider-color, #d6d9dc);
        background:
          linear-gradient(
            110deg,
            color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent),
            transparent 58%
          ),
          var(--card-background-color, #fff);
      }

      .eyebrow {
        display: block;
        margin-bottom: 5px;
        color: var(--primary-color, #03a9f4);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      h3 {
        margin: 0;
        font-size: 1.18rem;
        font-weight: 650;
      }

      .fields {
        display: grid;
        gap: 18px;
        padding: 20px;
      }

      label {
        display: grid;
        gap: 7px;
        font-weight: 600;
      }

      input {
        box-sizing: border-box;
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        border: 1px solid
          var(--input-idle-line-color, var(--divider-color, #b8bdc2));
        border-radius: 9px;
        outline: none;
        background: var(--input-fill-color, transparent);
        color: var(--primary-text-color);
        font: inherit;
        font-weight: 400;
      }

      input:focus-visible {
        border-color: var(--primary-color, #03a9f4);
        box-shadow: 0 0 0 2px
          color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent);
      }

      label.toggle {
        grid-template-columns: auto 1fr;
        align-items: start;
      }

      .toggle input {
        width: 20px;
        min-height: 20px;
        margin: 2px 0 0;
      }

      .toggle span {
        display: grid;
        gap: 3px;
      }

      small {
        color: var(--secondary-text-color);
        font-size: 0.78rem;
        font-weight: 400;
        line-height: 1.45;
      }
    `;
  }

  constructor() {
    super();
    this._config = createStubConfig();
  }

  setConfig(config) {
    this._config = { ...createStubConfig(), ...config };
  }

  _valueChanged(event) {
    const key = event.currentTarget.dataset.configKey;
    const value = editorValue(event.currentTarget);
    this._config = updateEditorConfig(this._config, key, value);
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }

  render() {
    const prefixes = findEntityPrefixes(this.hass?.states);
    return html`
      <div class="editor">
        <header>
          <span class="eyebrow">PrintDeck setup</span>
          <h3>Connect your printer</h3>
        </header>
        <div class="fields">
          <label>
            Printer name
            <input
              data-config-key="printer_name"
              .value=${this._config.printer_name || ''}
              @change=${this._valueChanged}
              required
            />
            <small>The label shown at the top of the card.</small>
          </label>
          <label>
            Entity prefix
            <input
              data-config-key="entity_prefix"
              .value=${this._config.entity_prefix || ''}
              @change=${this._valueChanged}
              list="printdeck-prefixes"
              placeholder="bambulab_p2s"
              autocomplete="off"
              required
            />
            <datalist id="printdeck-prefixes">
              ${prefixes.map((prefix) => html`<option value=${prefix}></option>`)}
            </datalist>
            <small>
              Select a detected printer or enter the part between
              <code>sensor.</code> and <code>_print_status</code>.
            </small>
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              data-config-key="show_camera"
              .checked=${this._config.show_camera !== false}
              @change=${this._valueChanged}
            />
            <span>Show camera<small>Display the live camera section when available.</small></span>
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              data-config-key="show_ams"
              .checked=${this._config.show_ams !== false}
              @change=${this._valueChanged}
            />
            <span>Show AMS<small>Display the filament slot strip.</small></span>
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              data-config-key="allow_temp_control"
              .checked=${this._config.allow_temp_control === true}
              @change=${this._valueChanged}
            />
            <span>
              Allow temperature control
              <small>Enable tap-to-set temperature and speed dialogs.</small>
            </span>
          </label>
          <label>
            Camera refresh rate (ms)
            <input
              type="number"
              data-config-key="camera_refresh_rate"
              .value=${String(
                this._config.camera_refresh_rate ?? DEFAULT_CAMERA_REFRESH_RATE
              )}
              @change=${this._valueChanged}
            />
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              data-config-key="experimental"
              .checked=${this._config.experimental === true}
              @change=${this._valueChanged}
            />
            <span>Experimental features<small>Opt in to unreleased features.</small></span>
          </label>
        </div>
      </div>
    `;
  }
}
