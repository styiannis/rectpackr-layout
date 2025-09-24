# Rectpackr Layout

A web component that creates layouts by treating your HTML elements as rectangles and packing them using a best-fit 2D strip-packing algorithm.

## Why a Packing Algorithm for Web Layouts?

Web browsers naturally manage elements as rectangles. `rectpackr-layout` leverages this by applying a best-fit strip-packing algorithm — the same approach used in industrial optimization problems — to web layout creation.

## Intelligent Layouts Through Automated Measurement

The algorithm intelligently works with whatever dimensional information is available:

### How It Works:

- **Automatically measures** element dimensions through browser APIs
- **Uses width as the primary constraint** for predictable flow
- **Adapts to any height** — whether fixed, aspect-ratio based, or content-determined
- **Handles mixed content seamlessly** without manual configuration

### You Can:

- Set explicit widths for pixel-perfect control
- Use percentage-based or responsive widths
- Let elements determine their own natural sizes
- Mix and match approaches within the same layout

### What This Enables:

- **Truly flexible layouts** that work with your existing CSS approach
- **Zero-configuration setups** for rapid prototyping
- **Production-ready precision** when you need exact control
- **Best of both worlds** — automation when you want it, control when you need it

## Installation

### Install the package via your preferred package manager:

#### npm

```bash
npm install rectpackr-layout
```

#### yarn

```bash
yarn add rectpackr-layout
```

#### pnpm

```bash
pnpm install rectpackr-layout
```

Then import it in your JavaScript:

```javascript
// In your main.js or component file
import 'rectpackr-layout';
```

Or directly in your HTML:

```html
<script type="module">
  import 'rectpackr-layout';
</script>
```

## API Reference

### Attributes

**`positioning`**

Defines the CSS method used to position items.

- `transform` (_Default_): Uses `transform: translate(x, y)`
- `offset`: Uses CSS offset properties (`top`/`bottom` and `left`/`right`)

> **Performance Note:** The default `transform` value typically offers better performance through hardware acceleration. Use `offset` only when child elements already use `transform` for other purposes (animation etc.).

**`x-direction`**

Controls the horizontal packing direction.

- `ltr` (_Default_): Left-to-right packing
- `rtl`: Right-to-left packing

**`y-direction`**

Controls the vertical packing direction.

- `ttb` (_Default_): Top-to-bottom packing
- `btt`: Bottom-to-top packing

### A Note on Visual Order & Accessibility

The `x-direction` and `y-direction` attributes control visual placement, which may differ from DOM order.

- **DOM Order is Preserved:** The library never changes the underlying HTML structure, ensuring correct tab order and screen reader navigation
- **Visual Order is Optimized:** The algorithm places items for spatial efficiency, which may not match linear DOM order

**Best Practice:** Ensure your HTML source reflects the logical reading order.

## Browser Support

Modern browsers with Web Components support.

## Issues and Support

If you encounter any issues or have questions, please [open an issue](https://github.com/styiannis/rectpackr-layout/issues).

## License

This project is licensed under the [MIT License](https://github.com/styiannis/rectpackr-layout?tab=MIT-1-ov-file#readme).
