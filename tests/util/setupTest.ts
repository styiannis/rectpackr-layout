import RectpackrLayout from '../../src';
import { IRectpackrChildElement, IRectpackrConfig } from '../../src/core';
import { triggerChildListChange, triggerResize } from '../mocks';
import {
  EmptyStringValueOption,
  IRectangle,
  IRectpackrLayoutAttributes,
} from './types';

interface TestRectpackrLayout {
  element: RectpackrLayout;
  dimensions: IRectangle;
  children: { element: IRectpackrChildElement; dimensions: IRectangle }[];
  mocks: { getComputedStyle: { original: typeof global.getComputedStyle } };
}

export function setupTest(
  containerWidth: number,
  childrenMap?: Map<Node, IRectangle>,
  componentAttributes: Partial<
    EmptyStringValueOption<IRectpackrLayoutAttributes>
  > = {}
) {
  const instance = {
    children: [],
    dimensions: { width: containerWidth, height: 0 },
    element: new RectpackrLayout(),
    mocks: { getComputedStyle: { original: global.getComputedStyle } },
  } as TestRectpackrLayout;

  const isValidChildInstance = (el: Node): el is IRectpackrChildElement =>
    el instanceof HTMLElement || el instanceof SVGElement;

  function appendChild(
    element: Node,
    dimensions: IRectangle,
    options: { triggerChange?: boolean; triggerRender?: boolean } = {
      triggerChange: true,
      triggerRender: true,
    }
  ) {
    const triggerChange =
      options.triggerChange !== undefined ? options.triggerChange : true;

    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    if (isValidChildInstance(element)) {
      element.style.width = `${dimensions.width}px`;
      element.style.height = `${dimensions.height}px`;
      instance.children.push({ element, dimensions: { ...dimensions } });
    }

    instance.element.appendChild(element);

    if (triggerChange) {
      triggerChildListChange(instance.element, [element]);
    }

    if (triggerRender && isValidChildInstance(element)) {
      triggerResize(element, dimensions);
    }
  }

  function appendChildren(
    nodesMap: Map<Node, IRectangle>,
    options: { triggerChange?: boolean; triggerRender?: boolean } = {
      triggerChange: true,
      triggerRender: true,
    }
  ) {
    const triggerChange =
      options.triggerChange !== undefined ? options.triggerChange : true;

    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    for (const [element, dimensions] of nodesMap) {
      appendChild(element, dimensions, {
        triggerChange: false,
        triggerRender: false,
      });
    }

    const addedElements = [...nodesMap.keys()].filter((el) =>
      isValidChildInstance(el)
    );

    if (triggerChange) {
      triggerChildListChange(instance.element, addedElements);
    }

    if (triggerRender && addedElements[0] !== undefined) {
      triggerResize(addedElements[0], nodesMap.get(addedElements[0])!);
    }
  }

  function changeAttributes(
    attributes: {
      positioning?: IRectpackrConfig['positioning'] | '';
      'x-direction'?: IRectpackrConfig['x-direction'] | '';
      'y-direction'?: IRectpackrConfig['y-direction'] | '';
    },
    options = { triggerRender: true }
  ) {
    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    for (const name in attributes) {
      instance.element.setAttribute(
        name,
        attributes[name as keyof typeof attributes]!
      );
    }

    if (!triggerRender) {
      return;
    }

    if (instance.children[0] !== undefined) {
      triggerResize(
        instance.children[0].element,
        instance.children[0].dimensions
      );
    } else {
      triggerResize(
        instance.element.shadowRoot!.querySelector('slot')!,
        instance.dimensions
      );
    }
  }

  function changeWidth(newWidth: number, options = { triggerRender: true }) {
    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    instance.dimensions.width = newWidth;

    if (triggerRender) {
      triggerResize(
        instance.element.shadowRoot!.querySelector('slot')!,
        instance.dimensions
      );
    }
  }

  function clear() {
    // Clear children elements array
    instance.children.length = 0;

    // Remove component element from document body
    document.body.removeChild(instance.element);

    // Reset global mocks
    global.getComputedStyle = instance.mocks.getComputedStyle.original;
  }

  function init() {
    // Mock getComputedStyle implementation
    global.getComputedStyle = (element) =>
      new Proxy(instance.mocks.getComputedStyle.original(element)!, {
        // Mock only width value of <slot> elements
        get: (target, prop: string & keyof CSSStyleDeclaration) =>
          element instanceof HTMLSlotElement && prop === 'width'
            ? `${instance.dimensions[prop]}px`
            : target[prop],
      });

    // Add component element to document body
    document.body.appendChild(instance.element);

    if (instance.children[0] !== undefined) {
      triggerChildListChange(
        instance.element,
        instance.children.map(({ element }) => element)
      );

      // Trigger initial render
      triggerResize(
        instance.children[0].element,
        instance.children[0].dimensions
      );
    }
  }

  function prependChild(
    node: Node,
    dimensions: IRectangle,
    options: { triggerChange?: boolean; triggerRender?: boolean } = {
      triggerChange: true,
      triggerRender: true,
    }
  ) {
    const triggerChange =
      options.triggerChange !== undefined ? options.triggerChange : true;

    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    if (isValidChildInstance(node)) {
      node.style.width = `${dimensions.width}px`;
      node.style.height = `${dimensions.height}px`;
      instance.children.unshift({
        element: node,
        dimensions: { ...dimensions },
      });
    }

    instance.element.prepend(node);

    if (triggerChange) {
      triggerChildListChange(instance.element, [node]);
    }

    if (triggerRender && isValidChildInstance(node)) {
      triggerResize(node, dimensions);
    }
  }

  function replaceChildren(
    nodesMap: Map<Node, IRectangle>,
    options: { triggerChange?: boolean; triggerRender?: boolean } = {
      triggerChange: true,
      triggerRender: true,
    }
  ) {
    const triggerChange =
      options.triggerChange !== undefined ? options.triggerChange : true;

    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    const removedElements = instance.children.map(({ element }) => element);

    const addedElements = [...nodesMap.keys()].filter((el) =>
      isValidChildInstance(el)
    );

    instance.children.length = 0;
    instance.element.innerHTML = '';

    for (const [element, dimensions] of nodesMap) {
      appendChild(element, dimensions, {
        triggerChange: false,
        triggerRender: false,
      });
    }

    if (triggerChange) {
      triggerChildListChange(instance.element, addedElements, removedElements);
    }

    if (triggerRender) {
      if (addedElements[0] !== undefined) {
        triggerResize(addedElements[0], nodesMap.get(addedElements[0])!);
      } else {
        triggerResize(
          instance.element.shadowRoot!.querySelector('slot')!,
          instance.dimensions
        );
      }
    }
  }

  function resizeChild(
    node: Node,
    dimensions: Partial<IRectangle>,
    options: { triggerRender?: boolean } = { triggerRender: true }
  ) {
    const triggerRender =
      options.triggerRender !== undefined ? options.triggerRender : true;

    const child = instance.children.find(({ element }) => element === node);

    if (!child) {
      return;
    }

    child.dimensions.width = dimensions.width ?? child.dimensions.width;
    child.dimensions.height = dimensions.height ?? child.dimensions.height;

    if (triggerRender) {
      triggerResize(child.element, child.dimensions);
    }
  }

  changeAttributes(componentAttributes, { triggerRender: false });

  if (childrenMap) {
    appendChildren(childrenMap, { triggerRender: false });
  }

  return Object.freeze({
    appendChild,
    changeAttributes,
    changeWidth,
    clear,
    init,
    prependChild,
    replaceChildren,
    resizeChild,
    wcElement: instance.element,
  });
}
