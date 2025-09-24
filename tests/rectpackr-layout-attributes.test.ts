import { generateHTMLElements, setupTest, validateChildStyle } from './util';
import {
  EmptyStringValueOption,
  IRectangle,
  IRectpackrLayoutAttributes,
} from './util/types';

describe('Change attributes', () => {
  const shadowRootChildrenStyle = Object.freeze({
    ltr: '::slotted(:not([slot])){ position:absolute; inset:0 auto auto 0 }',
    rtl: '::slotted(:not([slot])){ position:absolute; inset:0 0 auto auto }',
    ttb: '::slotted(:not([slot])){ position:absolute; inset:0 auto auto 0 }',
    btt: '::slotted(:not([slot])){ position:absolute; inset:auto auto 0 0 }',
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
        top?: string;
        left?: string;
        right?: string;
        bottom?: string;
        transform?: string;
      }[]
    ) => {
      changeAttributes(attr);

      expect(shadowRootStyle.innerHTML).toContain(expectedStyle);

      expected.forEach(({ element, top, left, right, bottom, transform }) => {
        validateChildStyle(element, {
          width: `${childWidth}px`,
          height: `${childHeight}px`,
          top: top ?? '',
          left: left ?? '',
          right: right ?? '',
          bottom: bottom ?? '',
          transform: transform ?? '',
        });
      });
    };

    init();

    const shadowRootStyle = wcElement.shadowRoot!.querySelector('style')!;

    expect(shadowRootStyle.innerHTML).toContain(shadowRootChildrenStyle.ltr);

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform: `translate(${i * childWidth}px, 0px)`,
      })
    );

    changeAttributeAndValidate(
      { 'x-direction': 'rtl' },
      shadowRootChildrenStyle.rtl,
      [
        {
          element: children[0]!,
          transform: `translate(${0 * (-1 * childWidth)}px, 0px)`,
        },
        {
          element: children[1]!,
          transform: `translate(${1 * (-1 * childWidth)}px, 0px)`,
        },
        {
          element: children[2]!,
          transform: `translate(${2 * (-1 * childWidth)}px, 0px)`,
        },
        {
          element: children[3]!,
          transform: `translate(${3 * (-1 * childWidth)}px, 0px)`,
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'offset' },
      shadowRootChildrenStyle.rtl,
      [
        {
          element: children[0]!,
          top: '0px',
          right: `${0 * childWidth}px`,
        },
        {
          element: children[1]!,
          top: '0px',
          right: `${1 * childWidth}px`,
        },
        {
          element: children[2]!,
          top: '0px',
          right: `${2 * childWidth}px`,
        },
        {
          element: children[3]!,
          top: '0px',
          right: `${3 * childWidth}px`,
        },
      ]
    );

    changeAttributeAndValidate(
      { 'x-direction': 'ltr' },
      shadowRootChildrenStyle.ltr,
      [
        {
          element: children[0]!,
          top: '0px',
          left: `${0 * childWidth}px`,
        },
        {
          element: children[1]!,
          top: '0px',
          left: `${1 * childWidth}px`,
        },
        {
          element: children[2]!,
          top: '0px',
          left: `${2 * childWidth}px`,
        },
        {
          element: children[3]!,
          top: '0px',
          left: `${3 * childWidth}px`,
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'transform' },
      shadowRootChildrenStyle.ltr,
      [
        {
          element: children[0]!,
          transform: `translate(${0 * childWidth}px, 0px)`,
        },
        {
          element: children[1]!,
          transform: `translate(${1 * childWidth}px, 0px)`,
        },
        {
          element: children[2]!,
          transform: `translate(${2 * childWidth}px, 0px)`,
        },
        {
          element: children[3]!,
          transform: `translate(${3 * childWidth}px, 0px)`,
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
        top?: string;
        left?: string;
        right?: string;
        bottom?: string;
        transform?: string;
      }[]
    ) => {
      changeAttributes(attr);

      expect(shadowRootStyle.innerHTML).toContain(expectedStyle);

      expected.forEach(({ element, top, left, right, bottom, transform }) => {
        validateChildStyle(element, {
          width: `${childWidth}px`,
          height: `${childHeight}px`,
          top: top ?? '',
          left: left ?? '',
          right: right ?? '',
          bottom: bottom ?? '',
          transform: transform ?? '',
        });
      });
    };

    init();

    const shadowRootStyle = wcElement.shadowRoot!.querySelector('style')!;

    expect(shadowRootStyle.innerHTML).toContain(shadowRootChildrenStyle.ttb);

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform: `translate(0px, ${i * childHeight}px)`,
      })
    );

    changeAttributeAndValidate(
      { 'y-direction': 'btt' },
      shadowRootChildrenStyle.btt,
      [
        {
          element: children[0]!,
          transform: `translate(0px, ${0 * (-1 * childHeight)}px)`,
        },
        {
          element: children[1]!,
          transform: `translate(0px, ${1 * (-1 * childHeight)}px)`,
        },
        {
          element: children[2]!,
          transform: `translate(0px, ${2 * (-1 * childHeight)}px)`,
        },
        {
          element: children[3]!,
          transform: `translate(0px, ${3 * (-1 * childHeight)}px)`,
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'offset' },
      shadowRootChildrenStyle.btt,
      [
        {
          element: children[0]!,
          bottom: `${0 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[1]!,
          bottom: `${1 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[2]!,
          bottom: `${2 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[3]!,
          bottom: `${3 * childHeight}px`,
          left: '0px',
        },
      ]
    );

    changeAttributeAndValidate(
      { 'y-direction': 'ttb' },
      shadowRootChildrenStyle.ttb,
      [
        {
          element: children[0]!,
          top: `${0 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[1]!,
          top: `${1 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[2]!,
          top: `${2 * childHeight}px`,
          left: '0px',
        },
        {
          element: children[3]!,
          top: `${3 * childHeight}px`,
          left: '0px',
        },
      ]
    );

    changeAttributeAndValidate(
      { positioning: 'transform' },
      shadowRootChildrenStyle.ttb,
      [
        {
          element: children[0]!,
          transform: `translate(0px, ${0 * childHeight}px)`,
        },
        {
          element: children[1]!,
          transform: `translate(0px, ${1 * childHeight}px)`,
        },
        {
          element: children[2]!,
          transform: `translate(0px, ${2 * childHeight}px)`,
        },
        {
          element: children[3]!,
          transform: `translate(0px, ${3 * childHeight}px)`,
        },
      ]
    );

    clear();
  });
});
