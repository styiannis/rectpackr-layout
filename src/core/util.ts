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
  if (instance.pendingStartObservingChildren) {
    return;
  }

  instance.pendingStartObservingChildren = true;
  stopObservingChildren(instance);

  requestAnimationFrame(() => {
    instance.pendingStartObservingChildren = false;
    startObservingChildren(instance);
  });
}

function restartObservingImages(instance: IRectpackr) {
  stopObservingImages(instance);
  startObservingImages(instance);
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

function startObservingImages(instance: IRectpackr) {
  function callback(this: HTMLImageElement) {
    instance.loadingImages.delete(this);
    restartObservingChildren(instance);
  }

  for (const img of instance.childrenContainer.querySelectorAll('img')) {
    if (!img.complete && !instance.loadingImages.get(img)) {
      instance.loadingImages.set(img, callback);
      img.addEventListener('load', callback, { once: true, passive: true });
    }
  }
}

function stopObservingChildren(instance: IRectpackr) {
  instance.observers.childrenResize.disconnect();

  if (instance.childrenContainer.children.length === 0) {
    instance.children.length = 0;
    resetStyle(instance);
  }
}

function stopObservingChildrenContainer(instance: IRectpackr) {
  instance.observers.childrenContainerMutation.takeRecords(); // Flush any queued mutations
  instance.observers.childrenContainerMutation.disconnect();
}

function stopObservingContainer(instance: IRectpackr) {
  instance.observers.containerResize.disconnect();
}

function stopObservingImages(instance: IRectpackr) {
  for (const [img, callback] of instance.loadingImages) {
    img.removeEventListener('load', callback);
    instance.loadingImages.delete(img);
  }
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
    const xVal =
      point[0] *
      (instance.config.positioning === 'transform' &&
      instance.config['x-direction'] === 'rtl'
        ? -1
        : 1);

    const yVal =
      point[1] *
      (instance.config.positioning === 'transform' &&
      instance.config['y-direction'] === 'btt'
        ? -1
        : 1);

    const x = xVal === 0 ? '0' : `${xVal}px`;
    const y = yVal === 0 ? '0' : `${yVal}px`;

    if (instance.config.positioning === 'offset') {
      element.style.inset = {
        ltr: { ttb: `${y} auto auto ${x}`, btt: `auto auto ${y} ${x}` },
        rtl: { ttb: `${y} ${x} auto auto`, btt: `auto ${x} ${y} auto` },
      }[instance.config['x-direction']][instance.config['y-direction']];
    } else {
      element.style.transform = `translate(${x}, ${y})`;
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
  restartObservingImages(instance);
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
  // Reset children style
  for (const { element } of instance.children) {
    if (instance.config.positioning === 'offset') {
      element.style.inset = '';
    } else {
      element.style.transform = '';
    }
  }

  // Reset container style
  instance.container.style.height = '';
}

export function startObserving(instance: IRectpackr) {
  startObservingChildren(instance);
  startObservingChildrenContainer(instance);
  startObservingContainer(instance);
  startObservingImages(instance);
}

export function stopObserving(instance: IRectpackr) {
  stopObservingChildren(instance);
  stopObservingChildrenContainer(instance);
  stopObservingContainer(instance);
  stopObservingImages(instance);
}
