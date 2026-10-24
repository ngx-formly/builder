import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const packages = [
  {
    source: 'libs/state/package.json',
    dist: 'dist/state',
    forbiddenImports: [
      '@angular/cdk',
      '@angular/material',
      '@ngx-formly/builder',
      '@ngx-formly/builder-material',
      '@ngx-formly/builder-material-fields',
      'primeng',
    ],
  },
  { source: 'libs/core/package.json', dist: 'dist/core' },
  { source: 'libs/ui/material/package.json', dist: 'dist/material' },
  { source: 'libs/ui/builder-material/package.json', dist: 'dist/builder-material' },
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageName(specifier) {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

function collectBundleImports(directory) {
  const imports = new Set();
  const visit = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.name.endsWith('.mjs')) {
        const source = readFileSync(entryPath, 'utf8');
        for (const match of source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
          const specifier = match[1];
          if (!specifier.startsWith('.') && !specifier.startsWith('node:')) {
            imports.add(packageName(specifier));
          }
        }
      }
    }
  };

  visit(directory);
  return imports;
}

const failures = [];
const sourceNames = new Set();

for (const definition of packages) {
  const sourceManifest = readJson(definition.source);
  const distManifestPath = join(definition.dist, 'package.json');
  const bundleDirectory = join(definition.dist, 'fesm2022');

  if (!existsSync(distManifestPath) || !existsSync(bundleDirectory)) {
    failures.push(`${sourceManifest.name}: build output is missing; build the libraries first`);
    continue;
  }

  const distManifest = readJson(distManifestPath);
  sourceNames.add(sourceManifest.name);

  if (distManifest.name !== sourceManifest.name) {
    failures.push(
      `${sourceManifest.name}: built package name is ${distManifest.name ?? '<missing>'}`,
    );
  }

  const declared = new Set([
    ...Object.keys(distManifest.dependencies ?? {}),
    ...Object.keys(distManifest.peerDependencies ?? {}),
    ...Object.keys(distManifest.optionalDependencies ?? {}),
  ]);
  const bundleImports = collectBundleImports(bundleDirectory);
  const missing = [...bundleImports].filter((dependency) => !declared.has(dependency));

  if (missing.length > 0) {
    failures.push(
      `${sourceManifest.name}: undeclared bundle imports: ${missing.sort().join(', ')}`,
    );
  }

  const forbidden = (definition.forbiddenImports ?? []).filter((dependency) =>
    bundleImports.has(dependency),
  );
  if (forbidden.length > 0) {
    failures.push(`${sourceManifest.name}: forbidden bundle imports: ${forbidden.join(', ')}`);
  }
}

for (const definition of packages) {
  const manifest = readJson(definition.source);
  for (const dependency of Object.keys(manifest.peerDependencies ?? {})) {
    if (
      (dependency === '@ngx-formly/builder' || dependency.startsWith('@ngx-formly/builder-')) &&
      !sourceNames.has(dependency)
    ) {
      failures.push(`${manifest.name}: internal peer ${dependency} does not match a package name`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Package contract validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${packages.length} built package contracts.`);
}
