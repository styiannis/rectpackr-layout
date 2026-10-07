import { readFileSync } from 'node:fs';

// The analyzer leaves a module's description empty. The source gives it in a
// JSDoc block tagged `@module`, which the build keeps but moves below the
// imports -- so the block is found by its tag, not by its position.
const moduleDescriptionPlugin = () => ({
  name: 'module-description',
  analyzePhase({ ts, node, moduleDoc }) {
    if (!ts.isSourceFile(node)) {
      return;
    }

    const moduleJsDoc = node.statements
      .flatMap((statement) => statement.jsDoc ?? [])
      .find((jsDoc) =>
        jsDoc.tags?.some((tag) => tag.tagName.text === 'module')
      );

    const description = ts.getTextOfJSDocComment(moduleJsDoc?.comment);

    if (description) {
      moduleDoc.description = description;
    }
  },
});

// The analyzer writes an empty readme; catalogs that read the manifest show
// this one instead.
const readmePlugin = (path) => ({
  name: 'readme',
  packageLinkPhase({ customElementsManifest }) {
    customElementsManifest.readme = readFileSync(path, 'utf8');
  },
});

// `#private` members are listed with `privacy: 'private'`, although nothing
// outside the class can reach them.
const removePrivateMembersPlugin = () => ({
  name: 'remove-private-members',
  packageLinkPhase({ customElementsManifest }) {
    for (const mod of customElementsManifest.modules) {
      for (const declaration of mod.declarations ?? []) {
        if (declaration.members) {
          declaration.members = declaration.members.filter(
            (member) => member.privacy !== 'private'
          );
        }
      }
    }
  },
});

// The analyzer resolves a reference to another local module as a URL
// pathname, so it starts with "/" where every other path is relative to the
// package root.
const relativeModulePathsPlugin = () => {
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    if (typeof node.module === 'string') {
      node.module = node.module.replace(/^\/+/, '');
    }

    Object.values(node).forEach(visit);
  };

  return {
    name: 'relative-module-paths',
    packageLinkPhase({ customElementsManifest }) {
      visit(customElementsManifest);
    },
  };
};

export default {
  globs: [
    // The ES build rather than src/, so that every path in the manifest is one
    // the package ships.
    'dist/es/**/*.mjs',
  ],
  exclude: [
    // core/ is internal: nothing in it is reachable from the package's exports.
    'dist/es/core/**',
  ],
  outdir: 'dist',
  plugins: [
    moduleDescriptionPlugin(),
    readmePlugin('README.md'),
    removePrivateMembersPlugin(),
    relativeModulePathsPlugin(),
  ],
};
