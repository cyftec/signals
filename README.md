# @cyftec/signals

A TypeScript signal library with mutable source values, lazy derived values,
synchronous effects, and data-specific helpers.

## Installation

```bash
bun add @cyftec/signals
```

## Quick start

```ts
import { derive, effect, signal } from "@cyftec/signals";

const count = signal(1);
const doubled = derive(() => count.value * 2);

effect(() => {
  console.log(count.value, doubled.value);
});

count.value = 2;
```

`effect()` runs immediately. Source signals read during that initial run become
permanent dependencies, and later writes rerun the effect synchronously.

`derive()` is lazy: its catcher runs every time `.value` is read. Derived
signals do not cache, retain prior values, or independently notify effects.

## Highlights

- Writable source signals via `signal()` and lazy read-only projections via
  `derive()`.
- Synchronous effects with fixed dependencies.
- Array, object, string, number, and boolean helper families selected from the
  initial value.
- Convenience APIs: `compute`, `tmpl`, `receive`, `transmit`, `promstates`,
  and `nullable`.
- Directional TypeScript variance for signal containers.

## Documentation

The detailed behavioral contract, API inventory, architecture, type-variance
rules, development workflow, and maintainer instructions are in
[AGENTS.md](./AGENTS.md). That document is authoritative for repository
semantics; this README is intentionally a concise introduction.

## Development

This project is Bun-first.

```bash
bun install
bun run test
bun run test:coverage
bun run build:meta
bun run build:validate
```

Run `bun run test:types` to check the public TypeScript contract.

## Contributing

Contributions are welcome. Please read the [contribution guidelines](./CONTRIBUTING.md)
before opening an issue or pull request. In particular, this library has its
own reactive semantics: changes must be grounded in its source, tests, and
technical reference rather than assumptions from another reactive library.

## Issues and pull requests

Use the GitHub **New issue** flow to select the bug-report or feature-request
template. Pull requests automatically receive a template covering summary,
validation, semantics, and documentation. See the
[contribution guidelines](./CONTRIBUTING.md) for the expected workflow.

## Code of conduct

Participation in this project is governed by the
[Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to follow
it.

## License

This project is licensed under the [MIT License](./LICENSE).
