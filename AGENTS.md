# AGENTS.md

## Project overview

`@mnaoumov/typescript-test-toolkit` — Generic test support for TypeScript projects: Vitest/Jest setup, async-operation tracking, strictProxy and mock helpers.

It depends on `@mnaoumov/typescript-lib` only. Its endpoints are what a project wires into its test runner: `@mnaoumov/typescript-test-toolkit/vitest-setup` (or `jest-setup`, or the framework-agnostic `setup`), plus `async-operation-tracking`, `strict-proxy` and `mock-implementation`.

- **A helper under a `test-helpers/` folder never ships**: the library build skips every such folder. `mock-implementation.ts` sits at the top of `src/` for that reason.
- The unit tests load `@mnaoumov/typescript-lib` through Vite (`server.deps.inline`), because the tests that prove its shared slots are realm-global need a second copy of it from `vi.resetModules()`, which a dependency Node loads directly does not give.
- `node-web-globals.ts` and `warnings-as-errors.ts` patch the Node process itself, so they are linted as scripts and tested in a plain `node` project with no setup.

## Commands

Every script is a thin entry point under `scripts/`, run with `jiti`, over the shared tooling in `@mnaoumov/typescript-dev-toolkit` (and `@mnaoumov/obsidian-dev-toolkit` for an Obsidian package).

- `npm run gate` — **the branch gate: run it before committing.** It is the same code `npm run version` runs as its release preflight: the lockfile check, `format:check`, `spellcheck`, `lint:md`, `build`, `lint`, `find-overexposed`, `test:coverage`. `npm run gate -- --no-build` skips the build when the output is current. CI (`.github/workflows/ci.yml`) runs the whole gate.
- `npm run build` — every `build:*` step this package defines, in order (`scripts/build.ts`).
- `npm test` / `npm run test:coverage` / `npm run test:watch` — the unit tests; `test:coverage` holds all four thresholds at 100%.
- `npm run lint` / `npm run lint:fix` — ESLint. A warning fails it. ESLint is type-aware and reads the generated barrels, so build first on a fresh clone.
- `npm run lint:md` / `npm run lint:md:fix`, `npm run format` / `npm run format:check`, `npm run spellcheck` — markdownlint (with the soft-break rule on: every paragraph is one physical line), dprint and cspell.
- `npm run commit` — a guided Conventional-Commits message.
- `npm run version '--' <type> [--no-changelog-editing]` — the release. Quote the `--` in PowerShell.

## Standalone layout

This package moved out of the `obsidian-dev-utils` workspace, with its history, on 2026-10-15. Five things differ from the workspace and are easy to undo by accident:

- **A sibling `@mnaoumov/*` package is an ordinary dependency, installed from npm.** There is no `@mnaoumov/source` export condition any more: `generateLibraryExports` writes none unless asked, and `package.json`'s dependencies are the package boundary the workspace's ESLint config used to enforce.
- **A package cannot install itself, so its own scripts never import it by name.** In the tooling packages the scripts import `../src/*.ts`, so the toolkit builds and lints itself from its sources.
- **A test-support package that depends on this one would otherwise bring a SECOND copy of it into a test run.** Where that happens (`typescript-lib`, `obsidian-lib`), `scripts/vitest-self-source.ts` resolves this package's own name onto `src/`, the test-support packages are listed in the vitest projects' `server.deps.inline` so their imports go through it, and `tsconfig.json`'s `paths` does the same for the types. Drop any of the three and a test-setup reset reaches a different module instance than the code under test.
- **A package a test mocks through must be processed by Vite.** A dependency Node loads directly ignores `vi.mock` and survives `vi.resetModules()`, so a test that mocks `node:fs` underneath a toolkit helper, or that loads a second copy of a module on purpose, needs that dependency in `server.deps.inline`.
- **The first `package-lock.json` was seeded from the workspace lock**, so every dependency starts at the version the workspace tested rather than at whatever each range resolves to today. `obsidian` resolves to `1.13.1` that way; `1.14.x` peer-pins CodeMirror versions this tree does not pin yet, and a fresh resolution fails on that peer range until those pins move.

## Releasing

`npm run version '--' <patch|minor|major>` runs the gate, bumps the version, writes `CHANGELOG.md`, commits, tags, pushes and creates the GitHub release. The release carries no assets. Publishing the release triggers `.github/workflows/publish-npm.yml`, which rebuilds and runs `npm publish` through npm trusted publishing (OIDC): no npm token exists anywhere, and a publish from a developer machine is not possible. The package's trusted publisher on npmjs.com names this repository and `publish-npm.yml`; renaming the workflow breaks publishing until that setting matches.

`1.0.0` was published once from the `obsidian-dev-utils` workspace, all five packages together, because each package's tooling depends on siblings that were not on npm yet. This repository releases from `1.0.1` on; the `1.0.0` tag marks where it took over.

## Commits

Conventional Commits, enforced by commitlint in the `commit-msg` hook, which also refuses a header the spellchecker rejects. The `pre-commit` hook runs nano-staged: spellcheck, `lint:fix`, `format` and `lint:md:fix` on the staged files. Set `NANO_STAGED=0` in a gitignored `.env` to skip it.

## Carried over from obsidian-dev-utils

These sections were written in the `obsidian-dev-utils` workspace, where this package lived until it moved here with its history, and they still govern it. "This repository" or "this library" in them means that workspace; a path of another package is written `mnaoumov/<package>:<path>`, the file in that package's own repository.

### File Structure

Every source file follows this pattern:

```typescript
/**
 * @file
 *
 * Brief description of module purpose.
 */

import type { SomeType } from './some-module.ts';

import { something } from './other-module.ts';

export function myFunction(param: Type): ReturnType {
  // ...
}
```

### Naming

- Directories: kebab-case (e.g., `script-utils/bundlers/esbuild-impl`, `test-runners`)
- **Exception:** `constructors/` files use camelCase matching the exported function name (e.g., `getDomEventsHandlersConstructor.ts`), mirroring the `obsidian-typings` Constructors convention
- **An `Async` suffix disambiguates, it does NOT mean "this returns a promise".** Add it only when a synchronous counterpart of the same name already exists and would otherwise collide. Being `async` is never on its own a reason for the suffix — measured 2026-07-31, ~18 suffixed members against ~179 async members without one, and **every** established use resolves a name collision: `onloadAsync` (Obsidian's `onload`), `hideAsync`, `triggerAsync`/`tryTriggerAsync`, `createDivAsync`/`createElAsync`/… (Obsidian's sync `createDiv`/`createEl`), `setTimeoutAsync`/`requestAnimationFrameAsync`/`setImmediateAsync`/ `nextTickAsync` (the callback-based globals), `replaceAllAsync` (`String.replaceAll`), `noopAsync` (`noop`). (`invokeAsyncSafely` is not a counter-example — its `Async` is mid-name, describing what it invokes.) A `*Params` interface is named after its method, so it follows the method either way.

### Documentation

- Every exported function/class requires JSDoc with `@param` and `@returns` tags
- Every file requires a `@file` JSDoc comment at the top
- Test files and mock files are exempt from documentation requirements

### Imports

- Sorted alphabetically (enforced by `eslint-plugin-perfectionist`)
- Always include `.ts` extension in relative imports

### Test setup

- Consumers wire the library's per-test setup into their suites via three endpoints, mirroring `obsidian-test-mocks`'s naming: `obsidian-dev-utils/setup` (framework-agnostic `setup({ beforeEach, afterEach, afterAll })`), `obsidian-dev-utils/vitest-setup`, and `obsidian-dev-utils/jest-setup`. `afterAll` is **required** — it closes the unhandled-async-error collection window for the file (see "Unhandled async errors" below); the two framework endpoints pass it for you. Before each test the setup resets both shared-state bags, `globalThis.__obsidianDevUtils` and the generic `Symbol.for('@mnaoumov/typescript-lib/state')` slot (so accumulated state does not leak between tests), enables async-operation tracking, silences every `console` method (replacing each with a no-op via `silenceConsole()`, so incidental log/warn/error output does not pollute the test report), clears `localStorage` (so per-worker Web Storage does not leak between tests), and starts collecting unhandled async errors; after each test it drains any tracked fire-and-forget operations **and the pending macrotask queue**, disables tracking, restores the original `console` methods (`restoreConsole()`), and fails the test with an `AggregateError` if any unhandled async error was emitted (see "Unhandled async errors" below), so tests can `await waitForAllAsyncOperations()` against isolated state. A test that needs to assert on console output re-instruments the method it cares about (e.g. `vi.spyOn(console, 'error')`), which transparently overrides the no-op for that test. The Vitest/Jest files are thin setup-file glue (v8-ignored) over the unit-tested agnostic core. The top-level `setup.ts` and all `*-setup.ts` files are excluded from the auto-generated barrels (see `scripts/build-generate-index.ts`) so a production `import 'obsidian-dev-utils'` never pulls in `vitest`/`@jest/globals`.

### Generic state and the async-operation hook (the first cut toward the package split)

- **The generic code keeps its state in its own global slot, not in `__obsidianDevUtils`.** `mnaoumov/typescript-lib:src/typescript-lib-state.ts` stores the debuggers, the `debug` instance and the shared abort controller under `Symbol.for('@mnaoumov/typescript-lib/state')`, as `{ values, version }`. That is the first step of splitting this library into a generic package and an Obsidian one: a module that will move to the generic package must not name `__obsidianDevUtils`. Everything Obsidian-specific (the plugin-API registry, the backlink index, the queue) stays in `__obsidianDevUtils`, because the registry there is a published wire format (**L9**).
- **`initPluginContext` links the two bags back together** (`shareTypescriptLibStateWithObsidianDevUtilsState`). A wrapper an older copy of this library already keeps under `__obsidianDevUtils` wins, so plugins on old and new versions still share one `debug` instance and one shared abort controller. Otherwise the generic wrapper is published under `__obsidianDevUtils`, which keeps the devtools line `__obsidianDevUtils.sharedAbortController.value.abort()` in the debugging guide working.
- **Async-operation tracking is a HOOK that production code calls, and the registry belongs to the test support.** `invokeAsyncSafely` reports each operation to `notifyAsyncOperationStarted` (`mnaoumov/typescript-lib:src/async-operation-hook.ts`), a no-op until something installs a hook. `src/async-operation-tracking.ts` installs one and keeps the pending operations on the hook itself. `obsidian-dev-utils/async` still re-exports the four tracking functions, so no consumer import changes.
- **Both slots are global on purpose, and the tests prove it with two loaded copies.** The code under test and the test support can each bundle a different copy of the generic code. With a module-level variable each copy would keep its own slot, and tracking would silently see nothing. The `second loaded copy` cases in `async-operation-hook.test.ts`, `async-operation-tracking.test.ts` and `typescript-lib-state.test.ts` load a fresh copy through `vi.resetModules()`; all six go red when the slot is made module-local.
- **The debug guide URL is injected, not hard-coded.** `Library.init` takes an optional `debugGuideUrl`, which `initPluginContext` sets to this library's debugging guide. Without it, the debug messages name no guide.

### `localStorage` in tests (`--localstorage-file`)

- Node 22+ exposes an experimental Web Storage `localStorage`, but touching it without the `--localstorage-file` CLI flag emits an `ExperimentalWarning` and leaves `localStorage` unavailable (`undefined`). In real Obsidian (Electron) `localStorage` exists, so the root-cause fix is to provide it in tests — not to suppress the warning.
- `exec()` (`mnaoumov/typescript-dev-toolkit:src/exec.ts`) therefore appends `--localstorage-file=:memory:` to every spawned child process's `NODE_OPTIONS` (via `CHILD_ENV`, the same env-injection point already used for `DEBUG_COLORS`; existing `NODE_OPTIONS` are preserved by `appendNodeOption()`). `:memory:` gives each process a working, non-persistent `localStorage` — no file on disk, no state shared between processes. Because the flag rides on `NODE_OPTIONS`, it reaches Vitest's forked workers (Vitest ignores `poolOptions.*.execArgv` for this) whenever tests are launched through the runner (`npm test` → `test()` → `exec`). Running `vitest` **directly** (bare `npx vitest`) bypasses `exec`, so `localStorage` is absent there — run tests via the npm scripts.

### Warnings as errors

- `installWarningsAsErrors()` (`src/warnings-as-errors.ts`) registers a process `'warning'` listener that rethrows, so any Node warning (`ExperimentalWarning`, `DeprecationWarning`, `MaxListenersExceededWarning`, …) surfaces as an uncaught error and **fails the run** (non-zero exit). This forces warnings to be fixed at the source rather than scrolling past unread.
- It is installed by the standard `setup()` (`src/setup.ts`), so **every** consumer of `obsidian-dev-utils/vitest-setup`, `obsidian-dev-utils/jest-setup`, or the agnostic `obsidian-dev-utils/setup` gets it — it is forced, not opt-in. `installWarningsAsErrors()` is idempotent, so the repeated `setup()` calls across setup files register the listener at most once. Note this pairs with the `--localstorage-file` fix above: with warnings-as-errors on, a run that does **not** provide `localStorage` fails on the `ExperimentalWarning` — so tests must be launched through the runner (which supplies the flag) or with `--localstorage-file` set.

### Unhandled async errors

- The standard `setup()` also fails a test if a fire-and-forget async operation emitted an async error the test did not declare as expected — the "no swallowed async errors" harness. `beforeEach` calls `startCollectingUnhandledAsyncErrors()` (`mnaoumov/typescript-lib:src/error.ts`); `afterEach` drains tracked operations via `waitForAllAsyncOperations()` (guarded by `isAsyncOperationTrackingEnabled()`, so a test that disabled tracking itself does not trip the drain), then throws an `AggregateError` of whatever `drainCollectedUnhandledAsyncErrors()` returns. It is forced, not opt-in.
- **A registered consumer handler does NOT exempt an error** (it used to, via an `asyncErrorHandlerCount === 0` gate mirroring Node's `unhandledRejection`). `PluginBase` adds `AsyncErrorHandlerComponent` during `onload`, which registers such a handler — so the old gate disarmed the harness for the whole of **every plugin's `plugin.test.ts`**, where it was needed most. In production a handler showing the user a Notice is a defensible definition of "handled"; in a test it is not an assertion that the error was expected. `startAsyncErrorIgnoreContext()` is now the single, explicit opt-out, and it is explicit at the call site rather than dependent on which components a plugin happens to load. Consequence for consumers: a test that registers a handler and asserts on the emitted error must now also open an ignore context.
- **The collection window spans the gaps between tests, and `afterAll` closes it.** A `setTimeout(…, 0)` a test leaves pending (e.g. `LayoutReadyComponent.onload`) is not a tracked async operation, so `waitForAllAsyncOperations()` does not wait for it. `afterEach` therefore also lets the macrotask queue turn over (`drainPendingMacrotasks()`, built on a `globalThis.setTimeout` captured at module load so `vi.useFakeTimers()` cannot hang teardown), and *drains* the window rather than closing it — an error emitted in the gap is reported by the next `beforeEach` ("after the previous test finished"), and one emitted after the file's last test by `afterAll` ("after the last test finished"). Earlier, such an error hit a nulled bucket after `restoreConsole()` had run: it printed to a real console and failed nothing. The tell was a `stderr | <file>` block with **no test name** — i.e. emitted outside any running test.
- A test that deliberately triggers an async error opens an ignore context: `using _ = startAsyncErrorIgnoreContext()` (an `asyncErrorIgnoreContextDepth` counter checked by `emitAsyncErrorEvent`, exposed via `isAsyncErrorIgnoreContextActive()`). Crucially this also covers **fire-and-forget** operations: `addErrorHandler` (`mnaoumov/typescript-lib:src/async.ts`) captures the active ignore context synchronously at schedule time and passes it as `emitAsyncErrorEvent(error, shouldIgnore)`, so a rejection that settles during the `afterEach` drain — after the `using` scope has exited — is still ignored. No manual `waitForAllAsyncOperations()` in the test is needed. Only operations scheduled *inside* the context are ignored; one scheduled outside is still reported.

### Framework

- Vitest with explicit imports (globals: false) — always import `describe`, `it`, `expect`, etc. from `'vitest'`
- Test environment: `node` by default; use `// @vitest-environment jsdom` directive for browser tests
- Coverage provider: v8
- **`unit-tests:obsidian` runs on `pool: 'vmThreads'`, and the one thing that costs is `vi.stubGlobal('window' | 'document', …)`, which throws there.** The pool builds the jsdom once per worker instead of once per test file — measured 2026-09-15 at `test:coverage` 149.79 s → 56.88 s and that project alone 36.06 s → 9.92 s, since Vitest's own advisory had 67% of tracked time going on jsdom construction. Isolation is unaffected (probed directly: no DOM, `globalThis` or prototype state crosses files in one worker) and so is coverage (`coverage/lcov.info` byte-identical to the default pool's over a six-file subset). But a VM context's `window` and `document` are **non-configurable accessors** on its global, so `vi.stubGlobal` fails with `Cannot redefine property: window` — JS semantics, not something to route around. Every other global (`FileReader`, `Image`, `getComputedStyle`, `fetch`, `electron`) stubs normally. A test that needs to stub one of those two goes in `GLOBAL_STUB_TEST_FILES` in `scripts/vitest-config.ts`, which is the sibling `unit-tests:obsidian-global-stubs` project on the default pool. The other remedy the advisory names, `isolate: false`, was measured and is not a trade-off worth revisiting: **91.62 s, slower than the 36.06 s baseline**, with 68 tests failing on shared state. **The shared `defineObsidianPluginVitestConfig` gives every consuming plugin the same pool** on its `unit-tests` project, with the same escape hatch as a context field, `globalStubTestFiles`, which emits a `unit-tests:global-stubs` sibling only when non-empty. Two facts measured before that shipped (2026-09-16) widen what is written above. **The locked set is four globals, not two:** listing the VM global's non-configurable own properties under `jsdom` gives `window`, `top`, `document` and `location` (the default pool locks none of them), and the one that a grep for `stubGlobal` misses is `Object.defineProperty(window, 'location', …)` — a common way to fake `location.reload`. So check a suite by running it with `--pool=vmThreads`, not by grepping it. **The VM context also LACKS globals, silently:** Vitest copies only a fixed handful of Node globals into the `jsdom` window, so `crypto.subtle`, the Web Streams classes, `CompressionStream`, the `Performance*` classes and `URLPattern` are absent under the VM pool while present under the default one. A plugin's canvas hashing failed on `crypto.subtle.digest`, and feature-detecting code would instead pass while testing a fallback Obsidian never runs. `restoreNodeWebGlobals` (`src/node-web-globals.ts`), called from `setup()`, defines each missing name from its Node module and leaves present ones alone. And the project's `execArgv` flag that turns off Node's Web Storage still reaches a `vmThreads` worker: `process.execArgv` carries it and Node's own `localStorage` descriptor is absent, as under `threads`.
  - **A per-file module realm is why `installWarningsAsErrors` marks its listener instead of comparing identity.** Under this pool each test file evaluates the module afresh while `process` stays shared per worker, so an identity check matches nothing and every file appends another `'warning'` listener until Node's `MaxListenersExceededWarning` — which that listener rethrows, failing a blameless file. Any other per-worker registration added here needs the same treatment.
- **A `unit-tests:eslint-typecheck` case timing out at 60 s is machine load, not a broken rule — retry rather than investigate.** That project runs `maxWorkers: 1` with `isolate: false` (`scripts/vitest-config.ts`) and every `@typescript-eslint/rule-tester` case builds a type-aware program, so it is the first thing in the suite to blow the per-test timeout when the box is busy — one case was measured at 141 s under load. It fails as a bare `Error: Test timed out in 60000ms.` inside `RuleTester.js` with no assertion message, which reads like a real regression. Confirm by running the named file alone (`npx vitest run <file>`): if it passes there, nothing is wrong. Do not run `find-overexposed` or another gate concurrently with `test:coverage` — that alone was enough to fail two runs on 2026-09-02, and a failed run also wipes `coverage/`, so there is no lcov left to decode afterwards.
- **`reporters` is PINNED to `['default']`, because vitest's fallback is not one reporter but two — and the one an AI session gets prints no per-file line at all.** An unset `reporters` resolves to `isAgent ? 'minimal' : 'default'`, and `std-env`'s `isAgent` is true inside every AI coding session (it reads `AI_AGENT` plus a dozen tool-specific variables). `MinimalReporter` extends the default one with `summary: false`, `silent: 'passed-only'`, and a `printTestModule` that returns early unless the module FAILED, so a passing file prints nothing at all. Measured here 2026-09-23 on `unit-tests:script-utils` (43 files, vitest 5.0.1), the same command both ways: **0 per-file lines over a 13-line log unset, 46 over a 58-line log pinned**. And `silent: 'passed-only'` also swallows a passing test's console output, so a `console.log` added to find something vanishes for a session and not for a developer. The pin lives in `DEFAULT_VITEST_REPORTERS` (`mnaoumov/typescript-dev-toolkit:src/test-runners/vitest-config.ts`, re-exported by `mnaoumov/obsidian-dev-toolkit:src/test-runners/vitest-config.ts`), is applied by `defineObsidianPluginVitestConfig` so **every consuming plugin gets it**, and is imported by `scripts/vitest-config.ts` rather than restated, since this repo's own config predates the factory. If a test log ever comes back with only totals, check this before suspecting the suite.
- **Do NOT add a reporter that names the file a dead pool worker took with it — vitest 5 does that itself.** `emitUnexpectedExit` is `(code, signal) => …` there, and builds its message from the exit code, the signal, the runner state and the files the worker held. Driven against real runs here on 2026-09-23 in all four shapes: a worker `SIGKILL`ed mid-file, one killed at import before collection, the same under `minimal`, and the realistic one — the dying file among 42 others in a parallel run, which reported `42 passed (43)` AND named the file. Under vitest 4 none of that existed, the run said only `167 passed (168)`, and a reporter reconciling the specifications `onTestRunStart` hands over against the modules that actually reported was the only way to learn which file was lost. Lifting such a reporter into this library was considered on 2026-09-23 and DROPPED on the measurement above: on vitest 5 it would be a module, a test file and a 100%-coverage burden for every consumer, carrying a claim that is no longer true.
