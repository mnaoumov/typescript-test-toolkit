import { assertDocsSnippetsCompile } from '@mnaoumov/typescript-dev-toolkit/docs-site/docs-snippets';
import { assertNoOutdatedReferences } from '@mnaoumov/typescript-dev-toolkit/docs-site/outdated-references';
import { fileURLToPath } from 'node:url';
import {
  describe,
  expect,
  it
} from 'vitest';

import { getDocsSnippetsParams } from './helpers/docs-snippets-params.ts';

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));

// Compiling every guide snippet builds one program over `src/`, which takes tens of seconds.
const FULL_CHECK_TIMEOUT_IN_MILLISECONDS = 180_000;

describe('documentation checks', () => {
  it('should type-check every snippet of the guides', { timeout: FULL_CHECK_TIMEOUT_IN_MILLISECONDS }, async () => {
    await expect(assertDocsSnippetsCompile(getDocsSnippetsParams(ROOT_DIR))).resolves.toBeUndefined();
  });

  it('should find no outdated reference in the package', async () => {
    await expect(assertNoOutdatedReferences(ROOT_DIR)).resolves.toBeUndefined();
  });
});
