// Loads the three files a consumer reaches directly (main, module, and the
// bundle behind unpkg/jsdelivr), each in every way its format supports. A file
// that throws when loaded is a broken build; an empty result usually means a
// forgotten src/index.ts -- except the <script> route, whose eval() completion
// value isn't the module's exports. Gated on the file existing, so pruning a
// format needs no edit here.

const { JSDOM } = require('jsdom');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = join(__dirname, '..');

const routeEntries = [
  {
    path: 'dist/cjs/index.cjs',
    via: `require('./dist/cjs/index.cjs')`,
    loader: (path) => require(path),
    checkExports: true,
  },
  {
    path: 'dist/cjs/index.cjs',
    via: `import('./dist/cjs/index.cjs')`,
    loader: (path) => import(pathToFileURL(path).href),
    checkExports: true,
  },
  {
    path: 'dist/es/index.mjs',
    via: `import('./dist/es/index.mjs')`,
    loader: (path) => import(pathToFileURL(path).href),
    checkExports: true,
  },
  {
    path: 'dist/umd/index.js',
    via: `require('./dist/umd/index.js')`,
    loader: (path) => require(path),
    checkExports: true,
  },
  {
    path: 'dist/umd/index.js',
    via: `<script src="./dist/umd/index.js">`,
    loader: (path, window) => window.eval(readFileSync(path, 'utf8')),
    // eval's completion value isn't the module's exports -- the UMD wrapper
    // only assigns a global, so there is nothing meaningful to check here.
    checkExports: false,
  },
];

function exportsNothing(namespace) {
  // Empty usually means a forgotten src/index.ts, but exporting only subpaths is
  // valid. Nullish counts as empty (a factory returning nothing); a function
  // does not: `module.exports = fn` has no keys but works.
  return (
    !namespace ||
    (typeof namespace !== 'function' && Object.keys(namespace).length === 0)
  );
}

function installGlobalDom() {
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
}

function selectBuiltRoutes(routes) {
  const present = routes.filter(({ path }) => existsSync(join(root, path)));

  if (present.length === 0) {
    const paths = [...new Set(routes.map(({ path }) => path))].join(', ');

    console.error(
      `Nothing was built: none of ${paths} exists.\nRun "npm run build" before this step.`
    );

    process.exitCode = 1;
  }

  return present;
}

async function loadRoutes(routes) {
  const problems = [];
  const warnings = [];
  const report = [];

  for (const { path, via, loader, checkExports } of routes) {
    const file = join(root, path);

    let namespace;

    try {
      namespace = await loader(file, globalThis.window);
    } catch (error) {
      problems.push(`${via} threw: ${error?.message ?? error}`);
      continue;
    }

    report.push(`${via} loads`);

    if (checkExports && exportsNothing(namespace)) {
      warnings.push(`${via} exports nothing -- check src/index.ts`);
    }
  }

  return { problems, warnings, report };
}

installGlobalDom();

const builtRoutes = selectBuiltRoutes(routeEntries);

loadRoutes(builtRoutes)
  .then(({ problems, warnings, report }) => {
    if (problems.length > 0) {
      console.error(
        `Distribution bundles do not load correctly\n\n${problems
          .map((line, i) => `[${i + 1}] ${line}`)
          .join('\n')}\n`
      );
      process.exitCode = 1;
      return;
    }

    if (warnings.length > 0) {
      console.warn(
        `Warnings\n${warnings
          .map((line, i) => `[${i + 1}] ${line}`)
          .join('\n')}\n`
      );
    }

    if (!process.exitCode) {
      console.log(
        `${report.length} load routes ok\n${report
          .map((line, i) => `[${i + 1}] ${line}`)
          .join('\n')}\n`
      );
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
