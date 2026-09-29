# Getting started

From an empty page to a packed gallery: what to install, what the element
needs from your CSS, what it writes back to your children, and what to do
about content that arrives late.

**Last verified:** 2026-09-29 · v1.0.1 · needs a DOM

## Install

```bash
npm install rectpackr-layout
```

One runtime dependency comes with it. The package ships an ES build, a
CommonJS build, a UMD bundle and type definitions, so a bundler, Node's
`require` and a plain `<script>` tag are all served.

If you are not using a bundler at all, the UMD bundle is self-contained — the
dependency is compiled into it — and a single tag is the whole installation:

```html
<script src="https://unpkg.com/rectpackr-layout"></script>
```

## Put the element on the page

Importing the module registers `<rectpackr-layout>` with the custom element
registry, and so does the script tag above. There is nothing to construct and
nothing to configure:

```javascript
import 'rectpackr-layout';
```

After that the element is plain markup:

```html
<rectpackr-layout>
  <div class="card"></div>
  <div class="card"></div>
  <div class="card"></div>
</rectpackr-layout>
```

The import must run in the browser. It defines a class that extends
`HTMLElement`, so evaluating it where there is no DOM throws
`ReferenceError: HTMLElement is not defined` — which is what a server-side
render does unless the import is deferred to the client.

## Give it a width, and give the children a size

Inside its own shadow root the component styles the `<slot>`, set to
`display: block; width: 100%`, and the children it positions. It defines no
rule for the host, so how wide the element is and whether it is a block at all
come from your stylesheet:

```css
rectpackr-layout {
  display: block;
  width: 100%;
}

.card {
  width: 180px;
  height: 120px;
}
```

That width is the strip the packing runs against; it is read from the slot's
computed width when the element connects, and again whenever the element
changes size. The children need a measurable width and height, from any
source — explicit pixels, a percentage, an aspect ratio, or their own content.
A child measuring zero in either dimension is skipped rather than packed.

## What it writes to your children

Each child is measured, given a position by the packing, and moved there. Eight
children of the sizes below, in a 600px-wide element, come out like this:

```text
180 x 120   translate(0, 0)
180 x 240   translate(180px, 0)
120 x 120   translate(360px, 0)
240 x 160   translate(360px, 120px)
120 x 200   translate(0, 120px)
180 x 100   translate(120px, 240px)
240 x 120   translate(300px, 280px)
120 x 160   translate(0, 320px)
```

Two things happened to each of them. The shadow stylesheet made them
`position: absolute !important` and anchored them to one corner, and the
component wrote an inline `transform` moving them from that corner to their
place. The element's own height — 480px here — is set to the height the
packing needed, so the page below it flows normally.

The fourth child is worth following. It is the first one that does not fit on
the opening row, and rather than starting a new one it drops onto the ledge
the third child left at `y = 120`. Filling low ground before growing taller is
the whole heuristic.

## Choose which property carries the position

By default the position is written to `transform`, and each child's `inset` is
left to the shadow stylesheet. Set `positioning="offset"` and the position
moves to `inset`, leaving `transform` free:

```html
<rectpackr-layout positioning="offset">
  <!-- children -->
</rectpackr-layout>
```

The same eight children are then placed by `inset` instead:

```text
180 x 120   0 auto auto 0
180 x 240   0 auto auto 180px
120 x 120   0 auto auto 360px
240 x 160   120px auto auto 360px
```

If your own rules need `transform` — cards that scale on hover, for instance —
choose `offset`. Neither mode leaves you `inset`. Under the default the shadow
stylesheet fixes it with `!important`, which no rule outside the shadow root
overrides, and under `offset` the component overwrites it on every re-pack.

## Pack from another corner

`x-direction` and `y-direction` move the origin. With `x-direction="rtl"` the
packing starts at the right edge, and with `y-direction="btt"` it grows
upwards from the bottom:

```html
<rectpackr-layout x-direction="rtl" y-direction="btt">
  <!-- children -->
</rectpackr-layout>
```

Only the anchor and the sign change; the packing itself is the same. The eight
children above, packed right-to-left and bottom-to-top, get the identical
coordinates negated — `translate(0, 0)`, `translate(-180px, 0)`,
`translate(-360px, 0)`, `translate(-360px, -120px)` and so on — against an
`inset: auto 0 0 auto` anchor, and the element is still 480px tall.

Anything that is not one of the listed values is treated as the default, so
`positioning="OFFSET"` silently keeps `transform`. Check the spelling and the
case if an attribute appears to do nothing.

## Let late content settle

Content that changes size after it is laid out is the normal case, not the
exception, and the component is built for it. Each child is watched by a
`ResizeObserver`, so a card that grows when its text loads is re-packed on the
next animation frame.

Images get a second mechanism, because an image that has not loaded reports no
useful height at all. Every `<img>` inside the element that is not yet
`complete` gets a one-time `load` listener, and when it fires the component
re-measures every child rather than just that one. You do not have to declare
image dimensions in advance, though doing so still spares the layout one pass.

## Add and remove children normally

The element watches its own child list, so ordinary DOM work is all that is
needed:

```javascript
const layout = document.querySelector('rectpackr-layout');
const card = document.createElement('div');
card.className = 'card';

layout.append(card); // re-packs on the next frame
layout.firstElementChild.remove(); // re-packs on the next frame
```

A child that is taken out has the `transform` (or `inset`) the component
wrote to it cleared, so it can be placed elsewhere on the page as it is.

## Test it in jsdom

The component depends on three things a browser provides and jsdom does not:
`ResizeObserver`, layout, and a computed width for the slot. Without
`ResizeObserver`, `connectedCallback` fails on constructing the first
`ResizeObserver`, with a `ReferenceError`. With it mocked but no width for the
slot, the strip width parses as `NaN` and `connectedCallback` fails later:

```text
TypeError: Strip width (NaN) should be numerical value.
```

The failure does not reach your test as an exception — custom element callbacks
report rather than propagate — so it arrives on the console while the element
sits connected and unpositioned.

Mock `ResizeObserver`, mock `getComputedStyle` so that the slot reports a
width, and run `requestAnimationFrame` synchronously so the re-pack happens
within the test. The repository's own `tests/mocks/` folder and
`tests/util/setupTest.ts`, which holds the `getComputedStyle` mock, do exactly
that and are the shortest working reference.

## What this page did not cover

[faq.md](faq.md) covers the behaviour that surprises people — the child that
overflows, the one that lands under another, the reading order — and what to
do in a framework that owns the children.
[architecture-and-api.md](architecture-and-api.md) describes the observer
graph, the batching, and what a re-pack costs.
