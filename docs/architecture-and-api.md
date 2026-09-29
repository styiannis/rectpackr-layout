# Architecture and API

**Last verified:** 2026-09-29 · v1.0.1

## The public surface is one element

Everything the package exposes:

| Export               | Kind                                 |
| -------------------- | ------------------------------------ |
| `<rectpackr-layout>` | custom element, registered on import |
| `default`            | its class, extending `HTMLElement`   |

The class carries no public members of its own beyond the three lifecycle
callbacks and `observedAttributes`. There are no methods, no properties and no
events. Beside the root, the `exports` map declares only `./package.json`, so
that tooling can read the package manifest, which is where the custom-elements
manifest is named. Configuration is three attributes — `positioning`,
`x-direction`, `y-direction` — and everything else is the children and the CSS
around them.

`src/index.ts` registers the element only if the name is free
(`customElements.get('rectpackr-layout')`). The module cache already makes a
second import a no-op. The check is for a second copy of the package on the
same page, which would otherwise throw on the duplicate name. Registration is a
side effect of the import, which is why the package declares
`"sideEffects": true` rather than the `false` a pure library would use: a
bundler told that the module has no effects is entitled to drop an import
whose value is never read, and dropping this one removes the registration
with it.

## Two layers, and why the lower one is written the way it is

`src/` divides into a custom element and a `core/` of plain functions.

`core/` is written as small independent functions over plain objects, each one
short enough that what happens inside it can be read off the page, **and so can
the resources it requires**. `updateStripPack` is one loop, and its allocations
are one array, one scratch position and, per child, a record holding a
two-number tuple; `startObservingImages` adds at most one listener per
incomplete image and records it in a map that `stopObservingImages` drains.
Nothing in the layer allocates in a place the reader cannot see.

```
src/
├── index.ts              defines the element, once
├── RectpackrLayout.ts    attributes, shadow root, lifecycle
└── core/
    ├── rectpackr.ts      create and clear an instance
    ├── util.ts           the observers, the packing pass, the style writing
    ├── types.ts          IRectpackr, IRectpackrConfig
    └── index.ts
```

`RectpackrLayout.ts` contains no layout logic. It parses three attributes into
a config object, builds the shadow root, generates the stylesheet that config
implies, and calls `create` and `clear`. What it adds over `core/` is a
private field the page cannot reach into and the lifecycle wiring the platform
requires.

## What one instance holds

```typescript
export interface IRectpackr {
  config: IRectpackrConfig;
  container: HTMLElement;
  children: Map<IRectpackrChildElement, { height: number; width: number }>;
  childrenContainer: HTMLElement;
  isPending: { render: boolean; restartObservingChildren: boolean };
  loadingImages: Map<HTMLImageElement, (this: HTMLImageElement) => void>;
  observers: {
    childrenContainerMutation: MutationObserver;
    childrenResize: ResizeObserver;
    containerResize: ResizeObserver;
  };
  stripPack: BestFitStripPack;
}
```

Two element references, and the distinction between them matters.
`container` is the `<slot>` inside the shadow root: it is what the packing is
measured against and what receives the resulting height. `childrenContainer`
is the host element itself, whose light-DOM children are the rectangles. The
component therefore never moves anything into its shadow root; it reads from
the host and writes to the host, and the shadow root exists only to carry the
stylesheet and the slot.

`children` is the measured set, and it is the only record of geometry the
component keeps: a map from each child element to its size, iterated in
insertion order. Every restart rebuilds it from scratch — membership and order
are re-read from the DOM, and every size starts at zero — and each resize
callback then updates sizes in place for the children it names, one lookup per
entry. Nothing is retained across a restart. The one change to membership made
outside a restart is a removal: the mutation callback deletes a removed child
ahead of the restart it schedules.

## The observation graph

Three observers, created in `create` and disconnected in `clear`, each
answering one way the layout can go stale:

| Observer                    | Watches                           | Delivers                                                                               |
| --------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| `childrenResize`            | every element child, `border-box` | new measurements, then a pack                                                          |
| `childrenContainerMutation` | the host, `childList`             | removed children cleared, then a restart of the child observer and the image listeners |
| `containerResize`           | the slot, `content-box`           | a new strip width, then a pack                                                         |

The mutation callback reads the records it is handed before restarting
anything. Every element in their `removedNodes` that the component still holds
has the property it wrote — `transform` or `inset` — cleared and is deleted
from `children` at once, so a child moved elsewhere in the page leaves without
its last position, and a pack already requested for the current frame cannot
write it back. A node listed as removed but back in the host by the time the
callback runs was moved, not removed — a keyed list reordering its nodes — and
keeps its old position until the pack that follows the restart replaces it;
clearing it would put it at the origin for the frames in between.

A fourth path is not an observer. `startObservingImages` walks
`querySelectorAll('img')` — deep, so images nested inside children count — and
attaches a one-time `load` listener to every image that is not yet `complete`.
When one fires, the child observer is restarted rather than a single child
re-measured, because an image finishing is exactly the moment several children
may have changed at once.

The restart is the mechanism that keeps `children`'s membership and order in
sync with the DOM. `startObservingChildren` rebuilds the map from
`childrenContainer.children` on every restart, starting every child at zero
regardless of what was known before. Re-observing an element also makes the
platform deliver an initial entry for it, so the restart's own callback still
supplies fresh measurements for every child right after the rebuild.

**Implementation note.** `onChildResize` does not rebuild `children`; it
looks up each delivered entry's target by element and updates that child's
size in place, leaving children absent from the entry set untouched. That is
what a single child resizing spontaneously, outside a restart, requires: the
platform delivers that child's entry alone, and the sizes measured for the
others stand.

## One frame, one pack

Both of the operations that can be triggered many times in a burst are
deferred to `requestAnimationFrame` behind a boolean:

```typescript
function render(instance: IRectpackr) {
  if (instance.isPending.render) {
    return;
  }
  instance.isPending.render = true;
  requestAnimationFrame(() => {
    instance.isPending.render = false;
    updateStyle(instance, updateStripPack(instance));
  });
}
```

Twenty children appended in a loop produce one mutation burst, one restart and
one pack. `restartObservingChildren` uses the same guard, and stops observing
immediately while scheduling the restart, so the intervening callbacks cannot
arrive at all.

## Where the packing happens

`updateStripPack` is the whole placement pass: one loop over `children`, one
`insert` each, in the order `children` was filled — which is the order the
last restart read the children in, and therefore document order.

```typescript
const w = Math.min(width, instance.stripPack.stripWidth);
const position =
  w === 0 || h === 0 ? hiddenPosition : instance.stripPack.insert(w, h);
```

Two guards do all the defensive work. A child wider than the strip is clamped
to the strip width, so it is placed rather than rejected — the packing library
throws on a width that exceeds the strip — and it then overflows to the right
by whatever the clamp removed. A child measuring zero in either dimension is
not inserted at all; it is given `hiddenPosition`, which trails the previous
placement's right-hand edge, and adds nothing to the packed height.

The heuristic itself belongs to `best-fit-strip-pack`: a skyline of the
filled profile, and a position chosen to raise the top of it least. The web
component contributes the measurement, the ordering and the styles; it makes
no placement decisions of its own.

## From a position to a style

`updateStyle` writes one property per child and one height to the slot. Which
property, and what the numbers are measured from, is the config:

| `positioning` | Child gets                   | Anchor, from the shadow stylesheet |
| ------------- | ---------------------------- | ---------------------------------- |
| `transform`   | `transform: translate(x, y)` | `inset` fixed to one corner        |
| `offset`      | `inset: …`                   | `position: absolute` only          |

Under `transform` the anchor corner is baked into the `::slotted` rule and the
coordinates are negated for `rtl` and for `btt`, so every child translates
away from the same origin. Under `offset` there is no anchor: each child's
`inset` names the two edges it is measured from directly, and the coordinates
stay positive.

The split decides whether the caller keeps `transform`. Under `transform` the
component writes it on every pack, and the anchor is `!important`, which no
rule outside the shadow root overrides, so the caller keeps neither property.
Under `offset` the caller keeps `transform`, which is what a page that scales a
card on hover needs.

## Lifecycle

`connectedCallback` renders. On the first connection it attaches the shadow
root and builds the `<style>` and `<slot>`; on a later one it reuses the
existing shadow root and only rewrites the stylesheet. Either way it creates a
fresh instance and starts observing.

`disconnectedCallback` clears: observers disconnected, image listeners
removed, the inline property the component wrote cleared on every child it
still holds, the slot's height cleared, the measured set emptied and the
packing reset.

`attributeChangedCallback` does both, in that order, behind three guards. The
shadow root must exist, so that attributes present in the markup do not render
the element ahead of its first `connectedCallback`. The element must be
connected, so that a change made while it is detached waits for
`connectedCallback`, which reads the attributes as they are by then. The old
and new values must differ, so that writing an attribute the value it already
has changes nothing. Clearing before rendering is what makes a switch between
`positioning` values safe: the old instance still carries the old config, so it
clears the property it actually wrote.

The comparison is of the attribute's text, not of the config it parses to.
Removing `positioning="transform"` still rebuilds the instance, although the
default it falls back to is the same.

## Complexity

`n` is the number of element children; `m` is the number of segments in the
packing's skyline, which follows the shape of the filled profile rather than
`n`.

| Operation                          | Cost                                |
| ---------------------------------- | ----------------------------------- |
| Connect                            | `O(n)` observe calls                |
| One pack                           | `O(n · m)`, `O(n · m²)` worst case  |
| Writing the styles                 | `O(n)`                              |
| A child added or removed           | one restart, then one pack          |
| Container resize, width unchanged  | `O(1)` — compared and returned      |
| Container resize, width changed    | a new packing, then one pack        |
| Attribute written, value unchanged | `O(1)` — compared and returned      |
| Attribute change                   | `O(n)` teardown, then a full render |
| Disconnect                         | `O(n)`                              |

Nothing is incremental. Every path above ends in the same full pass over every
child, which is the cost of a placement rule that has no way to insert one
rectangle into a packing it did not build.

The measured cost of that pass splits in two. The placement is one `insert`
per child and touches no DOM. The whole pass, run through the element under
jsdom with the observers mocked, adds the measurement bookkeeping and the
inline style writes, and still excludes browser layout and paint. The children
are 60 to 240 pixels in each dimension, in a strip 1,200 wide. Each figure is
the median of three processes, and a range is the spread over six runs:

| Children | Placement    | Whole pass under jsdom 28.1 |
| -------- | ------------ | --------------------------- |
| 100      | 0.2 ms       | 0.7 ms                      |
| 500      | 0.4 – 0.5 ms | 2.2 – 3.0 ms                |
| 1,000    | 0.7 – 0.8 ms | 3.4 – 4.4 ms                |
| 5,000    | 1.7 ms       | 55 – 57 ms                  |

The placement grows no faster than the child count, which is what a small `m`
looks like: the skyline describes the profile of the filled area rather than
the children in it. Most of the second column is jsdom's implementation
of inline styles, and it moves with the jsdom version — jsdom 26.1 runs the
same 5,000-child pass in about 12 ms. Neither column predicts a browser, where
the style writes are followed by layout and paint that nothing here measures.

## Extending

There is nothing to configure and nothing to inject. The core layer is not
published, `#obj` is a private field, and the element takes no options object.

What is available is the ordinary custom-element route. The default export can
be subclassed and the subclass registered under another name, which is also
the only way to get a second tag name — a constructor may be registered once:

```javascript
import RectpackrLayout from 'rectpackr-layout';

customElements.define('photo-wall', class extends RectpackrLayout {});
```

A subclass inherits the shadow root, the observers and the attributes, and can
add its own attributes and callbacks around them. What it cannot do is change
the placement rule, which lives in the dependency.

## Tooling

TypeScript 5.9 in `strict` mode with `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess`, emitting `ES2022` against the `ES2022`, `DOM` and
`DOM.Iterable` libraries. Rollup produces five outputs: the ES and CommonJS
builds with `preserveModules`, so each mirrors `src/` file for file with the
dependency left external; a declaration tree for each of them through
`rollup-plugin-dts`; and one minified UMD bundle with the dependency compiled
in. The format is carried by the extension — `.mjs` and `.d.mts` against
`.cjs` and `.d.cts` — rather than inferred from a `type` field. The build then
runs the custom-elements analyser over the ES output, which turns the JSDoc on
the class into `dist/custom-elements.json`. Two scripts check what came out of
all that. `check-declared-paths` verifies that every path `package.json`
declares exists and carries the extension its condition implies.
`check-dist-loads` loads each built format the way a consumer would: the
CommonJS entry through `require` and through `import`, the ES entry through
`import`, and the UMD bundle both through `require` and from a script tag.
Jest runs 20 tests in four suites under jsdom, against mocks for
`ResizeObserver`, `MutationObserver`, `requestAnimationFrame` and the element
dimensions the environment does not compute.
