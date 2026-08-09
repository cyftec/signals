# @cyftec/signal

[![npm version](https://img.shields.io/npm/v/@cyftec/signal.svg)](https://www.npmjs.com/package/@cyftec/signal)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`@cyftec/signal` is a small reactive state library for TypeScript. It provides mutable source signals, read-only derived signals, synchronous effects, snapshot-style dead signals, and data-specific helpers attached directly to signals.

The current package version is `0.2.4`. This implementation has its own semantics; do not infer its behavior from another signal library.

## Install

```bash
bun add @cyftec/signal
```

## Quick start

```ts
import { derive, effect, signal } from "@cyftec/signal";

const count = signal(1);
const doubled = derive(() => count.value * 2);

const logger = effect(() => {
  console.log({ count: count.value, doubled: doubled.value });
});

count.value = 2; // the effect runs synchronously

logger.dispose(); // unsubscribes immediately
doubled.dispose();
```

An effect runs once when it is created. Signal reads made during that initial run establish its dependencies. Later writes propagate synchronously; there is no batching or scheduler.

## Data-specific methods

Source-signal mutations live under `.mutate`. Read-only methods return signals instead of plain values.

```ts
const items = signal([1, 2, 3]);
const last = items.lastItem();

items.mutate.push(4);
console.log(last.value); // 4

const user = signal({ name: "Ada", active: false });
const name = user.get("name");

user.mutate.set({ name: "Grace" });
console.log(name.value); // "Grace"

const enabled = signal(false);
enabled.mutate.toggle();
```

Arrays, objects, strings, numbers, and booleans receive methods appropriate to their initial runtime value. For a nullable signal, pass a non-null exemplar as the second argument so the method family can be attached:

```ts
const names = signal<string[] | undefined>(undefined, []);
names.value = ["Ada", "Grace"];
```

Object and array initial values and `.value` reads are copied, but assigned values are retained by reference. After assigning an object or array, do not mutate that original value; use another assignment or `.mutate` so subscribers are notified. Treat the low-level `prevValue` and `nonReactiveValue` views as read-only because they can expose stored references.

## Generic logical methods

Primitive, string, and array signals expose fluent logical helpers:

```ts
const count = signal(3);

const positive = count.is.greaterThan(0);
const label = count.if.greaterThan(0).then("positive", "not positive");
const fallback = signal<string | undefined>(undefined, "").or("anonymous");
```

Live inputs return reactive `DerivedSignal` results. `deadSignal(...)` inputs return `DeadSignal` snapshots.

## Main exports

- `signal`, `derive`, `effect`, `dispose`
- `deadSignal` for read-only non-live values with the same projection helpers
- `compute`, `tmpl`, `receive`, and `transmit`
- `promstates` for promise result, error, and running state
- `nullable` for adding generic logical methods to possibly-null primitive inputs
- `op` for the older chainable operation API
- `value` and the `valueIs...` runtime type guards

See the source-backed contracts in [`docs-architecture/semantics.md`](./docs-architecture/semantics.md), the API inventory in [`docs-architecture/behavior.md`](./docs-architecture/behavior.md), the signal-widening contract in [`docs-architecture/type-variance.md`](./docs-architecture/type-variance.md), and the contributor model in [`docs-architecture/overview.md`](./docs-architecture/overview.md).

## Development

```bash
bun install
bun run test
```

Useful commands:

- `bun run test:runtime` — run behavioral tests
- `bun run test:types` — run TypeScript type checks
- `bun run test:coverage` — collect runtime coverage
- `bun run build:meta` — rebuild source-comment metadata for the website
- `bun run build:validate` — validate generated metadata
- `bun run docs` — rebuild metadata and publish the static website with Brahma
- `bun run setup:hooks` — configure the repository pre-commit hook

Generated website output lives under `docs/`. Edit source comments or files under `website/dev/`, then regenerate; do not hand-edit the generated output.
