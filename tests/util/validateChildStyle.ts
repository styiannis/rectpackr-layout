export function validateChildStyle(
  element: Node,
  expected: {
    width?: string;
    height?: string;
    inset?: string;
    transform?: string;
  }
) {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
    expect(element instanceof Text).toBe(true);
    return;
  }

  expect({
    width: element.style.width,
    height: element.style.height,
    inset: element.style.inset,
    transform: element.style.transform,
  }).toStrictEqual({
    width: '',
    height: '',
    inset: '',
    transform: '',
    ...expected,
  });
}
