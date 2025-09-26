import RectpackrLayout from '../src';
import { isValidRectpackrLayoutInstance, setupTest } from './util';
import { IRectpackrLayoutAttributes } from './util/types';

it('Validate class instance', () => {
  expect(isValidRectpackrLayoutInstance(new RectpackrLayout())).toBe(true);
});

describe('Validate web-component instance', () => {
  const attributesInsetCombinations: [
    IRectpackrLayoutAttributes['positioning'],
    IRectpackrLayoutAttributes['x-direction'],
    IRectpackrLayoutAttributes['y-direction'],
    string
  ][] = [
    ['offset', 'ltr', 'ttb', '0 auto auto 0'],
    ['offset', 'ltr', 'btt', 'auto auto 0 0'],
    ['offset', 'rtl', 'ttb', '0 0 auto auto'],
    ['offset', 'rtl', 'btt', 'auto 0 0 auto'],
    ['transform', 'ltr', 'ttb', '0 auto auto 0'],
    ['transform', 'ltr', 'btt', 'auto auto 0 0'],
    ['transform', 'rtl', 'ttb', '0 0 auto auto'],
    ['transform', 'rtl', 'btt', 'auto 0 0 auto'],
  ];

  const attributesInset = attributesInsetCombinations.reduce(
    (acc, [positioning, xd, yd, inset]) =>
      acc.set({ positioning, 'x-direction': xd, 'y-direction': yd }, inset),
    new Map<IRectpackrLayoutAttributes, string>()
  );

  afterEach(() => {
    expect(document.body.innerHTML).toBe('');
  });

  const attrCases = [
    ['Attributes: None (default)', {}, '0 auto auto 0'],
    ...[...attributesInset.entries()].map(([attributes, insetValue]) => [
      `Attributes: ${JSON.stringify(attributes)}`,
      attributes,
      insetValue,
    ]),
  ] as [string, Partial<IRectpackrLayoutAttributes>, string][];

  it.each(attrCases)('%s', (_, attributes, insetValue) => {
    const containerWidth = 100;

    const { clear, init, wcElement } = setupTest(
      containerWidth,
      undefined,
      attributes
    );

    init();

    expect(isValidRectpackrLayoutInstance(wcElement)).toBe(true);
    expect(wcElement.shadowRoot).toBeDefined();

    const shadowRoot = wcElement.shadowRoot!;

    expect(shadowRoot.querySelector('style')).toBeDefined();
    expect(shadowRoot.querySelector('slot')).toBeDefined();

    const slot = shadowRoot.querySelector('slot')!;
    const style = shadowRoot.querySelector('style')!;

    expect(slot.innerHTML).toBe('');

    expect(style.innerHTML).toContain(
      'slot{ box-sizing: border-box; position: relative; display: block; width: 100% }'
    );

    if (attributes.positioning === 'offset') {
      expect(style.innerHTML).toContain(
        `::slotted(:not([slot])){ position: absolute !important }`
      );
    } else {
      expect(style.innerHTML).toContain(
        `::slotted(:not([slot])){ position: absolute !important; inset: ${insetValue} !important }`
      );
    }

    clear();
  });
});
