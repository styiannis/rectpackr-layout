import { MockResizeObserver } from './MockResizeObserver';

/* ------------------------------------------------------------------------- */
/* -------------------------- // Helper functions -------------------------- */
/* ------------------------------------------------------------------------- */

export const elementSupportsInlineCSSStyle = (
  el: Element
): el is Element & { style: CSSStyleDeclaration } =>
  'style' in el && el.style instanceof CSSStyleDeclaration;

const elementHasOffsetProperties = (
  el: Element
): el is Element & { offsetHeight: number; offsetWidth: number } =>
  'offsetHeight' in el && 'offsetWidth' in el;

/* ------------------------------------------------------------------------- */
/* -------------------------- Helper functions // -------------------------- */
/* ------------------------------------------------------------------------- */

export const triggerResize = (
  element: Element & { style: CSSStyleDeclaration },
  size: Partial<Pick<DOMRectReadOnly, 'height' | 'width'>>
) => {
  if (size.width !== undefined) {
    element.style.width = `${size.width}px`;
  }

  if (size.height !== undefined) {
    element.style.height = `${size.height}px`;
  }

  MockResizeObserver.getElementCallbacks(element)?.forEach((callback) => {
    const observer = MockResizeObserver.getCallbackObserver(callback);

    if (!observer) {
      return;
    }

    const entries =
      MockResizeObserver.getObservedElements(observer)?.reduce(
        (acc, target) => {
          if (!elementSupportsInlineCSSStyle(target)) {
            return acc;
          }

          const hasOffsetProperties = elementHasOffsetProperties(target);

          const borderBoxSize = hasOffsetProperties
            ? [
                {
                  inlineSize: target.offsetWidth,
                  blockSize: target.offsetHeight,
                },
              ]
            : [
                {
                  inlineSize: target.clientWidth,
                  blockSize: target.clientHeight,
                },
              ];

          const contentBoxSize = [
            { inlineSize: target.clientWidth, blockSize: target.clientHeight },
          ];

          const contentRect = {
            ...(hasOffsetProperties
              ? { width: target.offsetWidth, height: target.offsetHeight }
              : { width: target.clientWidth, height: target.clientHeight }),
            top: parseFloat(target.style.top),
            left: parseFloat(target.style.left),
            bottom: parseFloat(target.style.bottom),
            right: parseFloat(target.style.right),
            x: -1, // Not currently used
            y: -1, // Not currently used
            toJSON: () => {
              const { toJSON, ...rest } = contentRect;
              return rest;
            },
          };

          acc.push({
            borderBoxSize,
            contentBoxSize,
            contentRect,
            devicePixelContentBoxSize: contentBoxSize,
            target,
          });

          return acc;
        },
        [] as ResizeObserverEntry[]
      ) ?? [];

    callback(entries, observer);
  });
};
