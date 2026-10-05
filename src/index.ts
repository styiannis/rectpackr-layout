/**
 * Registers `<rectpackr-layout>`, if the name is still free, and exports its
 * class as the default export.
 *
 * @module
 */
import { RectpackrLayout } from './RectpackrLayout';

declare global {
  interface HTMLElementTagNameMap {
    'rectpackr-layout': RectpackrLayout;
  }
}

if (!customElements.get('rectpackr-layout')) {
  customElements.define('rectpackr-layout', RectpackrLayout);
}

export { RectpackrLayout as default } from './RectpackrLayout';
