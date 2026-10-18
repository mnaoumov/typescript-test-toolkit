/**
 * @file
 *
 * Type-checks every code snippet of the documentation guides; its `docs:check-snippets` script points here. The
 * same check runs in the gate, as `scripts/docs-checks.test.ts`.
 */

import { wrapCliTask } from '@mnaoumov/typescript-dev-toolkit/cli-utils';
import { assertDocsSnippetsCompile } from '@mnaoumov/typescript-dev-toolkit/docs-site/docs-snippets';
import process from 'node:process';

import { getDocsSnippetsParams } from './helpers/docs-snippets-params.ts';

await wrapCliTask(async () => {
  await assertDocsSnippetsCompile(getDocsSnippetsParams(process.cwd()));
});
