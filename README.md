# Rectpackr Layout

[![NPM Version](https://img.shields.io/npm/v/rectpackr-layout)](https://www.npmjs.com/package/rectpackr-layout)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/styiannis/rectpackr-layout)](https://coveralls.io/github/styiannis/rectpackr-layout?branch=main)

A custom element that positions its own children by **packing them as
rectangles** into a strip as wide as itself. It measures each child, places it
as near the top as it fits, and writes the position back as an inline style. A
change in a child's size, in the set of children or in the element's own width
packs them again. The children stay in the light DOM and keep their own CSS.

## Install

```bash
npm install rectpackr-layout
```

`yarn add` and `pnpm add` work the same way. The package declares support for
Node 18.12 or later. It ships an ES build, a CommonJS build and a self-contained
bundle for a plain `<script>` tag. TypeScript reads the type definitions of the
first two from 4.7, the first release that reads `.d.mts` and `.d.cts` files.
Its one runtime dependency is
[best-fit-strip-pack](https://github.com/styiannis/best-fit-strip-pack), which
supplies the placement heuristic.

In the browser, the floor is set by two APIs the code calls: the border-box size
reported by `ResizeObserver`, in the form Firefox ships from 92 and Safari from
15.4, and `Array.prototype.at`, which Chrome ships from 92.

## The children are measured, not configured

Nothing about a child is passed to the element. Each one is measured at the
size the browser lays it out at, so its own CSS decides its width and height:

```html
<script src="https://unpkg.com/rectpackr-layout"></script>

<rectpackr-layout style="display: block">
  <img src="photo.jpg" alt="" />
  <article class="card">…</article>
  <figure class="chart">…</figure>
  <div class="note">…</div>
</rectpackr-layout>
```

Each child is placed as near the top as it fits, filling the strip from its left
edge. The element decides where a child goes, never how large it is, and grows
to the height of what it holds.

The element has no styles of its own, so it is `inline` until it is given a
`display`. As a block it is as wide as its container, and that width is the
strip.

## Three attributes, and what they change

Each child's position is written to its inline style, as a `transform` or as an
`inset`, and measured from one corner of the element. `positioning` picks the
property, and the two direction attributes pick the corner.

| Attribute     | Values               | Default     | Effect                              |
| ------------- | -------------------- | ----------- | ----------------------------------- |
| `positioning` | `transform` `offset` | `transform` | Which property carries the position |
| `x-direction` | `ltr` `rtl`          | `ltr`       | Which side packing starts from      |
| `y-direction` | `ttb` `btt`          | `ttb`       | Which edge the packing grows from   |

A value not listed falls back to the default, so a misspelled attribute changes
nothing. Changing an attribute at run time re-packs the layout.

The children below are given fixed sizes inline only so that the values written
to them can be shown:

```html
<script src="https://unpkg.com/rectpackr-layout"></script>

<rectpackr-layout style="display: block; width: 600px">
  <div style="width: 360px; height: 120px"></div>
  <div style="width: 240px; height: 120px"></div>
  <div style="width: 360px; height: 120px"></div>
</rectpackr-layout>
```

The first two fill the top row and the third goes below the first. The first one
sits in the starting corner whatever the attributes. With the attributes in the
first column added to the element, the other two are given:

| Attributes                               | Second child                      | Third child                       |
| ---------------------------------------- | --------------------------------- | --------------------------------- |
| none                                     | `transform: translate(360px, 0)`  | `transform: translate(0, 120px)`  |
| `x-direction="rtl"`                      | `transform: translate(-360px, 0)` | `transform: translate(0, 120px)`  |
| `y-direction="btt"`                      | `transform: translate(360px, 0)`  | `transform: translate(0, -120px)` |
| `positioning="offset"`                   | `inset: 0 auto auto 360px`        | `inset: 120px auto auto 0`        |
| `positioning="offset" x-direction="rtl"` | `inset: 0 360px auto auto`        | `inset: 120px 0 auto auto`        |
| `positioning="offset" y-direction="btt"` | `inset: auto auto 0 360px`        | `inset: auto auto 120px 0`        |

Under `transform`, every child is pinned to the starting corner and translated
away from it, so the values turn negative when that corner is on the right or
at the bottom. Under `offset`, the same distances are measured in `inset` from
the two sides that meet at that corner.

Every child is given `position: absolute`, which its own rules cannot override,
even with `!important`. Under `transform` the element pins `inset` the same way,
so it owns both properties. Under `offset` it writes `inset` and leaves
`transform` alone, which makes it the setting for children that carry a
`transform` of their own, such as a hover effect.

## What makes it pack again

The element packs its children again, without being asked, when any of these
changes:

- the size of a child, as when an image finishes loading;
- the set of children, as children are added or removed;
- the element's own width.

Children added or removed within one animation frame lead to a single re-pack.
Adding, removing or resizing a child is ordinary DOM work:

```javascript
import 'rectpackr-layout';

const layout = document.createElement('rectpackr-layout');
layout.style.display = 'block';

for (const text of ['First', 'Second', 'Third']) {
  const card = document.createElement('div');
  card.textContent = text;
  layout.append(card);
}

document.body.append(layout); // packed once connected
layout.firstElementChild.remove(); // the other two are packed again
layout.lastElementChild.textContent += ' card'; // packed again for its new size
```

## Importing

Importing the module registers `<rectpackr-layout>`. There is no constructor to
call and no initialisation step:

```javascript
import 'rectpackr-layout';
```

Without a bundler, the `<script>` tag used in the examples above does the same.

The default export is the element's class, for a type annotation, an
`instanceof` test or a subclass. Registering the element under a second tag
name takes a subclass, since a class can be registered only once:

```javascript
import RectpackrLayout from 'rectpackr-layout';

customElements.define('photo-wall', class extends RectpackrLayout {});

console.log(document.createElement('photo-wall') instanceof RectpackrLayout); // true
```

From CommonJS the class is `require('rectpackr-layout').default`, and the
`<script>` bundle exposes it as the global `RectpackrLayout`.

## API

The element is the API: one tag, three attributes, and the class behind them.

| Surface                                   | Notes                                           |
| ----------------------------------------- | ----------------------------------------------- |
| `<rectpackr-layout>`                      | Registered on import, if the name is still free |
| `positioning` `x-direction` `y-direction` | Listed above, with their values and defaults    |
| `default` export                          | The element's class, an `HTMLElement` subclass  |

There are no properties, no methods and no events to use. The layout depends on
the children's sizes and order, the element's width, the three attributes,
and on nothing else.

In TypeScript, the type definitions map the tag name to the class, so
`document.querySelector('rectpackr-layout')` is typed as
`RectpackrLayout | null`. The package also declares a custom-elements manifest,
which lists the element, its slot and its three attributes with their values and
defaults, for editors that read one.

## When not to use it

Every child is positioned from script, by a heuristic, and every change
re-packs the whole set. These are the cases where that costs more than it
buys.

| If this describes the problem                                     | Reach for                                                                                                                                                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Columns of equal width, filled with children of different heights | CSS `display: grid-lanes`, with plain grid as the fallback where it is not supported yet — it places each child in the shortest column without a script. This element is for widths that fit no column grid |
| Every child the same size                                         | CSS grid — equal children are packed into plain rows, which grid lays out without a script                                                                                                                  |
| Content read down one column, then the next                       | CSS `columns` — each child is placed as near the top as it fits, so consecutive children run across the columns rather than down one                                                                        |
| The visual order must match the document order                    | CSS grid or flexbox, which keep the document order — here a later child can appear above an earlier one, while tab order and screen readers follow the document                                             |
| The layout must exist without JavaScript                          | CSS grid, `columns` or `grid-lanes` — nothing is positioned until the script has run, and there is no server rendering                                                                                      |
| Your own rules need `position` or `inset`                         | a wrapper inside each child to carry them — every child is made `position: absolute`, and the element owns `inset` in both modes                                                                            |
| Thousands of children, changing often                             | pagination or virtualisation — every change re-packs every child                                                                                                                                            |

## Documentation

- [Live examples on CodePen](https://codepen.io/collection/dGpeLa) — a gallery
  of equal widths, one of mixed sizes, and an interactive playground.
- [Open an issue](https://github.com/styiannis/rectpackr-layout/issues) for a
  question or a bug report.

Released under the
[MIT License](https://github.com/styiannis/rectpackr-layout/blob/main/LICENSE).
