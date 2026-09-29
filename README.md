# Rectpackr Layout

[![NPM Version](https://img.shields.io/npm/v/rectpackr-layout)](https://www.npmjs.com/package/rectpackr-layout)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/styiannis/rectpackr-layout)](https://coveralls.io/github/styiannis/rectpackr-layout?branch=main)

A custom element that lays out its own children by treating them as rectangles
and packing them into a strip as wide as itself. It measures each child, picks
the position that adds the least height, and writes that position back as an
inline style. A change in a child's size, in the set of children or in its own
width packs them again. The children stay in the light DOM and keep their own
CSS.

## Install

```bash
npm install rectpackr-layout
```

`yarn add` and `pnpm add` work the same way. The element runs in the browser,
from Chrome 92, Firefox 92 and Safari 15.4. Installing and bundling it requires
Node 20.19 or later. The package ships an ES build and a CommonJS build with
type definitions for each, and a self-contained UMD bundle for a plain
`<script>` tag. Its one runtime dependency is
[best-fit-strip-pack](https://www.npmjs.com/package/best-fit-strip-pack), which
supplies the placement heuristic. Importing the module registers
`<rectpackr-layout>`. There is no constructor to call and no initialisation
step.

## One element, and the children it is given

The element wraps the content and nothing else. Sizes below are explicit so
the result can be checked; in practice the children size themselves and the
component reads whatever the browser computed.

```html
<script src="https://unpkg.com/rectpackr-layout"></script>

<rectpackr-layout style="display: block; width: 600px">
  <div style="width: 180px; height: 120px"></div>
  <div style="width: 180px; height: 240px"></div>
  <div style="width: 120px; height: 120px"></div>
  <div style="width: 240px; height: 160px"></div>
  <div style="width: 120px; height: 200px"></div>
  <div style="width: 180px; height: 100px"></div>
  <div style="width: 240px; height: 120px"></div>
  <div style="width: 120px; height: 160px"></div>
</rectpackr-layout>
```

Each child ends up absolutely positioned, moved into place by a `transform`
the component writes:

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

The element ends up 480px tall, which the component also sets, so it
occupies exactly the height its packing needs. The fourth child is the
one that shows the heuristic at work: rather than continuing the first row, it
drops onto the ledge the third child left at `y = 120`.

## Three attributes, and what they change

Positions are written to one CSS property per child, chosen by `positioning`,
and measured from one corner, chosen by the two direction attributes.

| Attribute     | Values               | Default     | Effect                              |
| ------------- | -------------------- | ----------- | ----------------------------------- |
| `positioning` | `transform` `offset` | `transform` | Which property carries the position |
| `x-direction` | `ltr` `rtl`          | `ltr`       | Which side packing starts from      |
| `y-direction` | `ttb` `btt`          | `ttb`       | Which edge the packing grows from   |

Any other value falls back to the default, so a misspelled attribute changes
nothing. Changing one at run time re-packs the layout and clears the property
the previous setting was using. Writing the value already set does nothing. The
first three of the same eight children, placed by `inset` under
`positioning="offset"`, and anchored top-right under `x-direction="rtl"`:

```text
            positioning="offset"   x-direction="rtl"
180 x 120   0 auto auto 0          translate(0, 0)
180 x 240   0 auto auto 180px      translate(-180px, 0)
120 x 120   0 auto auto 360px      translate(-360px, 0)
```

Under `transform` the component owns both properties: `transform` inline, and
`inset` fixed to a corner by an `!important` rule in its shadow root. `offset`
writes `inset` and leaves `transform` to your own rules.

## What it watches

Three observers keep the layout current, and every one of them ends in the
same re-pack, batched into a single animation frame:

- A `ResizeObserver` on each child, for content that changes size.
- A `MutationObserver` on the element, for children added or removed. The
  property the component wrote to a removed child is cleared.
- A `ResizeObserver` on the slot in its shadow root, for a change of width.

Images that have not finished loading are watched separately and trigger a
re-measurement when they arrive, which is what keeps a gallery from packing
itself against zero-height placeholders.

## API

The element is the API. The default export is its class, which types a
reference to the element, answers `instanceof`, and is what a second tag name
is built from. A constructor is registered only once; a subclass is a new one.

| Surface                                   | Notes                                                  |
| ----------------------------------------- | ------------------------------------------------------ |
| `<rectpackr-layout>`                      | Registered on import, if the name is still free        |
| `positioning` `x-direction` `y-direction` | The observed attributes, listed above                  |
| `default` export                          | The `HTMLElement` subclass, for typing and subclassing |

There are no methods, no properties and no events. The layout is a function of
the children and the three attributes, and everything else is CSS.

## When not to use it

Every child is positioned by fit, from script, and every change re-packs the
whole set. These are the cases where that is the wrong trade.

| If this describes the problem                  | Reach for                                                                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Columns of equal width, filled in turn         | a column layout in CSS — this is a packing heuristic, and children of unequal width interlock instead of queueing                  |
| The visual order must match the document order | a flow layout — a later child can appear above an earlier one, while tab order and screen readers follow the document              |
| The layout must exist without JavaScript       | a layout in CSS alone — nothing is positioned until the element is connected and a frame has run, and there is no server rendering |
| Your own rules need `inset`                    | a wrapper inside each child to carry it — the component owns `inset` in both modes, and `offset` frees only `transform`            |
| Thousands of children, changing often          | pagination or virtualisation — there is no incremental update, and every change re-packs every child                               |

## Documentation

- [Guides, the FAQ and the architecture write-up](https://github.com/styiannis/rectpackr-layout/tree/main/docs) —
  laying out a first gallery, the behaviour that surprises people, and how the
  component is built and what a re-pack costs.
- [Live examples on CodePen](https://codepen.io/collection/dGpeLa) — a
  gallery of equal widths, one of mixed sizes, and an interactive playground.
- [Open an issue](https://github.com/styiannis/rectpackr-layout/issues)
  for a question or a bug report.

Released under the
[MIT License](https://github.com/styiannis/rectpackr-layout/blob/main/LICENSE).
