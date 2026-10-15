import {
  DEFAULT_VITEST_TEST_EXCLUDE,
  defineLibraryVitestConfig
} from '@mnaoumov/typescript-dev-toolkit/test-runners/vitest-config';

// Processed by Vite rather than loaded by Node, so `vi.resetModules()` gives a test a second copy of it: the tests
// that prove the shared slots are realm-global, not module-local, need two copies to tell the two apart.
const SHARED_SERVER = {
  // eslint-disable-next-line unicorn/name-replacements -- `deps` is a Vitest config key.
  deps: {
    inline: ['@mnaoumov/typescript-lib']
  }
};

// These two test process-level Node behavior (warnings, the Web globals a VM context lacks), so they run in a
// plain Node environment with no per-test setup, as they did beside the rest of the tooling.
const NODE_TEST_FILES = [
  'src/node-web-globals.test.ts',
  'src/warnings-as-errors.test.ts'
];

export default defineLibraryVitestConfig({
  projects: [
    {
      test: {
        environment: 'jsdom',
        exclude: [...DEFAULT_VITEST_TEST_EXCLUDE, ...NODE_TEST_FILES],
        include: ['src/**/*.test.ts'],
        name: 'unit-tests',
        pool: 'vmThreads',
        server: SHARED_SERVER,
        setupFiles: ['./src/vitest-setup.ts']
      }
    },
    {
      test: {
        environment: 'node',
        exclude: [...DEFAULT_VITEST_TEST_EXCLUDE],
        include: NODE_TEST_FILES,
        name: 'unit-tests:node',
        server: SHARED_SERVER,
        setupFiles: []
      }
    }
  ]
});
