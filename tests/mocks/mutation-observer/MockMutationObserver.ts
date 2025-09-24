const data = Object.freeze({
  callbacksObservers: new Map<MutationCallback, MutationObserver>(),
  nodesCallbacks: new Map<
    Node,
    { callback: MutationCallback; options?: MutationObserverInit }[]
  >(),
  observedNodes: new Map<MutationObserver, Map<Node, MutationObserverInit>>(),
});

export class MockMutationObserver {
  #callback: MutationCallback;

  constructor(callback: MutationCallback) {
    data.callbacksObservers.set(callback, this);
    data.observedNodes.set(this, new Map());
    this.#callback = callback;
  }

  disconnect() {
    data.observedNodes.get(this)?.forEach((_, target, observedNodes) => {
      const callbacks = data.nodesCallbacks.get(target);

      if (!callbacks) {
        return;
      }

      const index = callbacks.findIndex(
        (obs) => obs.callback === this.#callback
      );

      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        data.nodesCallbacks.delete(target);
      }

      observedNodes.delete(target);
    });
  }

  observe(target: Node, options: MutationObserverInit = {}) {
    data.observedNodes.get(this)!.set(target, options);

    if (!data.nodesCallbacks.has(target)) {
      data.nodesCallbacks.set(target, []);
    }

    data.nodesCallbacks
      .get(target)!
      .push({ callback: this.#callback, options });
  }

  takeRecords() {
    return [];
  }

  static getCallbackObserver(callback: MutationCallback) {
    return data.callbacksObservers.get(callback);
  }

  static getNodeCallbacks(node: Node) {
    return data.nodesCallbacks.get(node);
  }
}

export function clearAllInstancesData() {
  data.callbacksObservers.clear();
  data.nodesCallbacks.clear();
  data.observedNodes.clear();
}
