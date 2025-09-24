import { MockMutationObserver } from './MockMutationObserver';

/* ------------------------------------------------------------------------- */
/* -------------------------- // Helper functions -------------------------- */
/* ------------------------------------------------------------------------- */

function arrayOfNodesToNodeList(array: Node[]) {
  const nodes = [...array];

  const nodeList = {
    get length() {
      return nodes.length;
    },
    item(index: number) {
      return nodes[index] || null;
    },
    *[Symbol.iterator](): IterableIterator<Node> {
      for (let i = 0; i < nodes.length; i++) {
        yield nodes[i] as Node;
      }
    },
    forEach(
      callbackFn: (node: Node, index: number, list: NodeList) => void,
      thisArg?: any
    ) {
      nodes.forEach((node, index) =>
        callbackFn.call(thisArg, node, index, this)
      );
    },
    entries() {
      return nodes.entries() as IterableIterator<[number, Node]>;
    },
    keys() {
      return nodes.keys() as IterableIterator<number>;
    },
    values() {
      return nodes.values() as IterableIterator<Node>;
    },
  } as NodeList;

  // Add index properties support
  for (let i = 0; i < nodes.length; i++) {
    Object.defineProperty(nodeList, i, {
      get: () => nodes[i],
      enumerable: true,
      configurable: false,
    });
  }

  return nodeList;
}

/* ------------------------------------------------------------------------- */
/* -------------------------- Helper functions // -------------------------- */
/* ------------------------------------------------------------------------- */

export const triggerChildListChange = (
  target: Node,
  addedNodes?: Node[],
  removedNodes?: Node[]
) =>
  triggerMutation({
    type: 'childList',
    target,
    addedNodes: arrayOfNodesToNodeList(addedNodes ?? []),
    removedNodes: arrayOfNodesToNodeList(removedNodes ?? []),
  });

export const triggerMutation = (
  mutation: {
    target: MutationRecord['target'];
    type: MutationRecord['type'];
  } & Partial<Omit<MutationRecord, 'target' | 'type'>>
) =>
  MockMutationObserver.getNodeCallbacks(mutation.target)?.forEach(
    ({ callback, options }) => {
      if (!options || !options[mutation.type]) {
        return;
      }

      const observer = MockMutationObserver.getCallbackObserver(callback);

      if (!observer) {
        return;
      }

      const records: MutationRecord[] = [
        {
          addedNodes: mutation.addedNodes ?? new NodeList(),
          attributeName: mutation.attributeName || null,
          attributeNamespace: mutation.attributeNamespace || null,
          nextSibling: mutation.nextSibling ?? null,
          oldValue: mutation.oldValue || null,
          previousSibling: mutation.previousSibling ?? null,
          removedNodes: mutation.removedNodes ?? new NodeList(),
          target: mutation.target,
          type: mutation.type,
        },
      ];

      callback(records, observer);
    }
  );
