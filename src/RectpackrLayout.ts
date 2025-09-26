import { IRectpackrConfig, IRectpackr, rectpackr } from './core';

/* ------------------------------------------------------------------------- */
/* -------------------------- // Helper functions -------------------------- */
/* ------------------------------------------------------------------------- */

const parseConfig = (config: {
  positioning: string | undefined;
  'x-direction': string | undefined;
  'y-direction': string | undefined;
}): IRectpackrConfig => ({
  positioning:
    (config.positioning?.trim() ?? '') === 'offset' ? 'offset' : 'transform',
  'x-direction':
    (config['x-direction']?.trim() ?? '') === 'rtl' ? 'rtl' : 'ltr',
  'y-direction':
    (config['y-direction']?.trim() ?? '') === 'btt' ? 'btt' : 'ttb',
});

const getStyleTextContent = (config: IRectpackrConfig) => {
  let ret = `slot{ box-sizing: border-box; position: relative; display: block; width: 100% }`;

  if (config.positioning === 'transform') {
    const insetValue = {
      ltr: { ttb: '0 auto auto 0', btt: 'auto auto 0 0' },
      rtl: { ttb: '0 0 auto auto', btt: 'auto 0 0 auto' },
    }[config['x-direction']][config['y-direction']];

    ret = `${ret} ::slotted(:not([slot])){ position: absolute !important; inset: ${insetValue} !important }`;
  } else {
    ret = `${ret} ::slotted(:not([slot])){ position: absolute !important }`;
  }

  return ret;
};

/* ------------------------------------------------------------------------- */
/* -------------------------- Helper functions // -------------------------- */
/* ------------------------------------------------------------------------- */

export class RectpackrLayout extends HTMLElement {
  #obj: IRectpackr | undefined = undefined;

  static get observedAttributes() {
    return ['positioning', 'x-direction', 'y-direction'];
  }

  #clear() {
    if (this.#obj) {
      rectpackr.clear(this.#obj);
      this.#obj = undefined;
    }
  }

  #render() {
    const config = parseConfig({
      positioning: this.getAttribute('positioning') ?? undefined,
      'x-direction': this.getAttribute('x-direction') ?? undefined,
      'y-direction': this.getAttribute('y-direction') ?? undefined,
    });

    if (this.shadowRoot) {
      const slot = this.shadowRoot.querySelector('slot')!;
      const style = this.shadowRoot.querySelector('style')!;
      style.textContent = getStyleTextContent(config);
      this.#obj = rectpackr.create(slot, this, config);
    } else {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      const slot = document.createElement('slot');
      const style = document.createElement('style');
      style.textContent = getStyleTextContent(config);
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(slot);
      this.#obj = rectpackr.create(slot, this, config);
    }
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#clear();
      this.#render();
    }
  }

  connectedCallback() {
    this.#render();
  }

  disconnectedCallback() {
    this.#clear();
  }
}
