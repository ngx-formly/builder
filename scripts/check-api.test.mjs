import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkSnapshot, snapshotPackage, normalizeDeclarations } from './check-api.mjs';

test('API gate detects unused exports, signature changes, tokens and stylesheet exports', () => {
  const directory = mkdtempSync(join(tmpdir(), 'builder-api-'));
  try {
    const manifest = {
      name: 'fixture',
      typings: 'index.d.ts',
      exports: { '.': { types: './index.d.ts' }, './styles.css': './styles.css' },
    };
    const declaration =
      'export interface Store { save(id: string): void; }\nexport declare const STORE: InjectionToken<Store>;\nexport declare function provideBuilder(config: { autoSave?: boolean }): EnvironmentProviders;\nexport declare const unused: string;\n';
    const manifestPath = join(directory, 'package.json');
    const entry = join(directory, 'index.d.ts');
    const report = join(directory, 'fixture.api.md');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    writeFileSync(entry, declaration);
    const baseline = snapshotPackage(directory);
    assert.throws(() => checkSnapshot(report, baseline), /Public API changed/);
    checkSnapshot(report, baseline, true);
    checkSnapshot(report, baseline);
    for (const changed of [
      declaration.replace('export declare const unused: string;\n', ''),
      declaration.replace('save(id: string)', 'save(id: number)'),
      declaration.replace('InjectionToken<Store>', 'InjectionToken<string>'),
      declaration.replace('autoSave?: boolean', 'autoSave: boolean'),
    ]) {
      writeFileSync(entry, changed);
      assert.throws(() => checkSnapshot(report, snapshotPackage(directory)), /Public API changed/);
      assert.equal(
        readFileSync(report, 'utf8'),
        baseline,
        'checking must not rewrite the baseline',
      );
    }
    writeFileSync(entry, declaration);
    delete manifest.exports['./styles.css'];
    writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => checkSnapshot(report, snapshotPackage(directory)), /Public API changed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('declaration snapshots fail when build output is missing and normalize line endings', () => {
  const directory = mkdtempSync(join(tmpdir(), 'builder-api-'));
  try {
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ name: 'fixture', typings: 'index.d.ts', exports: { '.': './index.d.ts' } }),
    );
    assert.throws(() => snapshotPackage(directory), /build declarations/);
    writeFileSync(join(directory, 'index.d.ts'), 'export declare const field: string;\n');
    const baseline = snapshotPackage(directory);
    writeFileSync(join(directory, 'index.d.ts'), 'export declare const field: string;\r\n');
    assert.equal(snapshotPackage(directory), baseline);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('normalizes inferred union ordering without hiding type changes', () => {
  const first = normalizeDeclarations('export type Status = "saved" | "error";');
  assert.equal(first, normalizeDeclarations('export type Status = "error" | "saved";'));
  assert.notEqual(first, normalizeDeclarations('export type Status = "error" | "saving";'));
});
