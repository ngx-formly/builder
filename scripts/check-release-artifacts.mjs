import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const packages = ['libs/state', 'libs/core', 'libs/ui/material', 'libs/ui/builder-material'];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
for (const directory of packages) {
  const source = readJson(`${directory}/package.json`);
  const output = resolve(directory, source.publishConfig.directory);
  const built = readJson(`${output}/package.json`);
  assert.equal(built.name, source.name, `${directory}: wrong built package`);
  assert.equal(built.version, source.version, `${source.name}: stale built version`);
  assert.deepEqual(
    built.peerDependencies,
    source.peerDependencies,
    `${source.name}: stale peer ranges`,
  );
  assert.ok(existsSync(resolve(output, built.typings)), `${source.name}: missing declarations`);
  assert.ok(existsSync(resolve(output, built.module)), `${source.name}: missing bundle`);
  assert.ok(built.exports['.'], `${source.name}: missing public entry point`);
}
console.log(
  'Release names, versions, peer ranges, bundles and declarations match source manifests.',
);
