# CHANGELOG

## 1.0.3

- build(deps): accept @mnaoumov/typescript-lib 2
- refactor(warnings-as-errors): rename the warning listener marker to a typescript-test-toolkit name
- chore(build): drop the duplicate build:compile:typescript script
- build(docs): swap the local documentation checks for typescript-dev-toolkit 3.7.0's shared modules
- docs: check guide snippets and retired obsidian-dev-utils references

## 1.0.2

- build(deps): bump @mnaoumov/typescript-dev-toolkit to 3.6.2
- docs(site): replace the logo and favicon with the approved mark
- build: validate that dist imports only installed dependencies
- ci(docs-site): set the repository homepage from the docs site build
- docs: show the package logo as the documentation site's hero image
- docs: link mnaoumov.dev/typescript-test-toolkit from the README

## 1.0.1

- docs: publish the documentation site at mnaoumov.dev/typescript-test-toolkit
- docs: name the setup and tracking endpoints by this package, not obsidian-dev-utils
- build: add the lockfile, resolved against npm now that every sibling is published
- docs: drop the stale note about the seeded lock holding obsidian 1.13.1

## 1.0.0

- Initial release as a standalone repository: the package moved out of the [`obsidian-dev-utils`](https://github.com/mnaoumov/obsidian-dev-utils) workspace with its history, and its version line restarts at `1.0.0`
