# @cyftec/signals

`@cyftec/signals` is a TypeScript signal library with mutable source values,
lazy derived values, synchronous effects, and data-specific helpers.

## Install

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

`effect()` runs its callback immediately. Source signals read during that
initial run are permanently connected to the effect; their later writes run the
callback synchronously. The receiver returned by `effect()` has no disposal
API.

`derive()` creates a lazy value getter. The catcher runs whenever
`.value` is read; it does not cache a result, maintain a previous value, or
notify dependents on its own.

## Data-specific helpers

Source signals attach generic logical helpers and a method family selected from
the initial value (or the optional second argument):

```ts
const items = signal([1, 2, 3]);
const last = items.lastItem();
items.mutate.push(4);
console.log(last.value); // 4

const user = signal({ name: "Ada", active: false });
const name = user.get("name");
user.mutate.set({ active: true });

const text = signal<string | undefined>(undefined, "");
text.value = "  hello  ";
console.log(text.trim().value); // "hello"
```

Arrays, plain objects, strings, numbers, and source booleans receive their
respective helpers. Mutators are available only on source signals beneath
`.mutate`; projections always return a lazy `DerivedSignal`.

## Main exports

- `signal`, `derive`, and `effect`
- `compute`, `tmpl`, `receive`, and `transmit`
- `promstates` and `nullable`
- `value`, `getPlainMethodParams`, and runtime signal guards

See [semantics](./docs-architecture/semantics.md) for the behavioral contract,
[behavior](./docs-architecture/behavior.md) for the API inventory, and
[overview](./docs-architecture/overview.md) for implementation details.

## Development

```bash
bun install
bun run test:runtime
bun run test:coverage
bun run build:meta
bun run build:validate
```

Run `bun run test:types` to verify the public TypeScript contract, including
directional widening such as assigning `Signal<number>` where
`Signal<number | boolean | string>` is expected.
