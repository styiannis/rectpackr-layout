const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const pkg = require('../package.json');

const root = join(__dirname, '..');
const tagName = 'rectpackr-layout';
const umdGlobal = 'RectpackrLayout';

// The conditions of the "." subpath, each pairing a runtime file with the
// declarations describing it: the manifest's own account of what resolves.
const subpath = pkg.exports?.['.'] ?? {};

// What the consumer is left holding: the exports map promises the class as
// .default, while the UMD wrapper hands back the class itself.
const asDefault = (namespace) => namespace.default;
const asItself = (namespace) => namespace;

/**
 * Every way this package can be loaded, reached the way a consumer reaches it.
 * The two exports-map conditions go through a bare specifier -- Node resolves
 * a package by its own name -- so a broken "exports" fails here instead of
 * downstream. The UMD file is loaded through both branches of its wrapper.
 *
 * Entries in the same group promise the same exports, so their shapes are
 * compared against each other. `file` is the artifact an entry needs and
 * `declarations` the types describing it, both named by the manifest so this
 * script keeps no second opinion about where a build puts things.
 */
const ENTRIES = {
  require: {
    group: 'module',
    what: `require('${pkg.name}')`,
    file: subpath.require?.default,
    declarations: subpath.require?.types,
    load: () => require(pkg.name),
    pick: asDefault,
  },
  import: {
    group: 'module',
    what: `import('${pkg.name}')`,
    file: subpath.import?.default,
    declarations: subpath.import?.types,
    load: () => import(pkg.name),
    pick: asDefault,
  },
  'umd-require': {
    group: 'umd',
    what: `require('${pkg.unpkg}')`,
    file: pkg.unpkg,
    load: () => require(join(root, pkg.unpkg)),
    pick: asItself,
  },
  'umd-script': {
    group: 'umd',
    what: `<script src="${pkg.unpkg}">`,
    file: pkg.unpkg,
    load: (window) => {
      window.eval(readFileSync(join(root, pkg.unpkg), 'utf8'));

      return window[umdGlobal];
    },
    pick: asItself,
  },
};

/**
 * The package registers a custom element on load, so plain Node cannot run it:
 * there is no HTMLElement, no customElements. A DOM is installed globally
 * first, the way a browser would already have one. The window is returned as
 * well, for the entry that loads a script into it instead of importing.
 */
function installDom() {
  const { window } = new JSDOM('', {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });

  for (const key of Object.getOwnPropertyNames(window)) {
    if (!(key in globalThis)) {
      Object.defineProperty(
        globalThis,
        key,
        Object.getOwnPropertyDescriptor(window, key)
      );
    }
  }

  globalThis.window = window;

  return window;
}

async function loadEntry(key) {
  const { what, load, pick } = ENTRIES[key];

  const window = installDom();
  const namespace = await load(window);

  if (!customElements.get(tagName)) {
    throw new Error(`${what} did not register <${tagName}>`);
  }

  if (typeof pick(namespace) !== 'function') {
    throw new Error(`${what} exposes no component class`);
  }

  return namespace;
}

/**
 * What a consumer actually sees: every export, by name and kind. Comparing
 * this string catches a shape drift -- a default collapsed into
 * module.exports, an export only one build emits -- without this script
 * needing to know in advance what the exports are. Something with no named
 * exports at all reports its own type, so "module.exports = Class" reads as
 * "function" rather than as an empty, accidentally-matching list.
 */
function shapeOf(namespace) {
  const names = Object.keys(namespace).sort();

  return names.length === 0
    ? typeof namespace
    : names.map((name) => `${name}:${typeof namespace[name]}`).join(', ');
}

/**
 * Declarations are resolved and read rather than loaded, so their check is the
 * type-level counterpart of the runtime one: the entry hands the consumer a
 * default export, and the declarations describing it have to say the same.
 * Both spellings the compiler emits count.
 *
 * @param {string} path Path to a declaration file, relative to the package root.
 * @returns {boolean} Whether it declares a default export.
 */
function declaresDefault(path) {
  const source = readFileSync(join(root, path), 'utf8');

  return /export\s+default\b|\bas\s+default\s*[,}]/.test(source);
}

/**
 * The declarations are built by their own BUILD_FORMATS entries, so they can
 * be absent while the code they describe is present. Absent is reported;
 * present but silent about the default export is a mismatch and fails.
 *
 * @param {{ what: string, declarations?: string, pick: Function }} entry
 * @returns {string} A note to append to the entry's line in the report.
 */
function checkDeclarations({ what, declarations, pick }) {
  if (!declarations) {
    return '';
  }

  if (!existsSync(join(root, declarations))) {
    return ' (no declarations built)';
  }

  if (pick === asDefault && !declaresDefault(declarations)) {
    throw new Error(
      `${declarations} does not declare the default export that ${what} hands out`
    );
  }

  return ` (typed by ${declarations})`;
}

async function main() {
  const [entry] = process.argv.slice(2);

  if (entry) {
    console.log(shapeOf(await loadEntry(entry)));
    return;
  }

  const report = [];
  const shapes = {};

  for (const [key, spec] of Object.entries(ENTRIES)) {
    // Each format is built on its own (BUILD_FORMATS), so a missing artifact
    // means "not built here", not "broken", and the entry steps aside saying
    // so. Whether the manifest may promise it anyway is check-declared-paths'
    // question, and this script does not answer it twice.
    if (!spec.file || !existsSync(join(root, spec.file))) {
      const why = spec.file ? `${spec.file} not built` : 'not declared';

      report.push(`  ${spec.what} -- skipped, ${why}`);
      continue;
    }

    // Every entry registers the same tag, and a registry the first one filled
    // makes the next one's registration look successful without it ever
    // happening -- so each gets its own process, and an empty registry to fill.
    try {
      shapes[key] = execFileSync(process.execPath, [__filename, key], {
        stdio: ['ignore', 'pipe', 'inherit'],
        encoding: 'utf8',
      }).trim();
    } catch {
      // The child already reported the reason.
      process.exitCode = 1;
      return;
    }

    report.push(`  ${spec.what} -> ${shapes[key]}${checkDeclarations(spec)}`);
  }

  const checked = Object.keys(shapes);

  // Skipping everything would otherwise pass in silence, which is the one
  // result this script must never give.
  if (checked.length === 0) {
    throw new Error(
      `No built entry point to load\n\n${report.join('\n')}\n\nRun "npm run build" first.`
    );
  }

  // The point of publishing a group is that its entries are interchangeable.
  // Any disagreement is a packaging bug, whatever the exports happen to be.
  for (const group of new Set(Object.values(ENTRIES).map((e) => e.group))) {
    const members = checked.filter((key) => ENTRIES[key].group === group);

    if (new Set(members.map((key) => shapes[key])).size > 1) {
      const listed = members
        .map((key) => `  ${ENTRIES[key].what} -> ${shapes[key]}`)
        .join('\n');

      throw new Error(
        `${group} entries disagree on what they export:\n${listed}`
      );
    }
  }

  console.log(`Loaded every built entry point\n\n${report.join('\n')}\n`);
}

main().catch((error) => {
  console.error(`Distribution bundles failed to load\n\n${error.message}\n`);
  process.exitCode = 1;
});
