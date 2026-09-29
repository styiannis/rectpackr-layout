# FAQ

Behaviour that surprises people, the errors you can meet, and the
integration questions a custom element raises.

**Last verified:** 2026-09-29 · v1.0.1

## Behaviour

### Nothing moved, and the element has no height

The component styles the `<slot>` inside its shadow root and the children it
positions. It writes no rule for the host, so the element's `display` and width
come from your stylesheet. An element that computes to zero width gives the
packing a strip one unit wide — every child is clamped to it and stacked in a
line.

```css
rectpackr-layout {
  display: block;
  width: 100%;
}
```

Check next that the children have a measurable width and height. A child
measuring zero in either dimension is skipped rather than packed.

### A child hangs over the right edge

Its width is greater than the element's. The packing clamps the measurement to
the strip width so that the child can still be placed, but nothing resizes the
child itself, so it is positioned at the left edge and overflows to the right.
A 400 x 50 child in a 300px-wide element is placed at `translate(0, 0)`, and
the next child goes below it at `y = 50` rather than beside it.

Give oversized children `max-width: 100%`, or let the layout scroll.

### Two children are on top of each other

One of them measures zero in a dimension. Such a child is not packed; it is
parked at the right-hand edge of the previous placement, which is very often
exactly where the next real child lands. It occupies no space and contributes
no height, so the overlap is invisible unless the child has visible overflow.

The usual cause is a child that has not been given a height yet — an image
still loading, or a container whose content has not arrived.

### Everything is stacked in a narrow column

The packing ran against a width it could not measure. Rule out first the
zero-width element of the first question on this page. The other cause is an
element laid out while it is not rendered — inside a `display: none` subtree,
or in an environment with no layout at all — because the width it reads is then
a computed value such as `100%` rather than a used length in pixels, and `100%`
parses as the number 100.

It corrects itself: the observer on the element reports the real width as soon
as the element has one, and a width that differs from the one in use starts a
new packing. If the column persists, the element never became visible.

### The visual order does not match the document order

That is inherent to the packing. Children are placed in document order but
positioned by fit, so a later child regularly appears above and to the left of
an earlier one.

Tab order, screen-reader order and `Ctrl+F` all follow the document, not the
layout. If the reading order matters, the document order has to be the one you
want read, and no CSS in the component changes that.

### My own `transform` on a child stopped working

The component writes to `transform` by default, on every re-pack. Set
`positioning="offset"` to move the position onto `inset` and get `transform`
back for your own rules. There is no reverse trade for `inset`. Under the
default the shadow stylesheet fixes it to a corner with `!important`, which no
rule outside the shadow root overrides.

To animate re-packing, put the transition on the property the component owns:
`transition: transform 200ms` under the default, `transition: inset 200ms`
under `offset`.

### What happens to the position of a child I remove?

It is cleared. The component writes an inline `transform` (or `inset`), and
when a child leaves the element it clears that property in the same callback
that notices the removal, so an element moved elsewhere in the page arrives
without it.

A child moved within the element — a keyed list reordering its nodes — is not
cleared. It keeps its old position until the pack that follows the move gives
it the new one.

### Emptying the element leaves `height: 0px`, not no height

Removing the last child re-packs an empty set, and an empty packing is zero
tall, so the inline height stays and reads `0px`. It is cleared entirely only
when the element is disconnected from the document.

### Does writing an attribute its current value re-pack?

No. `attributeChangedCallback` fires on every write to an observed attribute,
and the component compares the old value with the new one and returns when
they are equal, so a framework that writes its attributes on every render pays
nothing while they stay the same.

The comparison is of the attribute's text, not of what it means. Removing
`positioning="transform"` falls back to the same default and still tears the
instance down and rebuilds it.

### A child with a `slot` attribute is still counted

The component observes its children by walking them and keeping every
`HTMLElement` and `SVGElement`, while the rule that positions them is
`::slotted(:not([slot]))`. A child carrying a `slot` attribute is therefore
packed — it takes a position, adds to the element's height and still receives
the inline `transform` — but never laid out or rendered, because the
`position: absolute` rule does not match it and the component's shadow root
has only one unnamed slot to assign it to.

### Is the layout deterministic?

Yes, for a given set of measurements. The same children, the same sizes and
the same document order produce the same coordinates every time; nothing in
the placement is random, and nothing is reconsidered after it is placed.

The measurements are the variable part. A child whose size depends on when a
font or an image arrives can be packed against one height and re-packed
against another.

### Does it re-pack when the element's height changes?

No. Only its width matters, and the component compares the new computed width
against the width the packing is already using and returns when they are
equal. A container that grows taller because the packing grew taller does not
trigger a second pass.

## Errors

The source contains no `throw`. Apart from a missing browser API, covered
below, the one exception you can meet comes from the packing library
underneath, when the width it is given is not a number:

```text
TypeError: Strip width (NaN) should be numerical value.
```

It is raised inside `connectedCallback`, and it means the slot's computed
width did not parse — `getComputedStyle(slot).width` returned something like
`""` or `auto`. Custom element callbacks do not propagate: the platform reports
the failure as an uncaught error on `window` instead, so the code that inserted
the element sees no exception. What you get is the element connected, its
shadow root attached, no child positioned, and a `TypeError` in the console.

In a browser a rendered element always reports pixels, so the realistic cause
is a test environment without layout. See the last question below.

There is a quieter version of the same thing. The shadow stylesheet declares
`slot { width: 100% }`, and where that rule resolves but no layout does,
`getComputedStyle` returns `"100%"`, which parses to `100`. No error is
reported and the packing simply runs against a strip 100 units wide.

## Environment and integration

### Which browser APIs does it need?

Custom elements and shadow DOM, `ResizeObserver`, `MutationObserver`,
`requestAnimationFrame` and `getComputedStyle`. The oldest browser versions
that run it are listed under the version requirements below.

There is no feature detection and no fallback, and where the failure surfaces
depends on what is missing. Without custom elements the import itself throws.
Without shadow DOM, either observer or `getComputedStyle`, `connectedCallback`
fails. Without `requestAnimationFrame`, the first observer callback does. In
the last two cases the element is left connected and unpositioned, with the
error reported on `window` rather than raised at the call site.

### Does it work on the server?

No, and it fails at import rather than at render. The module evaluates a class
declaration extending `HTMLElement`, so importing it where there is no DOM
throws `ReferenceError: HTMLElement is not defined`. Under a framework that
renders on the server, import it from a client-only module or behind a dynamic
import.

### ESM, CommonJS or a script tag?

All three. `import` resolves to `dist/es/index.mjs` and `require` to
`dist/cjs/index.cjs`, each with its own declarations —
`dist/@types/es/index.d.mts` and `dist/@types/cjs/index.d.cts` — emitted from
the same source by the same build. The module system is carried by the file
extension rather than inferred from a `type` field, so Node reads each build
as what it is.

`dist/umd/index.js` is a third format, minified, with the dependency compiled
into it, and it is what `unpkg` and `jsdelivr` serve by default. It defines
the global `RectpackrLayout`.

### Will a bundler drop it if I only import it for its side effect?

No, and that is deliberate. The package declares `"sideEffects": true`,
because importing it is what registers the custom element. The opposite
declaration is an invitation to drop an import whose value is never read,
which is exactly the shape of `import "rectpackr-layout"`.

### How do I use it from React, Vue or Svelte?

Import the module once, anywhere on the client, and then write the element in
your markup. Everything it is configured with is an attribute, and it has no
properties, methods or events, so there is nothing to bind and no ref to hold.

Two framework-side notes. Vue's template compiler needs the tag declared as a
custom element via `compilerOptions.isCustomElement`, or it warns about an
unknown component. And a framework that replaces children on every render is
doing the thing the `MutationObserver` reacts to, which costs a re-pack per
change — keyed lists that reuse their DOM nodes avoid it.

### Can I register it under a different tag name?

Not directly: a constructor may be registered only once, and importing the
module registers this one as `rectpackr-layout`. Subclass the default export
and register the subclass:

```javascript
import RectpackrLayout from 'rectpackr-layout';

customElements.define('photo-wall', class extends RectpackrLayout {});
```

### Does TypeScript know about the element?

Yes. The type definitions augment `HTMLElementTagNameMap`, so
`document.querySelector("rectpackr-layout")` is typed as the component's
class rather than as `Element`.

Editors that read a custom-elements manifest get the attributes as well: the
build emits `dist/custom-elements.json` from the JSDoc on the class, and
`package.json` points at it through the `customElements` field.

### What are the version requirements?

In the browser, each engine's floor is set by a different feature:

| Engine  | From | Set by                                                                                                                                        |
| ------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome  | 92   | `Array.prototype.at`, which the packing library's heap calls when two segments of the skyline merge. Before 92 that pack throws a `TypeError` |
| Firefox | 92   | `ResizeObserverEntry.borderBoxSize` as an array. From 69 to 91 it is a single object, and every child measures zero                           |
| Safari  | 15.4 | `borderBoxSize` and the `box` option of `ResizeObserver.observe`                                                                              |

The published JavaScript targets ES2022, so the class's private field and
methods ship as native syntax. They reached each engine earlier than the
feature in the table.

Everything else is toolchain: `engines` declares Node ≥ 20.19 and npm ≥ 10,
which is what installs and bundles the package rather than what runs it.
TypeScript users need a version that understands the `exports` field — 4.7 or
later with `moduleResolution` set to `node16`, `nodenext` or `bundler`.

### How do I test a component that uses it?

In jsdom you must supply what the browser would: mock `ResizeObserver`, mock
`getComputedStyle` so the slot reports a width, and make
`requestAnimationFrame` run its callback synchronously so the re-pack happens
inside the test rather than after it. Without the width mock you get the `NaN`
`TypeError` above — reported, not thrown, so a test that only checks positions
fails on the positions rather than on the cause.

The repository's `tests/mocks/` folder and `tests/util/setupTest.ts`, which
holds the `getComputedStyle` mock, implement all three and are the shortest
working reference.
