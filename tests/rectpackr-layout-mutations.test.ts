import { generateHTMLElements, setupTest, validateChildStyle } from './util';
import { IRectangle } from './util/types';

describe('Container element mutations', () => {
  afterEach(() => {
    expect(document.body.innerHTML).toBe('');
  });

  it('Append children', () => {
    const children: Node[] = generateHTMLElements(2);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth * (children.length + 1);

    const { appendChild, clear, init } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<Node, IRectangle>()
      )
    );

    init();

    children.forEach((child, i) => {
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      });
    });

    /*
     * Append a Text node
     */

    const textChild = document.createTextNode('TEXT_NODE');

    children.push(textChild);

    appendChild(textChild, { width: childWidth, height: childHeight });

    children.forEach((child, i) => {
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0
            ? 'translate(0, 0)'
            : `translate(${
                Math.min(i, children.length - 2) * childWidth
              }px, 0)`,
      });
    });

    /*
     * Append an HTMLElement, after the Text node.
     */

    const newChild = generateHTMLElements(1)[0]!;

    children.push(newChild);

    appendChild(newChild, { width: childWidth, height: childHeight });

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0
            ? 'translate(0, 0)'
            : `translate(${
                Math.min(i, children.length - 2) * childWidth
              }px, 0)`,
      })
    );

    clear();
  });

  it('Prepend children', () => {
    const children = generateHTMLElements(2);
    const childWidth = 50;
    const childHeight = 25;

    const containerWidth = childWidth * (children.length + 1);

    const { clear, init, prependChild } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    init();

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    const newChild = generateHTMLElements(1)[0]!;

    children.unshift(newChild);

    prependChild(newChild, { width: childWidth, height: childHeight });

    children.forEach((child, i) =>
      validateChildStyle(child, {
        width: `${childWidth}px`,
        height: `${childHeight}px`,
        transform:
          i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
      })
    );

    clear();
  });

  it('Replace children', () => {
    const children = generateHTMLElements(4);
    const newChild = generateHTMLElements(1)[0]!;

    const childWidth = 50;
    const childHeight = 25;

    const extendedChildren: typeof children = [
      children[0]!,
      children[1]!,
      newChild,
      children[2]!,
      children[3]!,
    ];
    const shrinkedChildren: typeof children = [
      extendedChildren[0]!,
      extendedChildren[2]!,
      extendedChildren[4]!,
    ];
    const emptyChildren: typeof children = [];

    const containerWidth = childWidth * extendedChildren.length;

    const { clear, init, replaceChildren } = setupTest(
      containerWidth,
      children.reduce(
        (acc, curr) =>
          acc.set(curr, { width: childWidth, height: childHeight }),
        new Map<HTMLElement, IRectangle>()
      )
    );

    const replaceChildenAndValidate = (newChildren: HTMLElement[]) => {
      replaceChildren(
        newChildren.reduce(
          (acc, curr) =>
            acc.set(curr, { width: childWidth, height: childHeight }),
          new Map<HTMLElement, IRectangle>()
        )
      );

      newChildren.forEach((child, i) => {
        validateChildStyle(child, {
          width: `${childWidth}px`,
          height: `${childHeight}px`,
          transform:
            i === 0 ? 'translate(0, 0)' : `translate(${i * childWidth}px, 0)`,
        });
      });
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

    // Add nodes.
    replaceChildenAndValidate(extendedChildren);

    // Remove nodes.
    replaceChildenAndValidate(shrinkedChildren);

    // Remove all nodes.
    replaceChildenAndValidate(emptyChildren);

    clear();
  });
});
