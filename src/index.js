import PrintDeckCard from './components/printdeck-card';
import { html, css, LitElement } from 'lit';

// Ensure global availability of Lit core functions
window.LitElement = LitElement;
window.html = html;
window.css = css;

// Add version and build timestamp to window for debugging
window.PRINTDECK_VERSION = process.env.VERSION;
window.PRINTDECK_BUILD_TIME = process.env.BUILD_TIMESTAMP;
// Legacy globals, kept for one release after the PrintWatch -> PrintDeck rename
window.PRINTWATCH_VERSION = process.env.VERSION;
window.PRINTWATCH_BUILD_TIME = process.env.BUILD_TIMESTAMP;

// Dev builds set PRINTDECK_TAG (e.g. printdeck-card-dev) so a sideloaded dev
// bundle can coexist with the HACS-installed card without fighting over the tag.
const TAG = process.env.PRINTDECK_TAG || 'printdeck-card';

// Ensure the element is registered
if (!customElements.get(TAG)) {
  customElements.define(TAG, PrintDeckCard);
}

// Legacy tag alias so existing `type: custom:printwatch-card` configs keep working.
// Will be removed in a future release. Not registered by dev builds.
class PrintWatchCard extends PrintDeckCard {}
if (TAG === 'printdeck-card' && !customElements.get('printwatch-card')) {
  customElements.define('printwatch-card', PrintWatchCard);
}

// Export for potential reuse
export {
  PrintDeckCard,
  PrintWatchCard,
  html,
  css,
  LitElement
};