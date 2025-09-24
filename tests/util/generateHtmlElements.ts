export function generateHTMLElements(
  length: number,
  tagName: keyof HTMLElementTagNameMap = 'div'
) {
  const ret = [];
  for (let i = 0; i < length; i++) {
    ret.push(document.createElement(tagName));
  }
  return ret;
}
