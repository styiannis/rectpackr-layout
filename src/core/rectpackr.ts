import { BestFitStripPack } from 'best-fit-strip-pack';
import { IRectpackr } from './types';
import {
  onChildResize,
  onChildrenContainerMutation,
  onContainerResize,
  resetStyle,
  startObserving,
  stopObserving,
} from './util';

export function create<R extends IRectpackr>(
  container: R['container'],
  childrenContainer: R['childrenContainer'],
  config: R['config']
) {
  const childrenContainerMutation = new MutationObserver(() =>
    onChildrenContainerMutation(instance)
  );

  const childrenResize = new ResizeObserver((entries) =>
    onChildResize(instance, entries)
  );

  const containerResize = new ResizeObserver(() => onContainerResize(instance));

  const stripPack = new BestFitStripPack(
    Math.max(1, parseFloat(getComputedStyle(container).width))
  );

  const instance = {
    config,
    container,
    children: [] as R['children'],
    childrenContainer,
    loadingImages: new Map(),
    observers: { childrenContainerMutation, childrenResize, containerResize },
    pendingStartObservingChildren: false,
    stripPack,
  } as R;

  startObserving(instance);

  return instance;
}

export function clear<R extends IRectpackr>(instance: R) {
  stopObserving(instance);
  resetStyle(instance);
  instance.stripPack.reset();
}
