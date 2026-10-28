import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fixture = mkdtempSync(join(tmpdir(), 'builder-release-plan-'));
const packages = ['libs/state', 'libs/core', 'libs/ui/material', 'libs/ui/builder-material'];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
try {
  mkdirSync(join(fixture, '.changeset'));
  writeFileSync(join(fixture, 'package-lock.json'), '{}');
  cpSync(join(root, '.changeset/config.json'), join(fixture, '.changeset/config.json'));
  writeFileSync(
    join(fixture, 'package.json'),
    JSON.stringify({ name: 'release-fixture', private: true, workspaces: packages }),
  );
  for (const directory of packages) {
    mkdirSync(join(fixture, directory), { recursive: true });
    cpSync(join(root, directory, 'package.json'), join(fixture, directory, 'package.json'));
  }
  const state = readJson(join(fixture, 'libs/state/package.json'));
  writeFileSync(
    join(fixture, '.changeset/state-patch.md'),
    `---\n'${state.name}': patch\n---\n\nCompatible state fix.\n`,
  );
  execFileSync('git', ['init', '-b', 'main', fixture], { stdio: 'pipe' });
  execFileSync(
    'git',
    [
      '-c',
      'user.name=Release fixture',
      '-c',
      'user.email=release@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '--allow-empty',
      '-m',
      'Initialize release fixture',
    ],
    { cwd: fixture, stdio: 'pipe' },
  );
  const output = join(fixture, 'plan.json');
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/@changesets/cli/bin.js'), 'status', '--output', output],
    { cwd: fixture, stdio: 'inherit' },
  );
  const plan = readJson(output);
  assert.equal(plan.releases.length, 1, 'A compatible state patch must not release dependents');
  assert.equal(plan.releases[0].name, state.name);
  assert.equal(plan.releases[0].type, 'patch');
  for (const directory of packages) {
    assert.equal(
      readFileSync(join(fixture, directory, 'package.json'), 'utf8'),
      readFileSync(join(root, directory, 'package.json'), 'utf8'),
    );
  }
  if (process.argv.includes('--consumer')) {
    for (const directory of ['state', 'core', 'material', 'builder-material']) {
      cpSync(join(root, 'dist', directory), join(fixture, 'dist', directory), { recursive: true });
    }
    cpSync(
      join(root, 'integration/package-consumer'),
      join(fixture, 'integration/package-consumer'),
      { recursive: true },
    );
    mkdirSync(join(fixture, 'scripts'));
    cpSync(
      join(root, 'scripts/check-packed-consumer.mjs'),
      join(fixture, 'scripts/check-packed-consumer.mjs'),
    );
    const builtPath = join(fixture, 'dist/state/package.json');
    const built = readJson(builtPath);
    built.version = plan.releases[0].newVersion;
    writeFileSync(builtPath, JSON.stringify(built));
    execFileSync(process.execPath, [join(fixture, 'scripts/check-packed-consumer.mjs')], {
      cwd: fixture,
      stdio: 'inherit',
    });
  }
  console.log(JSON.stringify(plan.releases, null, 2));
  console.log(
    'Core, runtime fields and editor adapters keep their versions. No files, tags or registry entries changed.',
  );
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
