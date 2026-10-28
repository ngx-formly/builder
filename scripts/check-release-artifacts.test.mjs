import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const packages = ['libs/state', 'libs/core', 'libs/ui/material', 'libs/ui/builder-material'];

test('release artifacts reject stale versions, peer ranges and missing declarations', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'builder-artifacts-'));
  try {
    for (const directory of packages) {
      const source = JSON.parse(readFileSync(join(root, directory, 'package.json'), 'utf8'));
      mkdirSync(join(fixture, directory), { recursive: true });
      writeFileSync(join(fixture, directory, 'package.json'), JSON.stringify(source));
      const output = resolve(fixture, directory, source.publishConfig.directory);
      mkdirSync(output, { recursive: true });
      writeFileSync(
        join(output, 'package.json'),
        JSON.stringify({
          ...source,
          typings: 'index.d.ts',
          module: 'index.mjs',
          exports: { '.': './index.mjs' },
        }),
      );
      writeFileSync(join(output, 'index.d.ts'), 'export {};');
      writeFileSync(join(output, 'index.mjs'), 'export {};');
    }
    const check = () =>
      spawnSync(process.execPath, [join(root, 'scripts/check-release-artifacts.mjs')], {
        cwd: fixture,
        encoding: 'utf8',
      });
    assert.equal(check().status, 0);
    const manifest = join(fixture, 'dist/state/package.json');
    const original = JSON.parse(readFileSync(manifest, 'utf8'));
    for (const [override, error] of [
      [{ version: '99.0.0' }, 'stale built version'],
      [{ peerDependencies: {} }, 'stale peer ranges'],
      [{ typings: 'missing.d.ts' }, 'missing declarations'],
    ]) {
      writeFileSync(manifest, JSON.stringify({ ...original, ...override }));
      const result = check();
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(error), result.stderr);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
