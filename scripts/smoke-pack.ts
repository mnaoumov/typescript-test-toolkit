/**
 * @file
 *
 * Packs this package, installs the tarball into an empty project, loads every exported module as ESM and as CommonJS,
 * and type-checks every exported subpath from a consumer. Run it after `npm run build`; CI runs it after the gate.
 */

import { wrapCliTask } from '@mnaoumov/typescript-dev-toolkit/cli-utils';
import { smokePack } from '@mnaoumov/typescript-dev-toolkit/pack-smoke';

await wrapCliTask(() =>
  smokePack({
    // `vitest-setup` and `mock-implementation` are built on the optional peer `vitest`, and `jest-setup` on the
    // optional peer `@jest/globals`. The root barrel re-exports `mock-implementation`, so it needs `vitest` too,
    // which is why a consumer imports a subpath.
    peerBoundModules: ['.', 'jest-setup', 'mock-implementation', 'vitest-setup']
  })
);
