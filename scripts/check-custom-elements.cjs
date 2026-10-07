// Reads the custom-elements manifest against what the <script> bundle actually
// registers. Every element in it must be defined under its tag name and list
// exactly the attributes its class observes, each with a type, a default and a
// description; every module must have a description. The analyzer merges JSDoc
// `@attr` entries with `observedAttributes` by name, so a misspelled or stale
// `@attr` shows up here as a name the class does not observe.

if (!process.features.require_module) {
  console.warn(
    `check-custom-elements skipped: jsdom needs require(esm), which Node ${process.versions.node} does not enable.`
  );
  process.exit(0);
}

const { JSDOM } = require('jsdom');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function checkAttributes(declaration, observed) {
  const listed = (declaration.attributes ?? []).map(({ name }) => name);

  const observedProblems = observed
    .filter((name) => !listed.includes(name))
    .map((name) => `<${declaration.tagName}> observes "${name}", not listed`);

  const listedProblems = listed
    .filter((name) => !observed.includes(name))
    .map((name) => `<${declaration.tagName}> lists "${name}", not observed`);

  const problems = [...observedProblems, ...listedProblems];

  for (const attribute of declaration.attributes ?? []) {
    for (const key of ['type', 'default', 'description']) {
      if (!attribute[key]) {
        problems.push(
          `<${declaration.tagName}> "${attribute.name}" has no ${key} -- add it to its @attr`
        );
      }
    }
  }

  return problems;
}

function checkElements(manifest, window) {
  return manifest.modules
    .flatMap((mod) => mod.declarations ?? [])
    .filter(({ customElement }) => customElement)
    .flatMap((declaration) => {
      const element = window.customElements.get(declaration.tagName);

      if (!element) {
        return [`<${declaration.tagName}> is not registered by the bundle`];
      }

      return checkAttributes(declaration, [
        ...(element.observedAttributes ?? []),
      ]);
    });
}

function checkModules(manifest) {
  return manifest.modules
    .filter(({ description }) => !description)
    .map(
      ({ path }) =>
        `${path} has no description -- add a JSDoc block tagged @module to its source`
    );
}

function loadBundle() {
  const { window } = new JSDOM('', {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });

  window.eval(readFileSync(join(root, pkg.unpkg), 'utf8'));

  return window;
}

const manifestPath = join(root, pkg.customElements);

if (!existsSync(manifestPath) || !existsSync(join(root, pkg.unpkg))) {
  console.error(
    `Nothing to check: ${pkg.customElements} or ${pkg.unpkg} is missing.\nRun "npm run build" before this step.`
  );

  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const problems = [
  ...(manifest.readme ? [] : ['the readme is empty']),
  ...checkModules(manifest),
  ...checkElements(manifest, loadBundle()),
];

if (problems.length > 0) {
  console.error(
    `Found an incomplete custom-elements manifest\n\n${problems
      .map((line, i) => `[${i + 1}] ${line}`)
      .join('\n')}\n`
  );

  process.exitCode = 1;
} else {
  console.log(`${pkg.customElements} ok`);
}
