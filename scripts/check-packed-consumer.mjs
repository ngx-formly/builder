import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixtureSource = join(workspaceRoot, 'integration/package-consumer');
const packageDirectories = ['state', 'core', 'material', 'builder-material'];
const nodeCommand = process.execPath;
const npmCli = process.env['npm_execpath'];
const fixtureRoot = mkdtempSync(join(tmpdir(), 'formly-editor-consumer-'));
const tarballDirectory = join(fixtureRoot, 'packages');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: { ...process.env, FORMLY_CONSUMER_ROOT: fixtureRoot },
  });
}

function runNpm(args, options = {}) {
  if (!npmCli) {
    throw new Error('npm_execpath is unavailable; run this check through npm run check:packages');
  }
  return run(nodeCommand, [npmCli, ...args], options);
}

try {
  mkdirSync(tarballDirectory);
  for (const file of [
    'consumer.ts',
    'tsconfig.json',
    'angular.json',
    '.postcssrc.json',
    'index.html',
    'styles.css',
  ]) {
    cpSync(join(fixtureSource, file), join(fixtureRoot, file));
  }

  const fixtureManifest = JSON.parse(readFileSync(join(fixtureSource, 'package.json'), 'utf8'));

  for (const directory of packageDirectories) {
    const packagePath = join(workspaceRoot, 'dist', directory);
    const packOutput = runNpm(
      ['pack', packagePath, '--json', '--pack-destination', tarballDirectory],
      { capture: true },
    );
    const [{ filename }] = JSON.parse(packOutput);
    const packageManifest = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf8'));
    fixtureManifest.dependencies[packageManifest.name] = `file:./packages/${basename(filename)}`;
  }

  writeFileSync(join(fixtureRoot, 'package.json'), `${JSON.stringify(fixtureManifest, null, 2)}\n`);

  runNpm(['install', '--ignore-scripts', '--no-package-lock']);
  runNpm(['exec', '--', 'tsc', '--noEmit', '-p', 'tsconfig.json']);
  runNpm(['run', 'build']);
  run(nodeCommand, [
    '--input-type=module',
    '--eval',
    [
      "import { existsSync } from 'node:fs';",
      "import { fileURLToPath } from 'node:url';",
      "for (const name of ['@ngx-formly/builder-state', '@ngx-formly/builder', '@ngx-formly/builder/styles.css', '@ngx-formly/builder-material-fields', '@ngx-formly/builder-material']) {",
      '  const entryPoint = fileURLToPath(import.meta.resolve(name));',
      '  if (!existsSync(entryPoint)) throw new Error(`Missing package entry point: ${name}`);',
      '}',
    ].join('\n'),
  ]);

  if (process.argv.includes('--browser')) {
    run(nodeCommand, [
      join(workspaceRoot, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--config',
      join(fixtureSource, 'playwright.config.ts'),
    ]);
  }

  console.log('Validated packed packages in a clean consumer installation.');
} finally {
  rmSync(fixtureRoot, { force: true, recursive: true });
}
