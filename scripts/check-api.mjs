import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export function normalizeDeclarations(content) {
  const source = ts.createSourceFile('api.d.ts', content, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const result = ts.transform(source, [
    (context) => {
      const visit = (node) => {
        node = ts.visitEachChild(node, visit, context);
        if (ts.isUnionTypeNode(node)) {
          // TypeScript can emit inferred union members in a different order between builds.
          const text = (type) => printer.printNode(ts.EmitHint.Unspecified, type, source);
          return ts.factory.updateUnionTypeNode(
            node,
            [...node.types].sort((a, b) => (text(a) < text(b) ? -1 : text(a) > text(b) ? 1 : 0)),
          );
        }
        return node;
      };
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  try {
    return printer.printFile(result.transformed[0]).trimEnd();
  } finally {
    result.dispose();
  }
}

const packages = ['state', 'core', 'material', 'builder-material'];

/** Capture the complete rolled declarations, including types omitted by the consumer fixture. */
export function snapshotPackage(directory) {
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  if (!manifest.typings || !existsSync(join(directory, manifest.typings))) {
    throw new Error(`${manifest.name}: build declarations before checking the API`);
  }
  const declarations = [];
  function visit(relative = '') {
    for (const entry of readdirSync(join(directory, relative), { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (path.endsWith('.d.ts')) {
        const content = readFileSync(join(directory, path), 'utf8')
          .replace(/\r\n/g, '\n')
          .replace(/^\/\/# sourceMappingURL=.*\n?/gm, '')
          .trimEnd();
        declarations.push(`// ${path}\n${normalizeDeclarations(content)}`);
      }
    }
  }
  visit();
  return `# ${manifest.name}\n\nGenerated declarations for review. Update with \`npm run update:api\`.\n\n## Package exports\n\n\`\`\`json\n${JSON.stringify(manifest.exports, null, 2)}\n\`\`\`\n\n## Declarations\n\n\`\`\`ts\n${declarations.join('\n\n')}\n\`\`\`\n`;
}

export function checkSnapshot(path, actual, update = false) {
  if (update) {
    writeFileSync(path, actual);
  } else if (!existsSync(path) || readFileSync(path, 'utf8') !== actual) {
    throw new Error(
      `Public API changed: ${path}. Review the declaration diff and release impact before running npm run update:api.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, '..');
  const directory = join(root, 'etc/api');
  const update = process.argv.includes('--update');
  if (update) mkdirSync(directory, { recursive: true });
  const failures = [];
  for (const name of packages) {
    try {
      checkSnapshot(
        join(directory, `${name}.api.md`),
        snapshotPackage(join(root, 'dist', name)),
        update,
      );
    } catch (error) {
      failures.push(error.message);
    }
  }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`${update ? 'Updated' : 'Verified'} ${packages.length} package API reports.`);
  }
}
