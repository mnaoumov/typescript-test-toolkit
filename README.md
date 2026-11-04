# @mnaoumov/typescript-test-toolkit

Generic test support for TypeScript projects: a Vitest / Jest per-test setup, async-operation tracking (`waitForAllAsyncOperations`), `strictProxy` and mock helpers. Install it as a dev dependency.

## Installation

```bash
npm install --save-dev @mnaoumov/typescript-test-toolkit
```

## Documentation

The guides and the API reference are at [mnaoumov.dev/typescript-test-toolkit](https://mnaoumov.dev/typescript-test-toolkit/).

## Where it fits

It is one of five packages that replace [`obsidian-dev-utils`](https://github.com/mnaoumov/obsidian-dev-utils): [`@mnaoumov/typescript-lib`](https://github.com/mnaoumov/typescript-lib), [`@mnaoumov/typescript-test-toolkit`](https://github.com/mnaoumov/typescript-test-toolkit), [`@mnaoumov/typescript-dev-toolkit`](https://github.com/mnaoumov/typescript-dev-toolkit), [`@mnaoumov/obsidian-lib`](https://github.com/mnaoumov/obsidian-lib) and [`@mnaoumov/obsidian-dev-toolkit`](https://github.com/mnaoumov/obsidian-dev-toolkit). It depends on [`@mnaoumov/typescript-lib`](https://github.com/mnaoumov/typescript-lib). It moved here from that repository with its history.

## See also

[My other Obsidian resources](https://mnaoumov.dev/obsidian/)

| Library | Features | How `@mnaoumov/typescript-test-toolkit` differs |
| --- | --- | --- |
| [`@mnaoumov/obsidian-dev-toolkit`](https://github.com/mnaoumov/obsidian-dev-toolkit) (my tool) | Obsidian plugin builds and releases; shared `ESLint` and `Vitest` configurations; per-test setup for plugin tests | Generic foundation of `@mnaoumov/obsidian-dev-toolkit`'s per-test setup; usable outside Obsidian; leaves the Obsidian state reset and plugin tooling to that toolkit |
| [`@total-typescript/shoehorn`](https://github.com/total-typescript/shoehorn) | Typed partial test fixtures: `fromPartial`, `fromAny`, `fromExact` | Same goal as `@total-typescript/shoehorn` for typed partial objects; `strictProxy` also throws at runtime when an unmocked member is read; no `fromAny` or `fromExact` equivalents |
| [`flush-promises`](https://github.com/kentor/flush-promises) | Awaits pending promise callbacks in a test | Narrower than `flush-promises` in what it waits for: only operations reported through `@mnaoumov/typescript-lib`'s async hook; adds failing a test on an unhandled async error and per-test setup |
| [`jest-fail-on-console`](https://github.com/ValentinH/jest-fail-on-console) | Fails Jest tests on `console` calls, `error` and `warn` by default; per-method options; allowed and silenced messages | Different policy from `jest-fail-on-console`: silences every `console` method instead of failing on it; adds async-operation tracking, warnings as errors and mock helpers |
| [`jest-mock-extended`](https://github.com/marchaos/jest-mock-extended) | Type-safe Jest mocks of interfaces; `calledWith`; deep mocks; fallback implementations | Covers part of `jest-mock-extended`: `strictProxy` throws on an unmocked member instead of returning an auto-mock; no `calledWith` or deep auto-mocks |
| [`vitest-fail-on-console`](https://github.com/thomasbrodusch/vitest-fail-on-console) | Fails Vitest tests on `console` calls, `error` and `warn` by default; per-method options; allowed and silenced messages | Different policy from `vitest-fail-on-console`: silences every `console` method instead of failing on it; adds async-operation tracking, warnings as errors and mock helpers |
| [`vitest-mock-extended`](https://github.com/eratio08/vitest-mock-extended) | Type-safe Vitest mocks of interfaces; `calledWith`; deep mocks; fallback implementations | Covers part of `vitest-mock-extended`: `strictProxy` throws on an unmocked member instead of returning an auto-mock; `mockImplementation` spies with access to the original method; no `calledWith` or deep auto-mocks |

Last searched for similar libraries on 2026-11-04.

## Filing an issue (for AI agents and humans)

Open issues through the [issue forms](https://github.com/mnaoumov/typescript-test-toolkit/issues/new/choose), not as blank issues.

Filing from the CLI or the API (`gh issue create --body`, or an AI agent filing for you) skips the form, and `gh issue create --template` cannot load an issue form. In that case, open the matching form in [`.github/ISSUE_TEMPLATE/`](https://github.com/mnaoumov/typescript-test-toolkit/tree/HEAD/.github/ISSUE_TEMPLATE), copy every field as a `### <label>` heading in the form's order, and fill in each one. Always state the version you used and your operating system.

## License

© [Michael Naumov](https://github.com/mnaoumov/)
