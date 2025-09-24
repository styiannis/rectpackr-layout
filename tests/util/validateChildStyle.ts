export function validateChildStyle(
  element: Node,
  expected: {
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    transform?: string;
  }
) {
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    expect({
      width: element.style.width,
      height: element.style.height,
      top: element.style.top,
      left: element.style.left,
      right: element.style.right,
      bottom: element.style.bottom,
      transform: element.style.transform,
    }).toStrictEqual({
      width: '',
      height: '',
      transform: '',
      top: '',
      left: '',
      right: '',
      bottom: '',
      ...expected,
    });
  }
}
