import { BestFitStripPack } from 'best-fit-strip-pack';
import { IRectpackr, IRectpackrChildElement } from './types';

/* ------------------------------------------------------------------------- */
/* -------------------------- // Helper functions -------------------------- */
/* ------------------------------------------------------------------------- */

const isValidChildInstance = (el: Element): el is IRectpackrChildElement =>
  el instanceof HTMLElement || el instanceof SVGElement;

function render(instance: IRectpackr) {
  updateStyle(instance, updateStripPack(instance));
}

function restartObservingChildren(instance: IRectpackr) {
  stopObservingChildren(instance);
  startObservingChildren(instance);
}

function startObservingChildren(instance: IRectpackr) {
  for (const child of instance.childrenContainer.children) {
    if (isValidChildInstance(child)) {
      instance.observers.childrenResize.observe(child, { box: 'border-box' });
    }
  }
}

function startObservingChildrenContainer(instance: IRectpackr) {
  instance.observers.childrenContainerMutation.observe(
    instance.childrenContainer,
    { childList: true }
  );
}

function startObservingContainer(instance: IRectpackr) {
  instance.observers.containerResize.observe(instance.container, {
    box: 'content-box',
  });
}

function stopObservingChildren(instance: IRectpackr) {
  instance.observers.childrenResize.disconnect();
}

function stopObservingChildrenContainer(instance: IRectpackr) {
  instance.observers.childrenContainerMutation.takeRecords(); // Flush any queued mutations
  instance.observers.childrenContainerMutation.disconnect();
}

function stopObservingContainer(instance: IRectpackr) {
  instance.observers.containerResize.disconnect();
}

function updateStripPack(instance: IRectpackr) {
  const ret: { element: IRectpackrChildElement; point: [number, number] }[] =
    [];

  // The position to use if an element has zero dimension.
  const hiddenPosition = { x: 0, y: 0 };

  for (const { element, height: h, width } of instance.children) {
    const w = Math.min(width, instance.stripPack.stripWidth);

    const position =
      w === 0 || h === 0 ? hiddenPosition : instance.stripPack.insert(w, h);

    ret.push({ element, point: [position.x, position.y] });

    hiddenPosition.x = position.x + w;
    hiddenPosition.y = position.y;
  }

  return ret;
}

function updateStyle(
  instance: IRectpackr,
  children: { element: IRectpackrChildElement; point: [number, number] }[]
) {
  /*
   * Update children style.
   */
  for (const { element, point } of children) {
    const x =
      point[0] *
      (instance.config.positioning === 'transform' &&
      instance.config['x-direction'] === 'rtl'
        ? -1
        : 1);

    const y =
      point[1] *
      (instance.config.positioning === 'transform' &&
      instance.config['y-direction'] === 'btt'
        ? -1
        : 1);

    if (instance.config.positioning === 'offset') {
      if (instance.config['y-direction'] === 'btt') {
        element.style.bottom = `${y}px`;
      } else {
        element.style.top = `${y}px`;
      }

      if (instance.config['x-direction'] === 'rtl') {
        element.style.right = `${x}px`;
      } else {
        element.style.left = `${x}px`;
      }
    } else {
      element.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  /*
   * Update container style.
   */
  instance.container.style.height = `${instance.stripPack.packedHeight}px`;
}

/* ------------------------------------------------------------------------- */
/* -------------------------- Helper functions // -------------------------- */
/* ------------------------------------------------------------------------- */

export function onChildrenContainerMutation(instance: IRectpackr) {
  restartObservingChildren(instance);
}

export function onChildResize(
  instance: IRectpackr,
  entries: ResizeObserverEntry[]
) {
  instance.children.length = 0;

  for (const { borderBoxSize, target } of entries) {
    if (isValidChildInstance(target)) {
      instance.children.push({
        element: target,
        width: borderBoxSize[0] ? borderBoxSize[0].inlineSize : 0,
        height: borderBoxSize[0] ? borderBoxSize[0].blockSize : 0,
      });
    }
  }

  instance.stripPack.reset();

  render(instance);
}

export function onContainerResize(instance: IRectpackr) {
  const containerWidth = Math.max(
    1,
    parseFloat(getComputedStyle(instance.container).width)
  );

  if (containerWidth === instance.stripPack.stripWidth) {
    return;
  }

  instance.stripPack.reset();
  instance.stripPack = new BestFitStripPack(containerWidth);

  render(instance);
}

export function resetStyle(instance: IRectpackr) {
  /*
   * Reset children style.
   */
  for (const { element } of instance.children) {
    if (instance.config.positioning === 'offset') {
      if ('ttb' === instance.config['y-direction']) {
        element.style.top = '';
      } else {
        element.style.bottom = '';
      }

      if ('ltr' === instance.config['x-direction']) {
        element.style.left = '';
      } else {
        element.style.right = '';
      }
    } else {
      element.style.transform = '';
    }
  }

  /*
   * Reset container style.
   */
  instance.container.style.height = '';
}

export function startObserving(instance: IRectpackr) {
  startObservingChildren(instance);
  startObservingChildrenContainer(instance);
  startObservingContainer(instance);
}

export function stopObserving(instance: IRectpackr) {
  stopObservingChildren(instance);
  stopObservingChildrenContainer(instance);
  stopObservingContainer(instance);
}
