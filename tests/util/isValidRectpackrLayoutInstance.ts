import RectpackrLayout from '../../src';

const arraysEqual = (first: any[], second: any[]) =>
  first.length === second.length &&
  first.every((value, i) => value === second[i]);

const stringSort = (a: string, b: string) => a.localeCompare(b);

export function isValidRectpackrLayoutInstance(instance: unknown) {
  const props = Object.getOwnPropertyNames(instance).sort(stringSort);

  const protoProps = Object.getOwnPropertyNames(
    Object.getPrototypeOf(instance)
  ).sort(stringSort);

  return (
    'object' === typeof instance &&
    instance instanceof RectpackrLayout &&
    instance instanceof HTMLElement &&
    Object.getPrototypeOf(instance) === RectpackrLayout.prototype &&
    Object.getPrototypeOf(instance) !== HTMLElement.prototype &&
    arraysEqual(props, []) &&
    arraysEqual(protoProps, [
      'attributeChangedCallback',
      'connectedCallback',
      'constructor',
      'disconnectedCallback',
    ])
  );
}
