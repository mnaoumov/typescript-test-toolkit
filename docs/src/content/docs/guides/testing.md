---
title: Testing
description: The per-test setup, async-operation tracking, unhandled async errors, silenced console output and warnings as errors.
sidebar:
    order: 1
---

## Wiring the setup

The package's per-test setup isolates each test and fails it on problems that would otherwise pass unnoticed. Wire it in through one of three endpoints:

- **Vitest**: `@mnaoumov/typescript-test-toolkit/vitest-setup`
- **Jest**: `@mnaoumov/typescript-test-toolkit/jest-setup`
- **Any framework**: `@mnaoumov/typescript-test-toolkit/setup`

Before each test the setup resets `@mnaoumov/typescript-lib`'s shared state and its `Library` configuration, enables async-operation tracking, silences the `console`, clears `localStorage` and starts collecting unhandled async errors. After each test it drains the tracked fire-and-forget operations and the pending macrotask queue, disables tracking, restores the `console`, and fails the test if an unhandled async error was emitted. The sections below cover each of these.

None of the endpoints is part of the package's root export, so a production import of the package never loads `vitest` or `@jest/globals`.

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['@mnaoumov/typescript-test-toolkit/vitest-setup']
  }
});
```

### Jest

`beforeEach`, `afterEach` and `afterAll` are only available once the test framework is installed, so use `setupFilesAfterEnv`, not `setupFiles`:

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['@mnaoumov/typescript-test-toolkit/jest-setup']
};

export default config;
```

### Other frameworks

The framework-agnostic endpoint registers the setup with the hooks you hand it. All three are required: `afterAll` closes the window in which unhandled async errors are collected, once the file's last test has run.

```typescript
import { setup } from '@mnaoumov/typescript-test-toolkit/setup';
import {
  afterAll,
  afterEach,
  beforeEach
} from 'your-test-framework';

setup({ afterAll, afterEach, beforeEach });
```

## Async-operation tracking

Fire-and-forget operations scheduled through `invokeAsyncSafely` or `convertAsyncToSync` from `@mnaoumov/typescript-lib/async` cannot be awaited by the test that triggered them, which makes an assertion that depends on them flaky. While tracking is enabled, each such operation is recorded until it settles, and `waitForAllAsyncOperations()` waits for all of them:

```typescript
import { waitForAllAsyncOperations } from '@mnaoumov/typescript-test-toolkit/async-operation-tracking';

it('drains fire-and-forget work before asserting', async () => {
  doSomethingThatSchedulesFireAndForgetWork();
  await waitForAllAsyncOperations();
  expect(sideEffect).toBe(expected);
});
```

Operations scheduled while it waits are waited for too, so a cascading fire-and-forget chain is drained completely. Calling it while tracking is disabled throws, rather than resolving at once and hiding a missing setup.

The setup enables tracking before each test and disables it after. Without the setup, enable it yourself: `enableAsyncOperationTracking()` returns a `Disposable`, so `using _tracking = enableAsyncOperationTracking();` scopes it to a block. Tracking is off by default, so production code carries no bookkeeping.

The pending operations live in a slot shared by every loaded copy of `@mnaoumov/typescript-lib`, so tracking still works when the code under test and the test bundle different copies of it.

## Unhandled async errors

The setup fails a test if a fire-and-forget operation emitted an async error the test did not declare as expected. After each test it first drains the tracked operations, so any that reject emit their error, then throws an `AggregateError` listing every async error emitted during the test. This is not opt-in: every setup endpoint enables it.

A handler registered with `registerAsyncErrorEventHandler` does not count as handling the error. In production, a handler that shows the error to the user is a reasonable definition of handled; in a test it says nothing about whether the error was expected.

When a test triggers an async error on purpose, open an ignore context with `startAsyncErrorIgnoreContext()`. An operation scheduled inside the context is ignored even when its rejection settles later, after the context has closed, so the test needs no manual draining:

```typescript
import { invokeAsyncSafely } from '@mnaoumov/typescript-lib/async';
import { startAsyncErrorIgnoreContext } from '@mnaoumov/typescript-lib/error';

it('swallows the rejection without throwing synchronously', () => {
  using _ignore = startAsyncErrorIgnoreContext();
  invokeAsyncSafely(() => Promise.reject(new Error('deliberately swallowed')));
});
```

Only operations scheduled inside the context are ignored. One scheduled outside it is still reported, even if another was ignored:

```typescript
it('still fails on an unignored rejection', () => {
  (() => {
    using _ignore = startAsyncErrorIgnoreContext();
    invokeAsyncSafely(() => Promise.reject(new Error('ignored')));
  })();

  invokeAsyncSafely(() => Promise.reject(new Error('reported, and fails the test')));
});
```

### Errors between tests

A `setTimeout` a test leaves pending is not a tracked operation, so `waitForAllAsyncOperations()` does not wait for it. The setup therefore also lets the macrotask queue turn over after each test, and keeps collecting errors in the gap before the next one. An error emitted in that gap fails the next test, reported as occurring "after the previous test finished". One emitted after the file's last test fails the file's `afterAll`, as occurring "after the last test finished". Either way, an error is never printed to a restored `console` and dropped.

The macrotask drain uses the `setTimeout` captured when the setup loaded, so a test that left `vi.useFakeTimers()` on does not hang the teardown.

## Silenced console output

The setup replaces every `console` method with a no-op before each test and restores the originals afterward, so incidental `console.log`, `warn` and `error` output does not clutter the test report. A test that asserts on console output spies on the method it cares about, and the spy replaces the no-op for that test:

```typescript
import { vi } from 'vitest';

it('logs an error', () => {
  const errorSpy = vi.spyOn(console, 'error');
  doSomethingThatLogs();
  expect(errorSpy).toHaveBeenCalledWith('boom');
});
```

## `localStorage` in tests

Node 22 and later expose an experimental Web Storage `localStorage`, but it is unavailable, and touching it emits an `ExperimentalWarning`, unless Node is started with `--localstorage-file`. Tests run through [`@mnaoumov/typescript-dev-toolkit`](https://github.com/mnaoumov/typescript-dev-toolkit)'s test runner get `--localstorage-file=:memory:` appended to `NODE_OPTIONS` for every process it spawns, which gives each worker a working `localStorage` with no file on disk and no state shared between processes. The setup clears it before each test. If you launch `vitest` directly, pass the flag yourself:

```shell
NODE_OPTIONS=--localstorage-file=:memory: vitest
```

## Warnings as errors

The setup turns every Node process warning (`ExperimentalWarning`, `DeprecationWarning`, `MaxListenersExceededWarning`, and so on) into a failure, so a warning gets fixed at its source instead of scrolling past unread. This is not opt-in: every setup endpoint enables it.

Because a run without `localStorage` emits an `ExperimentalWarning`, it pairs with the section above: run tests through the test runner, which supplies the flag, or set `NODE_OPTIONS=--localstorage-file=:memory:` yourself. To install the guard outside the setup, call `installWarningsAsErrors()` from `@mnaoumov/typescript-test-toolkit/warnings-as-errors`. It registers its listener at most once per process, however many setup files or module copies call it.

## Node Web API globals under a VM pool

Under Vitest's `vmThreads` or `vmForks` pool with the `jsdom` environment, a test's global object is the `jsdom` window, and Vitest copies only a few Node globals into it. `crypto.subtle`, the Web Streams classes, `CompressionStream`, the `Performance*` classes and `URLPattern` are missing there, though present under the default pool. Code that feature-detects one of them then silently tests its fallback branch.

The setup calls `restoreNodeWebGlobals()` from `@mnaoumov/typescript-test-toolkit/node-web-globals`, which defines each missing name from the Node module that exports it and leaves every name already present alone. Under the default pool it changes nothing. `CryptoKey` and `QuotaExceededError` are not restored, because no Node module exports them.
