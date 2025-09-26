import { generateHTMLElements, setupTest, validateChildStyle } from './util';
import { IRectangle } from './util/types';

describe('Elements resizes', () => {
  afterEach(() => {
    expect(document.body.innerHTML).toBe('');
  });

  it('Change container element width', () => {
    const children = generateHTMLElements(4);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth;

    const { changeWidth, clear, init } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    init();

    // Initially, all child elements are aligned vertically, one on top of the other.
    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(0, ${i * childHeight}px)`,
      })
    );

    // Increase the width of container element to fit all child elements in the row.
    changeWidth(children.length * childWidth);

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    // Attempt to trigger the resize event of the container element, without changing its dimensions.
    changeWidth(children.length * childWidth);

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    // Zeroing the width of the container element.
    changeWidth(0);

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(0, ${i * childHeight}px)`,
      })
    );

    clear();
  });

  it('Change children elements dimensions', () => {
    const children = generateHTMLElements(4);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth * children.length;

    const { clear, init, resizeChild } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    const resizeChildAndValidate = (
      child: HTMLElement,
      dimensions: Partial<IRectangle>,
      expected: {
        element: HTMLElement;
        width?: string;
        height?: string;
        transform: string;
      }[]
    ) => {
      resizeChild(child, dimensions);
      expected.forEach(({ element, width, height, transform }) =>
        validateChildStyle(element, {
          width: width ?? `${childWidth}px`,
          height: height ?? `${childHeight}px`,
          transform,
        })
      );
    };

    init();

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    // Increase the width of the second child element to equal the width of the container.
    resizeChildAndValidate(children[1]!, { width: containerWidth }, [
      {
        element: children[0]!,
        transform: 'translate(0, 0)',
      },
      {
        element: children[1]!,
        width: `${containerWidth}px`,
        transform: `translate(0, ${childHeight}px)`,
      },
      {
        element: children[2]!,
        transform: `translate(0, ${2 * childHeight}px)`,
      },

      {
        element: children[3]!,
        transform: `translate(${childWidth}px, ${2 * childHeight}px)`,
      },
    ]);

    // Increase the width of the third child element to exceed the width of the container.
    resizeChildAndValidate(children[2]!, { width: 2 * containerWidth }, [
      {
        element: children[0]!,
        transform: 'translate(0, 0)',
      },
      {
        element: children[1]!,
        width: `${containerWidth}px`,
        transform: `translate(0, ${childHeight}px)`,
      },
      {
        element: children[2]!,
        width: `${2 * containerWidth}px`,
        transform: `translate(0, ${2 * childHeight}px)`,
      },

      {
        element: children[3]!,
        transform: `translate(0, ${3 * childHeight}px)`,
      },
    ]);

    // Increase the height of the first child element by a relatively large amount.
    resizeChildAndValidate(children[0]!, { height: 3 * containerWidth }, [
      {
        element: children[0]!,
        height: `${3 * containerWidth}px`,
        transform: 'translate(0, 0)',
      },
      {
        element: children[1]!,
        width: `${containerWidth}px`,
        transform: `translate(0, ${3 * containerWidth}px)`,
      },
      {
        element: children[2]!,
        width: `${2 * containerWidth}px`,
        transform: `translate(0, ${3 * containerWidth + childHeight}px)`,
      },
      {
        element: children[3]!,
        transform: `translate(0, ${3 * containerWidth + 2 * childHeight}px)`,
      },
    ]);

    // Zeroing the width of the third child element.
    resizeChildAndValidate(children[2]!, { width: 0 }, [
      {
        element: children[0]!,
        height: `${3 * containerWidth}px`,
        transform: 'translate(0, 0)',
      },
      {
        element: children[1]!,
        width: `${containerWidth}px`,
        transform: `translate(0, ${3 * containerWidth}px)`,
      },
      {
        element: children[2]!,
        width: '0px',
        height: `${childHeight}px`,
        transform: `translate(${containerWidth}px, ${3 * containerWidth}px)`,
      },
      {
        element: children[3]!,
        transform: `translate(0, ${3 * containerWidth + childHeight}px)`,
      },
    ]);

    clear();
  });
});
