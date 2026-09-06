// Takes every route a consumer has into dist/: the "exports" map through the
// package name, the "main"/"module" files by path, and dist/umd through both
// branches of its wrapper. A route works only if it hands back the component
// class and, where it executes the file, registers the custom element.
// Gated on dist/ directories, so pruning a format needs no edit here.

const { JSDOM } = require('jsdom');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// @todo: Revisit
// The tag the code registers and the global the UMD wrapper defines.
const tagName = 'rectpackr-layout';
const umdGlobal = 'RectpackrLayout';

// Every route defines the custom element at module scope, so none loads in
// plain Node: no HTMLElement, no customElements.
const createWindow = () =>
  new JSDOM('', { pretendToBeVisual: true, runScripts: 'outside-only' }).window;

// Loaded modules reach for those on globalThis, so the first window is spread
// over it.
function installGlobalDom() {
  const window = createWindow();

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
}

// Swapped per route that executes a file, so its own define() fills the
// registry -- reusing a filled one would pass every route after the first.
// The window is handed back for the UMD script branch, which evals into it.
function freshRealm() {
  const window = createWindow();

  for (const key of ['customElements', 'HTMLElement']) {
    Object.defineProperty(
      globalThis,
      key,
      Object.getOwnPropertyDescriptor(window, key)
    );
  }

  return window;
}

// The exports map hands back a namespace holding the class as .default, the
// UMD wrapper the class itself.
const component = (exported) =>
  typeof exported === 'function' ? exported : exported?.default;

// Every export by name and kind, or the value's own type when it has none, so
// `module.exports = Class` reads as "function" rather than as an empty list
// that would match any other.
function shapeOf(exported) {
  const names = Object.keys(exported ?? {}).sort();

  return names.length === 0
    ? typeof exported
    : names.map((name) => `${name}:${typeof exported[name]}`).join(', ');
}

// `dir` gates the route, `entry` is the file it needs, `fresh` marks the route
// that executes the file rather than reusing a cached module. Routes in a
// `group` promise the same thing, so comparing shapes catches a condition
// resolving somewhere other than the file beside it.
const routes = [
  { dir: 'dist/@types/es', entry: 'index.d.mts' },
  { dir: 'dist/@types/cjs', entry: 'index.d.cts' },
  {
    dir: 'dist/es',
    entry: 'index.mjs',
    via: `import('./dist/es/index.mjs')`,
    group: 'module',
    fresh: true,
    load: (path) => import(pathToFileURL(path).href),
  },
  {
    dir: 'dist/es',
    entry: 'index.mjs',
    via: `import('${pkg.name}')`,
    group: 'module',
    load: () => import(pkg.name),
  },
  {
    dir: 'dist/cjs',
    entry: 'index.cjs',
    via: `require('./dist/cjs/index.cjs')`,
    group: 'module',
    fresh: true,
    load: (path) => require(path),
  },
  {
    dir: 'dist/cjs',
    entry: 'index.cjs',
    via: `require('${pkg.name}')`,
    group: 'module',
    load: () => require(pkg.name),
  },
  {
    dir: 'dist/umd',
    entry: 'index.js',
    via: `<script src="./dist/umd/index.js">`,
    group: 'umd',
    fresh: true,
    load: (path, window) => {
      window.eval(readFileSync(path, 'utf8'));
      return window[umdGlobal];
    },
  },
  {
    dir: 'dist/umd',
    entry: 'index.js',
    via: `require('./dist/umd/index.js')`,
    group: 'umd',
    fresh: true,
    load: (path) => require(path),
  },
];

function selectBuiltRoutes() {
  // The directory, not the entry file: a pruned format leaves no directory at
  // all, while one that exists but holds no barrel is a build that went wrong
  // -- reported per route further down, not treated as "not built".
  const built = routes.filter(({ dir }) => existsSync(join(root, dir)));

  if (built.length === 0) {
    console.error(
      `Nothing was built: none of ${[...new Set(routes.map((r) => r.dir))].join(
        ', '
      )}\nexists. Run "npm run build" before this step.`
    );
    process.exitCode = 1;
  }

  return built;
}

async function checkRoutes(built) {
  const problems = [];
  const groups = new Map();
  const report = [];

  for (const { dir, entry, via, group, fresh, load } of built) {
    const path = join(root, dir, entry);

    if (!existsSync(path)) {
      // The build always emits this entry when the format's directory exists
      // (rollup.config.mjs feeds every format the same src/index.ts input),
      // so a missing one means a build that failed partway, not a valid state.
      problems.push(`${dir}/ holds no ${entry} -- nothing to load`);
      continue;
    }

    // Declarations do not exist at runtime, so the file being there is the
    // whole check. check-declared-paths.cjs owns what they say.
    if (!load) {
      report.push(`${dir}/${entry} present`);
      continue;
    }

    const window = fresh ? freshRealm() : null;
    const exported = await load(path, window);
    const shape = shapeOf(exported);

    if (typeof component(exported) !== 'function') {
      problems.push(`${via} hands back ${shape}, not the component class`);
    }

    // Only where this route executed the file: a cached module was registered
    // by whichever route loaded it first, and would pass here saying nothing.
    if (fresh && !customElements.get(tagName)) {
      problems.push(`${via} registered no <${tagName}>`);
    }

    groups.set(group, [...(groups.get(group) ?? []), { via, shape }]);
    report.push(`${via} -> ${shape}`);
  }

  for (const [group, members] of groups) {
    if (new Set(members.map((member) => member.shape)).size > 1) {
      problems.push(
        `${group} routes disagree on what they export:\n` +
          members.map(({ via, shape }) => `    ${via} -> ${shape}`).join('\n')
      );
    }
  }

  return { problems, report };
}

installGlobalDom();

const builtRoutes = selectBuiltRoutes();

checkRoutes(builtRoutes)
  .then(({ problems, report }) => {
    if (problems.length > 0) {
      console.error(
        `Distribution bundles do not load correctly\n\n${problems
          .map((problem, i) => `[${i}] ${problem}`)
          .join('\n')}\n`
      );

      process.exitCode = 1;
      return;
    }

    if (!process.exitCode) {
      console.log(
        `${report.length} load routes ok\n\n${report
          .map((line) => `  ${line}`)
          .join('\n')}\n`
      );
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
