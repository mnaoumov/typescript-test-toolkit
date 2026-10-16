---
title: Getting started
description: Install `@mnaoumov/typescript-test-toolkit` and wire its per-test setup into Vitest or Jest.
sidebar:
    order: 0
---

`@mnaoumov/typescript-test-toolkit` is generic test support for TypeScript projects: a per-test setup for Vitest, Jest or any other framework, async-operation tracking, `strictProxy` and mock helpers. It depends on [`@mnaoumov/typescript-lib`](https://mnaoumov.dev/typescript-lib/) only.

## Installation

Install it as a dev dependency:

```bash
npm install --save-dev @mnaoumov/typescript-test-toolkit
```

`vitest` and `@jest/globals` are optional peer dependencies: install whichever framework the project runs.

## Wiring the setup

Point the test runner at the setup file for its framework, and every test starts from isolated state:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['@mnaoumov/typescript-test-toolkit/vitest-setup']
  }
});
```

[Testing](/typescript-test-toolkit/guides/testing/) describes what the setup does before and after each test, and how to wire it into Jest or another framework.

## Importing

Every module is a subpath of the package, named after its file:

```typescript
import { waitForAllAsyncOperations } from '@mnaoumov/typescript-test-toolkit/async-operation-tracking';
import { mockImplementation } from '@mnaoumov/typescript-test-toolkit/mock-implementation';
import { strictProxy } from '@mnaoumov/typescript-test-toolkit/strict-proxy';
```

## Strict mocks

`strictProxy` turns a partial object into a mock of the full type that throws on every member the partial did not provide, so a test that reaches an unmocked member fails at that line instead of carrying `undefined` onward:

```typescript
import { strictProxy } from '@mnaoumov/typescript-test-toolkit/strict-proxy';

const fileSystem = strictProxy<FileSystem>({
  readFile: async () => 'content'
});

await fileSystem.readFile('a.txt');
await fileSystem.writeFile('a.txt', ''); // Throws: Unmocked property "writeFile" was accessed on mock object
```

Nested plain objects are wrapped too. Properties that test tooling probes while printing a value, such as `then`, `toJSON` and `Symbol.iterator`, pass through rather than throw. `bypassStrictProxy` returns the object underneath, for reading an optional member without tripping the proxy.

## Spying with the original implementation

`mockImplementation` (Vitest only) spies on a method and hands the replacement the original implementation as its first argument, so a test can wrap the real behavior rather than replace it:

```typescript
import { mockImplementation } from '@mnaoumov/typescript-test-toolkit/mock-implementation';

const spy = mockImplementation({
  $object: service,
  impl(originalImplementation, path) {
    return path === 'missing.txt' ? null : originalImplementation.call(this, path);
  },
  method: 'load'
});
```

Spying on the same method twice still passes the true original, not the first spy.

## Where to go next

- [Testing](/typescript-test-toolkit/guides/testing/): the per-test setup, async-operation tracking and the failures it raises.
- [API reference](/typescript-test-toolkit/api/): every module and export, generated from the package's TSDoc.
