import { RectpackrLayout } from './RectpackrLayout';

declare global {
  interface HTMLElementTagNameMap {
    'rectpackr-layout': RectpackrLayout;
  }
}

if (!customElements.get('rectpackr-layout')) {
  customElements.define('rectpackr-layout', RectpackrLayout);
}

export default RectpackrLayout;
