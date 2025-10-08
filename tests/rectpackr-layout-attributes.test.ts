import { generateHTMLElements, setupTest, validateChildStyle } from './util';
import {
  EmptyStringValueOption,
  IRectangle,
  IRectpackrLayoutAttributes,
} from './util/types';

describe('Change attributes', () => {
  const shadowRootOffsetChildrenStyle =
    '::slotted(:not([slot])){ position: absolute !important }';

  const shadowRootTransformChildrenStyle = Object.freeze({
    ltr: '::slotted(:not([slot])){ position: absolute !important; inset: 0 auto auto 0 !important }',
    rtl: '::slotted(:not([slot])){ position: absolute !important; inset: 0 0 auto auto !important }',
    ttb: '::slotted(:not([slot])){ position: absolute !important; inset: 0 auto auto 0 !important }',
    btt: '::slotted(:not([slot])){ position: absolute !important; inset: auto auto 0 0 !important }',
  });

  afterEach(() => {
    expect(document.body.innerHTML).toBe('');
  });

  it("Change 'positioning' & 'x-direction' attributes", () => {
    const children = generateHTMLElements(4);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth * children.length;

    const { clear, init, changeAttributes, wcElement } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    const changeAttributeAndValidate = (
      attr: Partial<EmptyStringValueOption<IRectpackrLayoutAttributes>>,
      expectedStyle: string,
      expected: {
        element: HTMLElement;
        inset?: string;
        transform?: string;
      }[]
    ) => {
      changeAttributes(attr);

      expect(shadowRootStyle.innerHTML).toContain(expectedStyle);

      expected.forEach(({ element, inset, transform }) => {
        validateChildStyle(element, {
          width: `${childWidth}px`,
          height: `${childHeight}px`,
          inset: inset ?? '',
          transform: transform ?? '',
        });
      });
    };

    init();

    const shadowRootStyle = wcElement.shadowRoot!.querySelector('style')!;

    expect(shadowRootStyle.innerHTML).toContain(
      shadowRootTransformChildrenStyle.ltr
    );

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    changeAttributeAndValidate(
      { 'x-direction': 'rtl' },
      shadowRootTransformChildrenStyle.rtl,
      [
        { element: children[0]!, transform: 'translate(0, 0)' },
        {
          element: children[1]!,
          transform: `translate(${1 * (-1 * childWidth)}px, 0)`,
        },
        {
          element: children[2]!,
          transform: `translate(${2 * (-1 * childWidth)}px, 0)`,
        },
        {
          element: children[3]!,
          transform: `translate(${3 * (-1 * childWidth)}px, 0)`,
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'offset' },
      shadowRootOffsetChildrenStyle,
      [
        { element: children[0]!, inset: '0 0 auto auto' },
        { element: children[1]!, inset: `0 ${1 * childWidth}px auto auto` },
        { element: children[2]!, inset: `0 ${2 * childWidth}px auto auto` },
        { element: children[3]!, inset: `0 ${3 * childWidth}px auto auto` },
      ]
    );

    changeAttributeAndValidate(
      { 'x-direction': 'ltr' },
      shadowRootOffsetChildrenStyle,
      [
        { element: children[0]!, inset: '0 auto auto 0' },
        { element: children[1]!, inset: `0 auto auto ${1 * childWidth}px` },
        { element: children[2]!, inset: `0 auto auto ${2 * childWidth}px` },
        { element: children[3]!, inset: `0 auto auto ${3 * childWidth}px` },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'transform' },
      shadowRootTransformChildrenStyle.ltr,
      [
        { element: children[0]!, transform: `translate(0, 0)` },
        {
          element: children[1]!,
          transform: `translate(${1 * childWidth}px, 0)`,
        },
        {
          element: children[2]!,
          transform: `translate(${2 * childWidth}px, 0)`,
        },
        {
          element: children[3]!,
          transform: `translate(${3 * childWidth}px, 0)`,
        },
      ]
    );

    clear();
  });

  it("Change 'positioning' & 'y-direction' attributes", () => {
    const children = generateHTMLElements(4);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth;

    const { clear, init, changeAttributes, wcElement } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    const changeAttributeAndValidate = (
      attr: Partial<EmptyStringValueOption<IRectpackrLayoutAttributes>>,
      expectedStyle: string,
      expected: {
        element: HTMLElement;
        inset?: string;
        transform?: string;
      }[]
    ) => {
      changeAttributes(attr);

      expect(shadowRootStyle.innerHTML).toContain(expectedStyle);

      expected.forEach(({ element, inset, transform }) => {
        validateChildStyle(element, {
          width: `${childWidth}px`,
          height: `${childHeight}px`,
          inset: inset ?? '',
          transform: transform ?? '',
        });
      });
    };

    init();

    const shadowRootStyle = wcElement.shadowRoot!.querySelector('style')!;

    expect(shadowRootStyle.innerHTML).toContain(
      shadowRootTransformChildrenStyle.ttb
    );

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(0, ${i * childHeight}px)`,
      })
    );

    changeAttributeAndValidate(
      { 'y-direction': 'btt' },
      shadowRootTransformChildrenStyle.btt,
      [
        { element: children[0]!, transform: `translate(0, 0)` },
        {
          element: children[1]!,
          transform: `translate(0, ${1 * (-1 * childHeight)}px)`,
        },
        {
          element: children[2]!,
          transform: `translate(0, ${2 * (-1 * childHeight)}px)`,
        },
        {
          element: children[3]!,
          transform: `translate(0, ${3 * (-1 * childHeight)}px)`,
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'offset' },
      shadowRootOffsetChildrenStyle,
      [
        { element: children[0]!, inset: 'auto auto 0 0' },
        { element: children[1]!, inset: `auto auto ${1 * childHeight}px 0` },
        { element: children[2]!, inset: `auto auto ${2 * childHeight}px 0` },
        { element: children[3]!, inset: `auto auto ${3 * childHeight}px 0` },
      ]
    );

    changeAttributeAndValidate(
      { 'y-direction': 'ttb' },
      shadowRootOffsetChildrenStyle,
      [
        { element: children[0]!, inset: '0 auto auto 0' },
        { element: children[1]!, inset: `${1 * childHeight}px auto auto 0` },
        { element: children[2]!, inset: `${2 * childHeight}px auto auto 0` },
        { element: children[3]!, inset: `${3 * childHeight}px auto auto 0` },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'transform' },
      shadowRootTransformChildrenStyle.ttb,
      [
        { element: children[0]!, transform: `translate(0, 0)` },
        {
          element: children[1]!,
          transform: `translate(0, ${1 * childHeight}px)`,
        },
        {
          element: children[2]!,
          transform: `translate(0, ${2 * childHeight}px)`,
        },
        {
          element: children[3]!,
          transform: `translate(0, ${3 * childHeight}px)`,
        },
      ]
    );

    clear();
  });
});
