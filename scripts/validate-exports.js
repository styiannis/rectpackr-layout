const { readFileSync, existsSync } = require('node:fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const invalidPaths = [];

['source', 'main', 'module', 'unpkg', 'jsdelivr', 'types'].forEach((k) => {
  if (pkg[k] && !existsSync(pkg[k])) invalidPaths.push(pkg[k]);
});

if (pkg.exports) {
  Object.keys(pkg.exports).reduce((acc, curr) => {
    const def = pkg.exports[curr].default;
    const imp = pkg.exports[curr].import;
    const req = pkg.exports[curr].require;
    const typ = pkg.exports[curr].types;

    if (def && !existsSync(def)) acc.push(def);
    if (imp && !existsSync(imp)) acc.push(imp);
    if (req && !existsSync(req)) acc.push(req);
    if (typ && !existsSync(typ)) acc.push(typ);

    return acc;
  }, invalidPaths);
}

if (invalidPaths.length > 0) {
  throw Error(
    `Found missing exported files\n\n${invalidPaths
      .map((path, i) => `[${i}] ${path}`)
      .join('\n')}\n`
  );
}
