const data = Object.freeze({
  callbacksObservers: new Map<ResizeObserverCallback, ResizeObserver>(),
  elementsCallbacks: new Map<Element, ResizeObserverCallback[]>(),
  observedElements: new Map<ResizeObserver, Element[]>(),
});

export class MockResizeObserver {
  #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    data.callbacksObservers.set(callback, this);
    data.observedElements.set(this, []);
    this.#callback = callback;
  }

  disconnect() {
    data.observedElements
      .get(this)
      ?.forEach((element) => this.unobserve(element));
  }

  observe(element: Element) {
    data.observedElements.get(this)!.push(element);

    if (!data.elementsCallbacks.has(element)) {
      data.elementsCallbacks.set(element, []);
    }

    data.elementsCallbacks.get(element)!.push(this.#callback);
  }

  unobserve(element: Element) {
    data.observedElements.set(
      this,
      data.observedElements.get(this)?.filter((el) => el !== element) ?? []
    );

    const callbacks = data.elementsCallbacks.get(element);

    if (!callbacks) {
      return;
    }

    const index = callbacks.indexOf(this.#callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      data.elementsCallbacks.delete(element);
    }
  }

  static getCallbackObserver(callback: ResizeObserverCallback) {
    return data.callbacksObservers.get(callback);
  }

  static getElementCallbacks(element: Element) {
    return data.elementsCallbacks.get(element);
  }

  static getObservedElements(observer: ResizeObserver) {
    return data.observedElements.get(observer);
  }
}

export function clearAllInstancesData() {
  data.callbacksObservers.clear();
  data.elementsCallbacks.clear();
  data.observedElements.clear();
}
