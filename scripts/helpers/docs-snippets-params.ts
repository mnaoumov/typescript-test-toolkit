/**
 * @file
 *
 * The parameters this package's guide-snippet check runs with, shared by `scripts/docs-check-snippets.ts` and the gate
 * test `scripts/docs-checks.test.ts`.
 */

import type { FindDocsSnippetProblemsParams } from '@mnaoumov/typescript-dev-toolkit/docs-site/docs-snippets';

import {
  join,
  resolve
} from 'node:path';

const PACKAGE_NAME = '@mnaoumov/typescript-test-toolkit';

/**
 * Builds the guide-snippet check's parameters: `tsconfig.json` has no `paths`, so this package's own name is mapped
 * onto `src/` for the check alone, and an import of `@mnaoumov/typescript-test-toolkit/...` resolves to the sources
 * rather than to a build.
 *
 * @param rootDirectory - The package root.
 * @returns The parameters.
 */
export function getDocsSnippetsParams(rootDirectory: string): FindDocsSnippetProblemsParams {
  const sourceDirectory = join(resolve(rootDirectory), 'src').replaceAll('\\', '/');
  return {
    compilerOptions: {
      paths: {
        [`${PACKAGE_NAME}/*`]: [`${sourceDirectory}/*.ts`, `${sourceDirectory}/*/index.ts`],
        [PACKAGE_NAME]: [`${sourceDirectory}/index.ts`]
      }
    },
    rootDirectory
  };
}
