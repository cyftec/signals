# @cyftec/signals

A TypeScript signal library with mutable source values, eagerly maintained derived values,
synchronous effects, and data-specific helpers.

## Installation

```bash
bun add @cyftec/signals
```

## Quick start

```ts
import { deadZone, derive, effect, op, signal } from "@cyftec/signals";

const count = signal(1);
const doubled = derive(() => count.value * 2);

const receiver = effect(() => {
  console.log(count.value, doubled.value);
  console.log(deadZone(() => count.value)); // evaluated without subscribing
});

count.value = 2;
receiver.dispose(); // stop future automatic reruns

const label = op(count).isBetween(1, 10).then("in range", "outside");
console.log(label.value); // "in range"
```

`effect()` runs immediately. Source signals read during that initial run become
dependencies until `receiver.dispose()` is called, and later writes rerun the
effect synchronously. Disposal is idempotent; `receiver.run()` remains
available for a manual, non-collecting run.

`derive()` runs its catcher immediately, stores the result, and recomputes
synchronously when a source read during that first run changes. `.value` reads
the stored result; `prevValue` exposes the preceding result, and `dispose()`
stops future recomputation.

Use `deadZone(callback)` during an effect's initial run to evaluate signal reads
without making them dependencies. Individual source and derived signals also
provide `nonReactiveValue` for a single non-collecting read.

## Highlights

- Writable source signals via `signal()` and eager read-only projections via
  `derive()`.
- Synchronous effects with fixed, disposable dependencies.
- `deadZone()` and `nonReactiveValue` for explicitly non-collecting reads.
- Array, object, string, number, and boolean helper families selected from the
  initial value.
- Convenience APIs: `compute`, `tmpl`, `receive`, `transmit`, `promstates`,
  `nullable`, `op`, and `dispose`.
- Lazy operation chains with eager reactive terminal values for generic logic,
  numeric arithmetic and comparisons, and string or array length checks.
- Universal generic comparisons, including `Date`-to-number comparisons, with
  native JavaScript coercion and error behavior.
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
