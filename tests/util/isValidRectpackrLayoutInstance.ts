import RectpackrLayout from '../../src';

const areIdenticalArrays = (a: any[], b: any[]) =>
  a.length === b.length && a.every((val, i) => val === b[i]);

export function isValidRectpackrLayoutInstance(instance: unknown) {
  const props = Object.getOwnPropertyNames(instance).sort();

  const protoProps = Object.getOwnPropertyNames(
    Object.getPrototypeOf(instance)
  ).sort();

  return (
    'object' === typeof instance &&
    instance instanceof RectpackrLayout &&
    instance instanceof HTMLElement &&
    Object.getPrototypeOf(instance) === RectpackrLayout.prototype &&
    Object.getPrototypeOf(instance) !== HTMLElement.prototype &&
    areIdenticalArrays(props, []) &&
    areIdenticalArrays(protoProps, [
      'attributeChangedCallback',
      'connectedCallback',
      'constructor',
      'disconnectedCallback',
    ])
  );
}
